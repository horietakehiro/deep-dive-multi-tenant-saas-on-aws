import { defineAuth, defineFunction } from "@aws-amplify/backend";
import { preSignUp } from "./pre-sign-up/resource";
import { confirmSignUp } from "./confirm-sign-up/resource";
import { SIGNUP_CUSTOM_USER_ATTRIBUTES } from "./types";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  multifactor: {
    mode: "OPTIONAL",
    totp: true,
  },
  userAttributes: {
    [SIGNUP_CUSTOM_USER_ATTRIBUTES.TENANT_ID]: {
      dataType: "String",
      mutable: true,
    },
    [SIGNUP_CUSTOM_USER_ATTRIBUTES.TENANT_NAME]: {
      dataType: "String",
      mutable: true,
    },
  },
  triggers: {
    preSignUp,
    postConfirmation: confirmSignUp,
  },
});
