import { defineFunction } from "@aws-amplify/backend";

export const activateTenant = defineFunction({
  name: "activate-tenant",
  resourceGroupName: "data",
  timeoutSeconds: 60,
});
