import { defineAuth } from "@aws-amplify/backend";
import { userMigration } from "./user-migration/resource";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  triggers: {
    userMigration,
  },
  userAttributes: {
    "custom:tenantId": {
      dataType: "String",
      mutable: true,
    },
    "custom:tenantName": {
      dataType: "String",
      mutable: true,
    },
  },
});
