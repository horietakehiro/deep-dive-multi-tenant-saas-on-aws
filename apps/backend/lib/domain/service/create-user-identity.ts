import { decodeJWT } from "aws-amplify/auth";
import type { Schema } from "../model/data";
import type {
  AdminCreateUserCommandInput,
  AdminCreateUserCommandOutput,
  AdminDeleteUserCommandInput,
  AdminDeleteUserCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";
import { CUSTOM_USER_ATTRIBUTES } from "../model/user";
import type {
  GetRandomPasswordCommandInput,
  GetRandomPasswordCommandOutput,
} from "@aws-sdk/client-secrets-manager";
import type { IRepositoryFactory } from "../port/repository";
import type { Config } from "../model/config";
type CreateCognitoUser = (
  input: AdminCreateUserCommandInput
) => Promise<AdminCreateUserCommandOutput>;
type DeleteCognitoUser = (
  input: AdminDeleteUserCommandInput
) => Promise<AdminDeleteUserCommandOutput>;
type GeneratePassword = (
  input: GetRandomPasswordCommandInput
) => Promise<GetRandomPasswordCommandOutput>;
// type CreateUserIdentity = (
//   args: Pick<
//     Parameters<Schema["createUserIdentity"]["functionHandler"]>["0"],
//     "arguments"
//   >
// ) => ReturnType<Schema["createUserIdentity"]["functionHandler"]>;
type CreateUserIdentity = Schema["createUserIdentity"]["functionHandler"];

export interface CreateUserIdentityProps {
  userPoolId: string;
  createCognitoUser: CreateCognitoUser;
  generatePassword: GeneratePassword;
  repositoryFactory: IRepositoryFactory<"createUser">;
  deleteCognitoUser: DeleteCognitoUser;
  config: Config;
}
/**
 * CognitoユーザープールとDynamoDB上にユーザーアイデンティティを作成する
 * @returns
 */
export const createUserIdentityFactory: (
  props: CreateUserIdentityProps
) => CreateUserIdentity = (props: CreateUserIdentityProps) => {
  return async ({ arguments: args, request }) => {
    // ヘッダに設定されたJWT(IDトークン)をデコードする
    const idToken = decodeJWT(request.headers["jwt-id-token"]!);
    // JWTからテナントIDを取得する
    const tenantId = idToken.payload["custom:tenantId"];

    // テナント分離に必要な検証等を行う。
    // JWTに設定されているテナントIDとリクエストペイロードとして
    // 渡されたテナントIDが一致することを確認する
    if (tenantId !== args.tenantId) {
      throw Error("invalid tenant id provided");
    }

    // 最初にCognito上にユーザを作成する
    // ※初期パスワードはランダムで作成
    const createCognitoUserRes = await props.createCognitoUser({
      UserPoolId: props.userPoolId,
      Username: args.email,
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
        await props.generatePassword({
          PasswordLength: 12,
        })
      ).RandomPassword,
    });
    console.log(createCognitoUserRes);
    const sub =
      createCognitoUserRes.User?.Attributes?.filter((a) => a.Name === "sub") ??
      [];
    if (sub?.length === 0) {
      throw Error("sub not found");
    }

    // 次にDynamoDB上にユーザを作成する
    const repository = await props.repositoryFactory(props.config);
    const createDynamoUserRes = await repository.createUser({
      id: sub[0]?.Value,
      tenantId: args.tenantId,
      email: args.email,
      name: args.name,
      role: args.role,
    });
    console.log(createDynamoUserRes);
    if (
      createDynamoUserRes.errors !== undefined ||
      createDynamoUserRes.data === null
    ) {
      // DynamoDB上へのユーザ作成に失敗した場合はロールバックする
      await props.deleteCognitoUser({
        UserPoolId: props.userPoolId,
        Username: sub[0]?.Value,
      });
    }

    return createDynamoUserRes.data;
  };
};
