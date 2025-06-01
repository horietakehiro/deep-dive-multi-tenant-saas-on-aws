import { aws_iam as iam } from "aws-cdk-lib";
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { userMigration } from "./auth/user-migration/resource";
import { storages } from "./storage/resource";

const backend = defineBackend({
  auth,
  userMigration,
  ...storages,

  // data,
});

const { cfnUserPoolClient } = backend.auth.resources.cfnResources;
cfnUserPoolClient.explicitAuthFlows = [
  "ALLOW_CUSTOM_AUTH",
  "ALLOW_REFRESH_TOKEN_AUTH",
  "ALLOW_USER_SRP_AUTH",
  // ユーザー移行トリガーのために必要
  "ALLOW_USER_PASSWORD_AUTH",
];

backend.userMigration.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ["cognito-idp:AdminInitiateAuth", "cognito-idp:AdminGetUser"],
    resources: ["*"],
  })
);
