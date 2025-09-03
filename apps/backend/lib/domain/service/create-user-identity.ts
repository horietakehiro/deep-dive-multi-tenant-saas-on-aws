import type { Schema } from "../model/data";
import type {
  AdminCreateUserCommandInput,
  AdminCreateUserCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";
import { CUSTOM_USER_ATTRIBUTES } from "../model/user";
import type {
  GetRandomPasswordCommandInput,
  GetRandomPasswordCommandOutput,
} from "@aws-sdk/client-secrets-manager";
type CreateUser = (
  input: AdminCreateUserCommandInput
) => Promise<AdminCreateUserCommandOutput>;
type GeneratePassword = (
  input: GetRandomPasswordCommandInput
) => Promise<GetRandomPasswordCommandOutput>;
type CreateUserIdentity = (
  args: Schema["createCognitoUser"]["args"]
) => Promise<Schema["createCognitoUser"]["returnType"]>;

/**
 * Cognitoユーザープール上にユーザーアイデンティティを作成する
 * @returns
 */
export const createUserIdentityFactory: (
  userPoolId: string,
  createUser: CreateUser,
  generatePassword: GeneratePassword
) => CreateUserIdentity = (userPoolId, createUser, generatePassowrd) => {
  return async (args) => {
    console.log(args);
    // Cognitoに初期パスワード(ランダム)でユーザを作成
    try {
      const res = await createUser({
        UserPoolId: userPoolId,
        Username: undefined,
        UserAttributes: [
          {
            Name: CUSTOM_USER_ATTRIBUTES.TENANT_ID,
            Value: args.tenantId,
          },
          {
            Name: CUSTOM_USER_ATTRIBUTES.ROLE,
            Value: args.role!,
          },
          {
            Name: "email",
            Value: args.email,
          },
        ],
        TemporaryPassword: (
          await generatePassowrd({
            PasswordLength: 12,
          })
        ).RandomPassword,
      });
      console.log(res);
      const sub = res.User?.Attributes?.filter((a) => a.Name === "sub") ?? [];
      if (sub?.length === 0) {
        throw Error("sub not found");
      }
      return {
        sub: sub[0]?.Value!,
      };
    } catch (e) {
      throw e;
    }
  };
};
