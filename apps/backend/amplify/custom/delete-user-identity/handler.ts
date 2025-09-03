import { env } from "$amplify/env/delete-user-identity";

import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { deleteUserIdentityFactory } from "lib/domain/service/delete-user-identity";
const cognitoClient = new CognitoIdentityProviderClient({});
export const handler = deleteUserIdentityFactory(
  env.USER_POOL_ID,
  async (args) => await cognitoClient.send(new AdminDeleteUserCommand(args))
);
