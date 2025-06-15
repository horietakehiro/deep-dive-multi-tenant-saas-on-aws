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
  aws_lambda as lambda,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import path from "path";
import { Input as CreateAppFunctionInput } from "./create-app/handler";
import { Input as UpdateTenantFunctionInput } from "./update-tenant/handler";
import {
  CreateBranchCommandInput,
  CreateDomainAssociationCommandInput,
  DomainStatus,
  GetAppCommandInput,
  GetDomainAssociationCommandInput,
  GetJobCommandInput,
  JobStatus,
  StartJobCommandInput,
} from "@aws-sdk/client-amplify";
import { Choice } from "aws-cdk-lib/aws-stepfunctions";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Primitives =
  | string
  | number
  | boolean
  | undefined
  | null
  | symbol
  | bigint
  | string[]
  | number[]
  | boolean[]
  | bigint[];

/**
 * キャメル形式のAWS SDKのリクエストパラメータを、ステートマシンタスクの引数に渡すためのアッパーキャメル形式に変換するための型定義
 *
 * [参考URL](https://medium.com/@fullstack-shepherd/typescript-transforming-types-with-snake-case-keys-to-camelcase-keys-or-how-to-keep-busy-in-9d5f074d9bfa)
 */
type CapitalizeCommandInput<T> = {
  [key in keyof T as key extends string
    ? T[key] extends Function
      ? key
      : key extends keyof ArrayLike<any> | symbol
        ? key
        : Capitalize<key>
    : key]: T[key] extends Primitives ? T[key] : CapitalizeCommandInput<T[key]>;
};

