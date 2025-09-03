import type { Tenant, User } from "@intersection/backend/lib/domain/model/data";
import type { IRepository } from "@intersection/backend/lib/domain/port/repository";
import type { ServiceResponse } from "./type";

export const validate = (user: Partial<User>): user is User => {
  return (
    user.email !== undefined &&
    user.name !== undefined &&
    user.role !== undefined &&
    user.role !== null
  );
};
/**
 * Cognitoにユーザーを作成し、対応するユーザーアイデンティティ情報をDynamoDBにも作成する
 */
export const createUserIdentity = async (
  tenant: Tenant,
  user: Partial<User>,
  {
    createCognitoUser,
    deleteCognitoUser,
    createUser,
  }: Pick<IRepository, "createUser" | "createCognitoUser" | "deleteCognitoUser">
): Promise<ServiceResponse<User | null>> => {
  if (!validate(user)) {
    return {
      result: "NG",
      message: "validate user failed",
      data: null,
    };
  }

  // 最初にCognito上にユーザを作成する
  const createCognitoUserResponse = await createCognitoUser({
    tenantId: tenant.id,
    email: user.email!,
    role: user.role,
  });
  if (
    createCognitoUserResponse.errors !== undefined ||
    createCognitoUserResponse.data === null
  ) {
    console.error(createCognitoUserResponse.errors);
    return {
      result: "NG",
      message: "create user failed",
      data: null,
    };
  }

  // 次にDynamoDB上にユーザーアイデンティティを作成する
  const createUserResponse = await createUser({
    id: createCognitoUserResponse.data.sub,
    tenantId: tenant.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  if (
    createUserResponse.errors !== undefined ||
    createUserResponse.data === null
  ) {
    console.error(createUserResponse.errors);
    // ロールバック
    await deleteCognitoUser({
      tenantId: tenant.id,
      email: user.email,
    });
    return {
      result: "NG",
      message: "create user failed",
      data: null,
    };
  }

  return {
    data: createUserResponse.data,
    result: "OK",
    message: "create user succeeded",
  };
};
