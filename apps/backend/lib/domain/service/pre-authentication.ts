import type { PreAuthenticationTriggerEvent } from "aws-lambda";
import type { ClientMetadata } from "../model/auth";
import type { CustomUserAttributes } from "../model/user";

export type Event = Pick<PreAuthenticationTriggerEvent, "userName" | "request">;
/**
 * ユーザーのロールに応じて、コントロールプレーンへのサインインを許可/拒否する
 * @param event
 */
export const preAuthentication = async (event: Event) => {
  console.log(event);

  // アプリケーションプレーンへのサインインであれば何もしない
  const { appType } = event.request?.validationData as ClientMetadata;
  if (appType === "application-plane") {
    return event;
  }

  // OWNER又はADMINロールのみコントロールプレーンへのサインインを許可する
  const { "custom:tenantRole": role } = event.request
    .userAttributes as CustomUserAttributes;
  switch (role) {
    case "ADMIN":
    case "OWNER":
      return event;
    default:
      throw Error(
        `ロール${role}のユーザー${event.userName}はコントロールプレーンへのサインインは許可されていません`
      );
  }
};
