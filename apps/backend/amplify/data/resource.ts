import { a, defineData } from "@aws-amplify/backend";
import { preSignUp } from "../auth/pre-sign-up/resource";
import { schemaFactory } from "lib/domain/model/data";
import { activateTenant } from "../custom/activate-tenant/resource";
import { createUserIdentity } from "../custom/create-user-identity/resource";
const schema = a.schema(
  schemaFactory({
    requestTenantActivation: activateTenant,
    createCognitoUser: createUserIdentity,
    deleteCognitoUser: createUserIdentity, // TODO:
  })
);
schema.authorization((allow) => [
  allow.publicApiKey(),
  allow.resource(preSignUp),
]);
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
  },
});
