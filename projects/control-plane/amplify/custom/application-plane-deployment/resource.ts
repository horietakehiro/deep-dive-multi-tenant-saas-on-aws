import {
  aws_stepfunctions as sfn,
  aws_stepfunctions_tasks as sfnTasks,
  aws_logs as logs,
  RemovalPolicy,
  aws_ssm as ssm,
  aws_iam as iam,
} from "aws-cdk-lib";
import { type GetParameterCommandInput } from "@aws-sdk/client-ssm";
import { Construct } from "constructs";

export interface ApplicationPlaneDeploymentProps {
  /**
   * ステートマシンのARNを格納する為のSSMパラメータの名前
   */
  paramNameForSFNArn: string;
  paramNameForGithubAccessToken: string;
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

    this.stateMachine = new sfn.StateMachine(this, "StateMachine", {
      logs: {
        level: sfn.LogLevel.ALL,
        includeExecutionData: true,
        destination: new logs.LogGroup(this, "LogGroup", {
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
      },
      definitionBody: sfn.DefinitionBody.fromChainable(
        sfn.Chain.start(
          new sfnTasks.CallAwsService(this, "GetGitHubAccessToken", {
            queryLanguage: sfn.QueryLanguage.JSONATA,
            service: "ssm",
            action: "getParameter",
            additionalIamStatements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["kms:Decrypt"],
                resources: ["*"],
              }),
            ],
            iamResources: ["*"],
            parameters: {
              Name: props.paramNameForGithubAccessToken,
              WithDecryption: true,
            } as GetParameterCommandInput,
            outputs: {
              GitHubPersonalAccessToken: "{% $states.result.Parameter.Value %}",
            },
          })
        )
      ),
    });

    this.arnParam = new ssm.StringParameter(this, "ArnParam", {
      stringValue: this.stateMachine.stateMachineArn,
      parameterName: props.paramNameForSFNArn,
    });
  }
}
