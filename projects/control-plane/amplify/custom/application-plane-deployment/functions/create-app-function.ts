import * as fs from "fs";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { AmplifyClient, CreateAppCommand } from "@aws-sdk/client-amplify";
import path from "path";

const ssmClient = new SSMClient();
const amplifyClient = new AmplifyClient();

export interface Input {
  tenantId: string;
  paramNameForGitHubToken: string;
  paramNameForBuildSpec: string;
  amplifyServiceRoleARN: string;
  repositoryURL: string;
}
export interface Output {
  appId: string;
}
/**
 * SSMパラメータストアからGitHubアクセス用のトークンを取得し、それを使用してアプリケーションプレーンをAmplifyアプリケーションとして作成する
 * @param event
 * @param context
 * @returns
 */
export const handler = async (
  event: Input,
  context: unknown
): Promise<Output> => {
  console.log(event);
  console.log("GitHubアクセストークンをSSMパラメータストアから取得");
  const getSecureParameterResponse = await ssmClient.send(
    new GetParameterCommand({
      Name: event.paramNameForGitHubToken,
      WithDecryption: true,
    })
  );
  if (
    getSecureParameterResponse.Parameter === undefined ||
    getSecureParameterResponse.Parameter.Value === undefined
  ) {
    throw Error(`パラメータ[${event.paramNameForGitHubToken}]の取得に失敗`);
  }

  console.log("ビルドスペックをSSMパラメータストアから取得");
  const getParameterResponse = await ssmClient.send(
    new GetParameterCommand({
      Name: event.paramNameForBuildSpec,
    })
  );
  if (
    getParameterResponse.Parameter === undefined ||
    getParameterResponse.Parameter.Value === undefined
  ) {
    throw Error(`パラメータ[${event.paramNameForBuildSpec}]の取得に失敗`);
  }

  const createAppResponse = await amplifyClient.send(
    new CreateAppCommand({
      name: `application-plane-${event.tenantId}`,
      accessToken: getSecureParameterResponse.Parameter.Value,
      enableBranchAutoBuild: true,
      enableBasicAuth: false,
      buildSpec: getParameterResponse.Parameter.Value,
      cacheConfig: { type: "AMPLIFY_MANAGED_NO_COOKIES" },
      customRules: [
        {
          source: "/<*>",
          target: "/index.html",
          status: "404-200",
        },
      ],
      description: `application plane for tenant ${event.tenantId}`,
      enableBranchAutoDeletion: false,
      environmentVariables: {
        AMPLIFY_DIFF_DEPLOY: "false",
        AMPLIFY_MONOREPO_APP_ROOT: "projects/application-plane",
      },
      iamServiceRoleArn: event.amplifyServiceRoleARN,
      platform: "WEB",
      repository: event.repositoryURL,
    })
  );
  console.log(createAppResponse);
  if (
    createAppResponse.app === undefined ||
    createAppResponse.app.appId === undefined
  ) {
    throw Error("アプリケーションプレーンの作成に失敗");
  }
  return {
    appId: createAppResponse.app.appId,
  };
};
