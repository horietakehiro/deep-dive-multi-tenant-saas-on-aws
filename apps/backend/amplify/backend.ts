import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { createUserIdentity } from "./custom/create-user-identity/resource";
const backend = defineBackend({
  auth,
  data,
  createUserIdentity,
});

const userPoolId = backend.auth.resources.userPool.userPoolId;
backend.createUserIdentity.addEnvironment("USER_POOL_ID", userPoolId);
