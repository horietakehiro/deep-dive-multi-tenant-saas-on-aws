import { defineFunction } from "@aws-amplify/backend";

export const preSignIn = defineFunction({
  name: "pre-sign-in",
  resourceGroupName: "auth",
  timeoutSeconds: 60,
});
