import { createUserIdentityFactory } from "lib/domain/service/create-user-identity";
import { env } from "$amplify/env/create-user-identity";

export const handler = createUserIdentityFactory(env.USER_POOL_ID);
