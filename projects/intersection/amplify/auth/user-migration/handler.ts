import { UserMigrationAuthenticationTriggerEvent } from "aws-lambda";
import sharedOutputs from "../../../shared/amplify_outputs.json";
import { Amplify } from "aws-amplify";
import {
  FetchAuthSessionOptions,
  fetchUserAttributes,
  FetchUserAttributesOutput,
  signIn,
} from "aws-amplify/auth";
import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminGetUserCommand,
  NotAuthorizedException,
} from "@aws-sdk/client-cognito-identity-provider";
import {} from "aws-amplify/auth";

const client = new CognitoIdentityProviderClient();

// コントロールプレーン側のユーザープールにアクセスする
Amplify.configure(sharedOutputs);

interface Error {
  name: string;
}
const securelyLogEvent = (event: UserMigrationAuthenticationTriggerEvent) =>
  console.log({
    ...event,
    request: { ...event.request, password: "*****" },
  } as UserMigrationAuthenticationTriggerEvent);
/**
 * テナント所有者の初回ログイン時にユーザーアイデンティティをアプリケーションプレーン上のユーザープールに移行する
 * @param event
 */
export const handler = async (
  event: UserMigrationAuthenticationTriggerEvent
): Promise<UserMigrationAuthenticationTriggerEvent> => {
  securelyLogEvent(event);
  // テナント所有者がサインインしようとしているか否かを判定する
  // 具体的には、リクエスト情報に含まれるユーザー名とパスワードで
  // コントロールプレーンのユーザープールにサインインを試行して成功するか否かを確認する
  const username = event.userName;
  const password = event.request.password;

  try {
    // 認証エラーが発生しなければユーザー名とパスワードが正しいと判断する
    const authResponse = await client.send(
      new AdminInitiateAuthCommand({
        AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
        UserPoolId: sharedOutputs.auth.user_pool_id,
        ClientId: sharedOutputs.auth.user_pool_client_id,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      })
    );
    console.log(authResponse);

    console.log("sub以外の全てのユーザー属性も移行する");
    const userResponse = await client.send(
      new AdminGetUserCommand({
        Username: username,
        UserPoolId: sharedOutputs.auth.user_pool_id,
      })
    );
    const migrateAttributes: { [name: string]: string } = Object.fromEntries(
      (userResponse.UserAttributes ?? [])
        .filter((att) => att.Name !== "sub")
        .map((att) => [att.Name, att.Value])
    );
    console.log(migrateAttributes);

    event.response.userAttributes = {
      ...migrateAttributes,
      username: event.userName,
    };
    event.response.finalUserStatus = "CONFIRMED";
    event.response.messageAction = "SUPPRESS";
    securelyLogEvent(event);
    return event;
  } catch (error: unknown) {
    console.error(error);
    throw error;
  }
};
