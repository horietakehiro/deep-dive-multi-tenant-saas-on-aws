import { defineFunction } from "@aws-amplify/backend";

export const userMigration = defineFunction({
  name: "user-migration",
  resourceGroupName: "auth",
  timeoutSeconds: 60,
});
