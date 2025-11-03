import { aws_iam as iam } from "aws-cdk-lib";
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { createUserIdentity } from "./custom/create-user-identity/resource";
import { deleteUserIdentity } from "./custom/delete-user-identity/resource";
const backend = defineBackend({
  auth,
  data,
  createUserIdentity,
  deleteUserIdentity,
});

const userPoolId = backend.auth.resources.userPool.userPoolId;
backend.createUserIdentity.addEnvironment("USER_POOL_ID", userPoolId);
backend.createUserIdentity.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
      "cognito-idp:AdminCreateUser",
      "secretsmanager:GetRandomPassword",
      "xray:PutTelemetryRecords",
      "xray:PutTraceSegments",
      "cloudwatch:PutMetricData",
    ],
    resources: ["*"],
  })
);
const { cfnFunction } = backend.createUserIdentity.resources.cfnResources;
cfnFunction.tracingConfig = {
  mode: "Active",
};

backend.deleteUserIdentity.addEnvironment("USER_POOL_ID", userPoolId);
backend.deleteUserIdentity.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ["cognito-idp:AdminDeleteUser"],
    resources: ["*"],
  })
);
