import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { env } from "process";
import type { Schema } from "../../../data/resource";
export const PARAM_NAME_FOR_SFN_ARN = "PARAM_NAME_FOR_SFN_ARN";

const paramNameForSFNArn = env[PARAM_NAME_FOR_SFN_ARN];
const ssmClient = new SSMClient();
const sfnClient = new SFNClient();

/**
 * テナント専用のアプリケーションプレーンのデプロイジョブを実行する
 * @param event
 */
export const handler: Schema["invokeApplicationPlaneDeployment"]["functionHandler"] =
  async (event) => {
    console.log(event);
    console.log("パラメータストアからステートマシンのARNを取得する");
    const ssmRes = await ssmClient.send(
      new GetParameterCommand({
        Name: paramNameForSFNArn,
      })
    );
    console.log(ssmRes);
    if (
      ssmRes.Parameter === undefined ||
      ssmRes.Parameter.Value === undefined
    ) {
      throw Error(`パラメータ[${paramNameForSFNArn}]からARNの取得に失敗`);
    }
    const arn = ssmRes.Parameter.Value;

    console.log("アプリケーションプレーンのデプロイジョブを非同期実行");
    const res = await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn: arn,
        input: JSON.stringify({
          tenantId: event.arguments.tenantId,
        }),
      })
    );
    console.log(res);
    return res.executionArn!;
  };