export interface ApplicationPlaneDeploymentProps {
  paramNameForGithubAccessToken: string;
  repositoryURL: string;
  domainName: string;
  branchName: string;
  updateTenantFunction: lambda.IFunction;
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
    const buildSpecParameter = new ssm.StringParameter(
      this,
      "BuildSpecParameter",
      {
        stringValue: fs
          .readFileSync(path.join(__dirname, "../../../../../amplify.yml"))
          .toString("utf-8"),
      }
    );
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
        entry: path.join(__dirname, "create-app", "handler.ts"),
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
    const invokeCreateAppFunction = new sfnTasks.LambdaInvoke(
      this,
      "InvokeAppCreationFunction",
      {
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
          paramNameForBuildSpec: buildSpecParameter.parameterName,
        } as CreateAppFunctionInput),
        assign: {
          appId: "{% $states.result.Payload.appId %}",
          tenantId: "{% $states.input.tenantId %}",
        },
      }
    );
    const waitForDomainAssociation = new sfn.Wait(
      this,
      "WaitForDomainAssociation",
      {
        time: sfn.WaitTime.duration(Duration.seconds(30)),
      }
    );
    const createBranch = new sfnTasks.CallAwsService(this, "CreateBranch", {
      comment: `${props.branchName}ブランチを本番環境として設定する`,
      service: "amplify",
      action: "createBranch",
      iamResources: ["*"],
      parameters: {
        AppId: "{% $appId %}",
        BranchName: props.branchName,
        Stage: "PRODUCTION",
        EnableAutoBuild: true,
        Framework: "web",
      } as CapitalizeCommandInput<CreateBranchCommandInput>,
      outputs: {},
    });
    const createDomainAssociation = new sfnTasks.CallAwsService(
      this,
      "CreateDomainAssociation",
      {
        comment: `${props.branchName}ブランチにカスタムドメインを設定する`,
        service: "amplify",
        action: "createDomainAssociation",
        iamResources: ["*"],
        additionalIamStatements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              "route53:ChangeResourceRecordSets",
              "route53:ListHostedZonesByName",
              "route53:ListResourceRecordSets",
              "route53:ListHostedZones",
            ],
            resources: ["*"],
          }),
        ],
        parameters: {
          AppId: "{% $appId %}",
          DomainName: props.domainName,
          SubDomainSettings: [
            {
              BranchName: props.branchName,
              Prefix: "{% $appId %}",
            },
          ],
          AutoSubDomainCreationPatterns: [],
          CertificateSettings: {
            Type: "AMPLIFY_MANAGED",
          },
        } as CapitalizeCommandInput<CreateDomainAssociationCommandInput>,
      }
    );
    const getDomainAssociation = new sfnTasks.CallAwsService(
      this,
      "GetDomainAssociation",
      {
        comment: "カスタムドメインの設定状況を取得する",
        action: "getDomainAssociation",
        service: "amplify",
        iamResources: ["*"],
        parameters: {
          AppId: "{% $appId %}",
          DomainName: props.domainName,
        } as unknown as GetDomainAssociationCommandInput,
        assign: {
          domainStatus: "{% $states.result.DomainAssociation.DomainStatus %}",
        },
      }
    );
    const domainStatusChoice = new Choice(this, "DomainStatusChoice", {
      comment: "カスタムドメインの設定状況を確認する",
    });
    const domainStatusConditionFn = (status: DomainStatus) =>
      sfn.Condition.jsonata(`{% $domainStatus = '${status}' %}`);

    const startJob = new sfnTasks.CallAwsService(this, "StartJob", {
      comment: "アプリケーションプレーンのデプロイジョブを実行する",
      service: "amplify",
      action: "startJob",
      iamResources: ["*"],
      parameters: {
        AppId: "{% $appId %}",
        BranchName: props.branchName,
        JobType: "RELEASE",
        JobReason: "first release",
      } as CapitalizeCommandInput<StartJobCommandInput>,
      assign: {
        jobId: "{% $states.result.JobSummary.JobId %}",
      },
    });
    const getJob = new sfnTasks.CallAwsService(this, "GetJob", {
      comment: "ジョブの状態を確認する",
      service: "amplify",
      action: "getJob",
      iamResources: ["*"],
      parameters: {
        AppId: "{% $appId %}",
        BranchName: props.branchName,
        JobId: "{% $jobId %}",
      } as CapitalizeCommandInput<GetJobCommandInput>,
      assign: {
        jobStatus: "{% $states.result.Job.Summary.Status %}",
      },
    });
    const waitForJob = new sfn.Wait(this, "WaitForJob", {
      time: sfn.WaitTime.duration(Duration.seconds(30)),
    });
    const jobStatusConditionFn = (status: JobStatus) =>
      sfn.Condition.jsonata(`{% $jobStatus = '${status}' %}`);
    const jobStatusChoice = new sfn.Choice(this, "JobStatusChoice", {
      comment: "ジョブの実行状態を確認する",
    });

    const invokeUpdateTenantFunction = new sfnTasks.LambdaInvoke(
      this,
      "InvokeUpdateTenantFunction",
      {
        lambdaFunction: props.updateTenantFunction,
        comment: "テナント情報を更新する",
        integrationPattern: sfn.IntegrationPattern.REQUEST_RESPONSE,
        invocationType: sfnTasks.LambdaInvocationType.REQUEST_RESPONSE,
        payload: sfn.TaskInput.fromObject({
          tenantId: "{% $tenantId %}",
          url: `{% 'https://' & $appId & '.${props.domainName}' %}`,
        } as UpdateTenantFunctionInput),
      }
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
        sfn.Chain.start(invokeCreateAppFunction)
          .next(createBranch)
          .next(createDomainAssociation)
          .next(waitForDomainAssociation)
          .next(getDomainAssociation)
          .next(
            domainStatusChoice
              .otherwise(waitForDomainAssociation)
              .when(
                domainStatusConditionFn("FAILED"),
                new sfn.Fail(this, "DomainAssociationFaild", {})
              )
              .when(
                domainStatusConditionFn("AVAILABLE"),
                startJob
                  .next(waitForJob)
                  .next(getJob)
                  .next(
                    jobStatusChoice
                      .otherwise(waitForJob)
                      .when(
                        jobStatusConditionFn("FAILED"),
                        new sfn.Fail(this, "JobFailed", {})
                      )
                      .when(
                        jobStatusConditionFn("SUCCEED"),
                        invokeUpdateTenantFunction
                      )
                  )
              )
          )
      ),
    });

    this.arnParam = new ssm.StringParameter(this, "ArnParam", {
      stringValue: this.stateMachine.stateMachineArn,
    });
  }
}

