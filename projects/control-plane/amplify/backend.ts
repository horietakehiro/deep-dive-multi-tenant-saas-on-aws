import { aws_iam as iam } from "aws-cdk-lib";
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { ApplicationPlaneDeployment } from "./custom/application-plane-deployment/resource";
import { paramNameForSFNArn } from "./auth/confirm-sign-up/handler";
import { confirmSignUp } from "./auth/confirm-sign-up/resource";
/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  confirmSignUp,
});
// アプリケーションプレーンのデプロイに必要な権限をconfirmSignUpトリガー関数に追加する
backend.confirmSignUp.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ["ssm:GetParameter", "states:StartExecution"],
    resources: ["*"],
  })
);

// アプリケーションプレーンのデプロイジョブ用のステートマシンを追加する
const applicationPlaneDeployment = new ApplicationPlaneDeployment(
  backend.createStack("ApplicationPlaneDeployment"),
  "ApplicationPlaneDeployment",
  {
    paramNameForSFNArn: paramNameForSFNArn,
    paramNameForGithubAccessToken: "/GitHub/MyToken",
  }
);
