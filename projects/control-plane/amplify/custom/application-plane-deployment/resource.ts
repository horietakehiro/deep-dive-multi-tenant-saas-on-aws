import * as fs from "fs";
import { fileURLToPath } from "url";
import {
  aws_stepfunctions as sfn,
  aws_stepfunctions_tasks as sfnTasks,
  aws_logs as logs,
  RemovalPolicy,
  aws_ssm as ssm,
  aws_iam as iam,
  aws_lambda_nodejs as nodejsLambda,
  Duration,
} from "aws-cdk-lib";
import { type GetParameterCommandInput } from "@aws-sdk/client-ssm";
import { Construct } from "constructs";
import path from "path";
import {
  Input as CreateAppFunctionInput,
  Output,
} from "./functions/create-app-function";
import {
  CreateAppCommandInput,
  CreateBranchCommandInput,
  CreateDomainAssociationCommandInput,
  GetAppCommandInput,
} from "@aws-sdk/client-amplify";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export interface ApplicationPlaneDeploymentProps {
  /**
   * ステートマシンのARNを格納する為のSSMパラメータの名前
   */
  paramNameForSFNArn: string;
  paramNameForGithubAccessToken: string;
  repositoryURL: string;
  domainName: string;
}
export class ApplicationPlaneDeployment extends Construct {
  public readonly stateMachine: sfn.IStateMachine;
  public readonly arnParam: ssm.IParameter;
  constructor(
    scope: Construct,
    id: string,
    props: ApplicationPlaneDeploymentProps
  ) {
    super(scope, id);
    const parameter = new ssm.StringParameter(this, "BuildSpecParam", {
      stringValue: fs
        .readFileSync(path.join(__dirname, "../../../../../amplify.yml"))
        .toString("utf-8"),
    });
    const amplifyServiceRole = new iam.Role(this, "AmplifyServiceRole", {
      assumedBy: new iam.ServicePrincipal("amplify.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmplifyBackendDeployFullAccess"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("ReadOnlyAccess"),
      ],
      inlinePolicies: {
        root: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:CreateLogGroup",
                "logs:DescribeLogGroups",
              ],
              resources: ["*"],
            }),
          ],
        }),
      },
    });
    const createAppFunction = new nodejsLambda.NodejsFunction(
      this,
      "CreateAppFunction",
      {
        entry: path.join(__dirname, "functions", "create-app-function.ts"),
        handler: "handler",
        timeout: Duration.seconds(60),
      }
    );
    createAppFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["kms:Decrypt", "ssm:GetParameter"],
        resources: ["*"],
      })
    );
    createAppFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["iam:PassRole"],
        resources: [amplifyServiceRole.roleArn],
      })
    );
    createAppFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["amplify:CreateApp"],
        resources: ["*"],
      })
    );

    this.stateMachine = new sfn.StateMachine(this, "StateMachine", {
      logs: {
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
        destination: new logs.LogGroup(this, "LogGroup", {
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
      },
      queryLanguage: sfn.QueryLanguage.JSONATA,
      definitionBody: sfn.DefinitionBody.fromChainable(
        sfn.Chain.start(
          new sfnTasks.LambdaInvoke(this, "InvokeAppCreationFunction", {
            lambdaFunction: createAppFunction,
            comment:
              "Amplifyアプリケーションとしてアプリケーションのデプロイを開始するためのLambda関数を実行する。※処理の過程でGitHubのアクセストークンを扱う必要があるので、ステートマシンのログに出力されないようLambda関数として実行する。",
            integrationPattern: sfn.IntegrationPattern.REQUEST_RESPONSE,
            invocationType: sfnTasks.LambdaInvocationType.REQUEST_RESPONSE,
            payload: sfn.TaskInput.fromObject({
              amplifyServiceRoleARN: amplifyServiceRole.roleArn,
              paramNameForGitHubToken: props.paramNameForGithubAccessToken,
              repositoryURL: props.repositoryURL,
              tenantId: "{% $states.input.tenantId %}",
              paramNameForBuildSpec: parameter.parameterName,
            } as CreateAppFunctionInput),
            assign: {
              appId: "{% $states.result.Payload.appId %}",
            },
          })
        )
          .next(
            new sfn.Wait(this, "Wait", {
              time: sfn.WaitTime.duration(Duration.seconds(15)),
            })
          )
          .next(
            new sfnTasks.CallAwsService(this, "CreateBranch", {
              service: "amplify",
              action: "createBranch",
              iamResources: ["*"],
              parameters: {
                AppId: "{% $appId %}",
                BranchName: "main",
                Stage: "PRODUCTION",
                EnableAutoBuild: true,
                Framework: "web",
              } as unknown as CreateAppCommandInput,
              outputs: {},
            })
          )
          .next(
            new sfnTasks.CallAwsService(this, "CreateDomainAssociation", {
              service: "amplify",
              action: "createDomainAssociation",
              iamResources: ["*"],
              parameters: {
                AppId: "{% $appId %}",
                DomainName: props.domainName,
                SubDomainSettings: [
                  {
                    BranchName: "main",
                    Prefix: "{% $appId %}",
                  },
                ],
                AutoSubDomainCreationPatterns: [],
                CertificateSettings: {
                  Type: "AMPLIFY_MANAGED",
                },
              } as unknown as CreateDomainAssociationCommandInput,
            })
          )
        // .next(
        //   new sfnTasks.CallAwsService(this, "GetApplication", {
        //     service: "amplify",
        //     action: "getApplication",
        //     iamResources: ["*"],
        //     parameters: {
        //       appId: "{% $appId %}",
        //     } as GetAppCommandInput,
        //     outputs: {},
        //   })
        // )
        // .next(
        //   new sfn.Choice(this, "CheckCreateAppCompleted", {}).when(
        //     sfn.Condition.stringEquals()
        //   )
        // )
      ),
    });

    this.arnParam = new ssm.StringParameter(this, "ArnParam", {
      stringValue: this.stateMachine.stateMachineArn,
      parameterName: props.paramNameForSFNArn,
    });
  }
}
