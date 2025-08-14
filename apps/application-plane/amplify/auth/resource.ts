import { defineAuth } from "@aws-amplify/backend";
import { CUSTOM_USER_ATTRIBUTES } from "../../../control-plane/app/models/admin-user";
import { userMigration } from "./user-migration/resource";
/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  multifactor: {
    mode: "OFF",
  },
  // テナントとの対応関係をカスタム属性として持たせる
  userAttributes: {
    [CUSTOM_USER_ATTRIBUTES.TENANT_ID]: {
      dataType: "String",
      mutable: true,
    },
    [CUSTOM_USER_ATTRIBUTES.TENANT_NAME]: {
      dataType: "String",
      mutable: true,
    },
  },
  triggers: {
    userMigration,
  },
});
