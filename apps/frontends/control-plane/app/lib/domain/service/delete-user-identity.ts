import type { IRepository } from "@intersection/backend/lib/domain/port/repository";
import type { ServiceResponse } from "./type";

/**
 * DynamoDB上からユーザーアイデンティティを削除し、対応するユーザーをCognitoからも削除する
 */
export const deleteUserIdentity = async (
  userId: string,
  {
    deleteCognitoUser,
    createUser,
    deleteUser,
  }: Pick<IRepository, "createUser" | "deleteCognitoUser" | "deleteUser">
): Promise<ServiceResponse<null>> => {
  // 最初にDynamoDB上のユーザーアイデンティティを削除する
  const deleteUserResponse = await deleteUser({ id: userId });
  if (
    deleteUserResponse.errors !== undefined ||
    deleteUserResponse.data === null
  ) {
    console.error(deleteUserResponse.errors);
    return {
      result: "NG",
      message: "delete user failed",
      data: null,
    };
  }
  // ロールバック時に使用する
  const deletedUser = deleteUserResponse.data;

  // 次にCognito上のユーザーを削除する
  const deleteCognitoUserResponse = await deleteCognitoUser({ userId });
  if (deleteCognitoUserResponse.errors !== undefined) {
    console.error(deleteCognitoUserResponse.errors);
    // ロールバック(DynamoDB上へのユーザの再作成)
    await createUser({ ...deletedUser });
    return {
      result: "NG",
      message: "delete user failed",
      data: null,
    };
  }

  return {
    data: null,
    result: "OK",
    message: "delete user succeeded",
  };
};
