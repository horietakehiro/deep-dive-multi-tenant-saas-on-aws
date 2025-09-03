import { defineFunction } from "@aws-amplify/backend";

export const deleteUserIdentity = defineFunction({
  name: "delete-user-identity",
  resourceGroupName: "data",
  timeoutSeconds: 60,
  environment: {
    USER_POOL_ID: "",
  },
});
