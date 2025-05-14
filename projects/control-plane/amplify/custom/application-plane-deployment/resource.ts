import {
  aws_stepfunctions as sfn,
  aws_logs as logs,
  RemovalPolicy,
  aws_ssm as ssm,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export interface ApplicationPlaneDeploymentProps {
  /**
   * ステートマシンのARNを格納する為のSSMパラメータの名前
   */
  paramNameForSFNArn: string;
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
        sfn.Chain.start(new sfn.Pass(this, "PassState"))
      ),
    });

    this.arnParam = new ssm.StringParameter(this, "ArnParam", {
      stringValue: this.stateMachine.stateMachineArn,
      parameterName: props.paramNameForSFNArn,
    });
  }
}
