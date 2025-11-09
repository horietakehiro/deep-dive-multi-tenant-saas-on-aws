import { defineFunction } from "@aws-amplify/backend";

export const createUserIdentity = defineFunction({
  name: "create-user-identity",
  resourceGroupName: "data",
  timeoutSeconds: 60,
  environment: {
    USER_POOL_ID: "",
    AWS_LAMBDA_EXEC_WRAPPER: "/opt/otel-handler",
    OTEL_NODE_ENABLED_INSTRUMENTATIONS: "aws-sdk,aws-lambda,http",
  },
});
