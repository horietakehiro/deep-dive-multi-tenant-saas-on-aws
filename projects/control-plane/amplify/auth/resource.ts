import { defineAuth } from "@aws-amplify/backend";
import { preSignUp } from "./pre-sign-up/resource";

/**
 * サインアップ時に必要なカスタム属性名
 */
export const SIGNUP_CUSTOM_USER_ATTRIBUTES = {
  TENANT_ID: "custom:tenantId",
  TENANT_NAME: "custom:tenantName",
} as const;
/**
 * サインアップ時に必要なカスタム属性
 */
export type SignUpUserAttributes = {
  [key in
    | (typeof SIGNUP_CUSTOM_USER_ATTRIBUTES)[keyof typeof SIGNUP_CUSTOM_USER_ATTRIBUTES]
    | "email"]: string;
};
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
  },
});
