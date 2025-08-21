import type { AuthContext } from "@aws-amplify/ui";

import {
  signIn as amplifySignIn,
  getCurrentUser as amplifyGetCurrentUser,
  fetchUserAttributes as amplifyFetchUserAttributes,
  signOut as amplifySignOut,
} from "aws-amplify/auth";
import { config, type Config } from "./config";
import type { CustomUserAttributes } from "../../../control-plane/app/models/admin-user";
const signInFactory = (config: Config): typeof amplifySignIn => {
  if (config.noAmplify) {
    return () => {
      return Promise.resolve({
        isSignedIn: true,
        nextStep: {
          signInStep: "DONE",
        },
      });
    };
  }
  return amplifySignIn;
};
const getCurrentUserFactory = (
  config: Config
): typeof amplifyGetCurrentUser => {
  if (config.noAmplify) {
    return () => {
      return Promise.resolve({
        userId: "dummy-id",
        username: "dummy-name",
        signInDetails: {
          authFlowType: "USER_SRP_AUTH",
          loginId: "dummy@example.com",
        },
      });
    };
  }
  return amplifyGetCurrentUser;
};
const signIn = signInFactory(config);
const getCurrentUser = getCurrentUserFactory(config);
export const services: AuthContext["services"] = {
  /**
   * テナント管理者がアプリケーションに初回ログインする際にコントロールプレーン側のユーザープール
   * からユーザーアイデンティティを移行する
   * @param input
   */
  handleSignIn: async (input) => {
    // ユーザー移行のトリガーを実行するには`userPassword`認証フローを使用する必要がある。
    // そのため、最初はデフォルトの認証フロー(userSRP)で認証を行い、失敗した場合に`userPassword`でも認証を試みる
    try {
      console.log("userSRPで認証");
      return await signIn({
        ...input,
        options: {
          ...input.options,
          authFlowType: "USER_SRP_AUTH",
        },
      });
    } catch (error: unknown) {
      if ((error as { name: string }).name === "NotAuthorizedException") {
        console.log(error);
        console.log("userPasswordで認証");
        console.log("アカウントのロックを防ぐために1.5秒待機する");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return signIn({
          ...input,
          options: {
            ...input,
            authFlowType: "USER_PASSWORD_AUTH",
          },
        });
      }
      console.error(error);
      throw error;
    }
  },
  getCurrentUser: getCurrentUser,
};

const fetchUserAttributeFactory = (
  config: Config
): typeof amplifyFetchUserAttributes => {
  if (config.noAmplify === undefined) {
    return amplifyFetchUserAttributes;
  }
  return () => {
    return Promise.resolve({
      "custom:tenantId": "00000000-0000-0000-0000-000000000000",
      "custom:tenantName": "dummy-tenant",
    } satisfies CustomUserAttributes);
  };
};
const signOutFactory = (config: Config): typeof amplifySignOut => {
  if (config.noAmplify === undefined) {
    return amplifySignOut;
  }
  return (input) => {
    console.debug(input);
    return Promise.resolve();
  };
};
export const fetchUserAttributes = fetchUserAttributeFactory(config);
export const signOut = signOutFactory(config);
