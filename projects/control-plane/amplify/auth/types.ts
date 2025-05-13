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
