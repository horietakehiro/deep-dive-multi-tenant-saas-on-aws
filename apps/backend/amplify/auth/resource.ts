import { defineAuth } from "@aws-amplify/backend";
import { CUSTOM_USER_ATTRIBUTES } from "../../lib/domain/model/user";
import { preSignUp } from "./pre-sign-up/resource";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  // 開発を高速化するため無効化しておく
  multifactor: {
    mode: "OFF",
  },
  // テナント管理者とテナントとの対応関係をカスタム属性として持たせる
  userAttributes: {
    [CUSTOM_USER_ATTRIBUTES.TENANT_ID]: {
      dataType: "String",
      mutable: true,
    },
    [CUSTOM_USER_ATTRIBUTES.TENANT_NAME]: {
      dataType: "String",
      mutable: true,
    },
    [CUSTOM_USER_ATTRIBUTES.ROLE]: {
      dataType: "String",
      mutable: true,
    },
  },
  triggers: {
    preSignUp,
  },
});
