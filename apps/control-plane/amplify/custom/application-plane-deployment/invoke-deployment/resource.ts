import { defineFunction } from "@aws-amplify/backend";

export const invokeDeploymentFunction = defineFunction({
  name: "invoke-deployment",
  resourceGroupName: "invoke-deployment",
  timeoutSeconds: 60,
});
