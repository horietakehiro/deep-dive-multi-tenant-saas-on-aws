import type { AuthContext } from "@aws-amplify/ui";

import { signIn } from "aws-amplify/auth";

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
};