export interface ApplicationResourceDeploymentProps {
  appName: string;
  branchName: string;
  domainName: string;
  updateTenantFunction: lambda.IFunction;
}
export class ApplicationResourceDeployment extends Construct {
  public readonly stateMachine: sfn.IStateMachine;
  public readonly arnParam: ssm.IParameter;
  constructor(
    scope: Construct,
    id: string,
    props: ApplicationResourceDeploymentProps
  ) {
    super(scope, id);
    const buildSpecParameter = new ssm.StringParameter(
      this,
      "BuildSpecParameter",
      {
        stringValue: fs
          .readFileSync(path.join(__dirname, "../../../../../amplify.yml"))
          .toString("utf-8"),
      }
    );
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
    const getAppId = new sfnTasks.CallAwsService(this, "GetAppId", {
      comment: "アプリケーションプレーンのIDを取得する",
      service: "amplify",
      action: "listApps",
      iamResources: ["*"],
      parameters: {},
      assign: {
        appId: `{% $states.result.Apps[Name = '${props.appName}'][0].AppId %}`,
        tenantId: "{% $states.input.tenantId %}",
      },
    });
    const startJob = new sfnTasks.CallAwsService(this, "StartJob", {
      comment: "アプリケーションプレーンのデプロイジョブを実行する",
      service: "amplify",
      action: "startJob",
      iamResources: ["*"],
      parameters: {
        AppId: "{% $appId %}",
        BranchName: props.branchName,
        JobType: "RELEASE",
        JobReason: "update resources",
      } as CapitalizeCommandInput<StartJobCommandInput>,
      assign: {
        jobId: "{% $states.result.JobSummary.JobId %}",
      },
    });
    const getJob = new sfnTasks.CallAwsService(this, "GetJob", {
      comment: "ジョブの状態を確認する",
      service: "amplify",
      action: "getJob",
      iamResources: ["*"],
      parameters: {
        AppId: "{% $appId %}",
        BranchName: props.branchName,
        JobId: "{% $jobId %}",
      } as CapitalizeCommandInput<GetJobCommandInput>,
      assign: {
        jobStatus: "{% $states.result.Job.Summary.Status %}",
      },
    });
    const waitForJob = new sfn.Wait(this, "WaitForJob", {
      time: sfn.WaitTime.duration(Duration.seconds(30)),
    });
    const jobStatusConditionFn = (status: JobStatus) =>
      sfn.Condition.jsonata(`{% $jobStatus = '${status}' %}`);
    const jobStatusChoice = new sfn.Choice(this, "JobStatusChoice", {
      comment: "ジョブの実行状態を確認する",
    });
    const invokeUpdateTenantFunction = new sfnTasks.LambdaInvoke(
      this,
      "InvokeUpdateTenantFunction",
      {
        lambdaFunction: props.updateTenantFunction,
        comment: "テナント情報を更新する",
        integrationPattern: sfn.IntegrationPattern.REQUEST_RESPONSE,
        invocationType: sfnTasks.LambdaInvocationType.REQUEST_RESPONSE,
        payload: sfn.TaskInput.fromObject({
          tenantId: "{% $tenantId %}",
          url: `{% 'https://' & $appId & '.${props.domainName}' %}`,
        } as UpdateTenantFunctionInput),
      }
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
        sfn.Chain.start(getAppId)
          .next(startJob)
          .next(waitForJob)
          .next(getJob)
          .next(
            jobStatusChoice
              .otherwise(waitForJob)
              .when(
                jobStatusConditionFn("FAILED"),
                new sfn.Fail(this, "JobFailed", {})
              )
              .when(jobStatusConditionFn("SUCCEED"), invokeUpdateTenantFunction)
          )
      ),
    });

    this.arnParam = new ssm.StringParameter(this, "ArnParam", {
      stringValue: this.stateMachine.stateMachineArn,
    });
  }
}
