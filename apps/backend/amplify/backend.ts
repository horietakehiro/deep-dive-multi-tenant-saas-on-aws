import {
  aws_iam as iam,
  aws_lambda_event_sources as lambdaEventSource,
  aws_lambda as lambda,
} from "aws-cdk-lib";
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { createUserIdentity } from "./custom/create-user-identity/resource";
import { deleteUserIdentity } from "./custom/delete-user-identity/resource";
import { captureDataEvents } from "./custom/capture-data-events/resource";
const backend = defineBackend({
  auth,
  data,
  createUserIdentity,
  deleteUserIdentity,
  captureDataEvents,
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
Object.values(backend.data.resources.tables).forEach((table) => {
  table.grantStreamRead(backend.captureDataEvents.resources.lambda);
  backend.captureDataEvents.resources.lambda.addEventSource(
    new lambdaEventSource.DynamoEventSource(table, {
      startingPosition: lambda.StartingPosition.LATEST,
    })
  );
});

// const dataMonitoringStack = backend.createStack("DataMonitoringStack");
// const role = new iam.Role(dataMonitoringStack, "Role", {
//   assumedBy: new iam.ServicePrincipal("appsync.amazonaws.com"),
//   inlinePolicies: {
//     root: new iam.PolicyDocument({
//       statements: [
//         new iam.PolicyStatement({
//           effect: iam.Effect.ALLOW,
//           actions: [
//             "logs:CreateLogGroup",
//             "logs:CreateLogStream",
//             "logs:PutLogEvents",
//           ],
//           resources: ["*"],
//         }),
//       ],
//     }),
//   },
// });
// const { cfnGraphqlApi } = backend.data.resources.cfnResources;
// cfnGraphqlApi.xrayEnabled = true;
// cfnGraphqlApi.logConfig = {
//   fieldLogLevel: "ALL",
//   excludeVerboseContent: false,
//   cloudWatchLogsRoleArn: role.roleArn,
// };
