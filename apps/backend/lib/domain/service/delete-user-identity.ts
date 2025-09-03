import type { Schema } from "../model/data";
import type {
  AdminDeleteUserCommandInput,
  AdminDeleteUserCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";
type DeleteUser = (
  input: AdminDeleteUserCommandInput
) => Promise<AdminDeleteUserCommandOutput>;
type DeleteUserIdentity = (
  args: Pick<
    Parameters<Schema["deleteCognitoUser"]["functionHandler"]>["0"],
    "arguments"
  >
) => ReturnType<Schema["deleteCognitoUser"]["functionHandler"]>;
/**
 * Cognitoユーザープール上からユーザーアイデンティティを削除する
 * @returns
 */
export const deleteUserIdentityFactory: (
  userPoolId: string,
  deleteUser: DeleteUser
) => DeleteUserIdentity = (userPoolId, deleteUser) => {
  return async ({ arguments: args }) => {
    console.log(args);
    try {
      const res = await deleteUser({
        UserPoolId: userPoolId,
        Username: args.userId,
      });
      console.log(res);
      return "success";
    } catch (e) {
      throw e;
    }
  };
};
