import { defineFunction } from "@aws-amplify/backend";

export const createUserIdentity = defineFunction({
  name: "create-user-identity",
  resourceGroupName: "data",
  timeoutSeconds: 60,
  environment: {
    USER_POOL_ID: "",
  },
});
