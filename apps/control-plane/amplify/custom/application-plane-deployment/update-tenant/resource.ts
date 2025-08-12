import { defineFunction } from "@aws-amplify/backend";

export const updateTenantFunction = defineFunction({
  name: "update-tenant",
  resourceGroupName: "update-tenant",
  timeoutSeconds: 60,
});
