import { defineFunction } from "@aws-amplify/backend";

export const preSignUp = defineFunction({
  name: "pre-sign-up",
  resourceGroupName: "auth",
  timeoutSeconds: 60,
});
