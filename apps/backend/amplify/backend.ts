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
      "cloudwatch:PutMetricData",
      "logs:PutLogEvents",
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogStreams",
      "logs:DescribeLogGroups",
      "logs:PutRetentionPolicy",
      "xray:PutTraceSegments",
      "xray:PutTelemetryRecords",
      "xray:GetSamplingRules",
      "xray:GetSamplingTargets",
      "xray:GetSamplingStatisticSummaries",
      "ssm:GetParameters",
    ],
    resources: ["*"],
  })
);
const { cfnFunction } = backend.createUserIdentity.resources.cfnResources;
cfnFunction.tracingConfig = {
  mode: "Active",
};
cfnFunction.layers = [
  `arn:aws:lambda:ap-northeast-1:901920570463:layer:aws-otel-nodejs-amd64-ver-1-30-2:1`,
];

backend.deleteUserIdentity.addEnvironment("USER_POOL_ID", userPoolId);
backend.deleteUserIdentity.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ["cognito-idp:AdminDeleteUser"],
    resources: ["*"],
  })
);
