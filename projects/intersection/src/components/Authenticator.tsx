import "./../App.css";
import {
  Authenticator as AmplifyAuthenticator,
  AuthenticatorProps as AmplifyAuthenticatorProps,
} from "@aws-amplify/ui-react";
import { signIn, SignInInput } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import {
  type BaseProps,
  type State,
} from "../../../control-plane/src/components/utils";
export interface AuthenticatorProps
  extends BaseProps,
    AmplifyAuthenticatorProps {
  setSignedIn: (s: State["signedIn"]) => void;
}

export default function Authenticator(props: AuthenticatorProps) {
  Hub.listen("auth", ({ payload }) => {
    switch (payload.event) {
      case "signedIn":
        console.log("サインイン成功");
        props.stateRepository.set("signedIn", true, props.setSignedIn);
        break;
      case "signedOut":
        console.log("サインアウト成功");
        props.stateRepository.set("signedIn", false, props.setSignedIn);
        break;
    }
  });
  const services = {
    handleSignIn: async (input: SignInInput) => {
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

  return (
    <>
      <AmplifyAuthenticator hideSignUp services={services}>
        {props.children}
      </AmplifyAuthenticator>
    </>
  );
}
