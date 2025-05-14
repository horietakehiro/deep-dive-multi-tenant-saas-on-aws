import { defineFunction } from "@aws-amplify/backend";

export const confirmSignUp = defineFunction({
  name: "confirm-sign-up",
  resourceGroupName: "auth",
  timeoutSeconds: 60,
});

