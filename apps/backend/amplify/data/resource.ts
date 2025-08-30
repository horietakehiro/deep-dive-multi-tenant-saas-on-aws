import { a, defineData } from "@aws-amplify/backend";
import { preSignUp } from "../auth/pre-sign-up/resource";
import { schemaFactory } from "lib/domain/model/data";
import { activateTenant } from "../custom/activate-tenant/resource";

const schema = a.schema(schemaFactory(activateTenant));
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
