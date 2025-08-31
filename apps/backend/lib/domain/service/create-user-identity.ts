import type { Schema } from "../model/data";

/**
 * Cognitoユーザープール上にユーザーアイデンティティを作成する
 * @returns
 */
export const createUserIdentityFactory: (
  userPoolId: string
) => Schema["createCognitoUser"]["functionHandler"] = (userPoolId) => {
  return async (...args) => {
    console.log(userPoolId);
    console.log(args[0]);
    return {
      sub: "TODO: ",
    };
  };
};
