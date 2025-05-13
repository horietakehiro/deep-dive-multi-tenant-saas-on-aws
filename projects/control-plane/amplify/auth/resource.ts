import { defineAuth } from "@aws-amplify/backend";
import { preSignUp } from "./pre-sign-up/resource";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  multifactor: {
    mode: "REQUIRED",
    totp: true,
  },
  userAttributes: {
    "custom:tenantId": {
      dataType: "String",
      mutable: true,
    },
  },
  triggers: {
    preSignUp,
  },
});
