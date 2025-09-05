import { defineFunction } from "@aws-amplify/backend";

export const preAuthentication = defineFunction({
  name: "pre-authentication",
  resourceGroupName: "auth",
  timeoutSeconds: 60,
});
