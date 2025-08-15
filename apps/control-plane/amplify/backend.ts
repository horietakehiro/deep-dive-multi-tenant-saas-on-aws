import { aws_iam as iam } from "aws-cdk-lib";
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { updateTenantFunction } from "./custom/application-plane-deployment/update-tenant/resource";
import { ApplicationPlaneDeployment } from "./custom/application-plane-deployment/resource";
import { invokeDeploymentFunction } from "./custom/application-plane-deployment/invoke-deployment/resource";
import { PARAM_NAME_FOR_SFN_ARN } from "./custom/application-plane-deployment/invoke-deployment/handler";
import { preSignUp } from "./auth/pre-sign-up/resource";
/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  invokeDeploymentFunction,
  updateTenantFunction,
  preSignUp,
});

const { cfnUserPoolClient } = backend.auth.resources.cfnResources;
cfnUserPoolClient.explicitAuthFlows = [
  "ALLOW_CUSTOM_AUTH",
  "ALLOW_REFRESH_TOKEN_AUTH",
  "ALLOW_USER_SRP_AUTH",
  // ユーザー移行トリガーのために必要
  "ALLOW_USER_PASSWORD_AUTH",
  "ALLOW_ADMIN_USER_PASSWORD_AUTH",
];

// アプリケーションプレーンのデプロイジョブ用のステートマシンを追加する
const applicationPlaneDeployment = new ApplicationPlaneDeployment(
  backend.createStack("ApplicationPlaneDeployment"),
  "ApplicationPlaneDeployment",
  {
    paramNameForGithubAccessToken: "/GitHub/MyClassicToken",
    domainName: "ht-burdock.com",
    repositoryURL:
      "https://github.com/horietakehiro/deep-dive-multi-tenant-saas-on-aws",
    branchName: "main",
    updateTenantFunction: backend.updateTenantFunction.resources.lambda,
    controlPlaneAppName: "full-stack-silo-deploy-model-control-plane",
  }
);

// アプリケーションプレーンのデプロイに必要な権限をconfirmSignUpトリガー関数に追加する
backend.invokeDeploymentFunction.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ["ssm:GetParameter", "states:StartExecution"],
    resources: ["*"],
  })
);
// ステートマシンのARNを参照するためのパラメータ名を環境変数に設定する
const cfnFunction =
  backend.invokeDeploymentFunction.resources.cfnResources.cfnFunction;
cfnFunction.environment = {
  variables: {
    [PARAM_NAME_FOR_SFN_ARN]: applicationPlaneDeployment.arnParam.parameterName,
  },
};
