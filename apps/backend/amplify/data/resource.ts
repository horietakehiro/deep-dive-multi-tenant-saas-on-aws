import { defineData } from "@aws-amplify/backend";
import { schema } from "../../lib/domain/model/data";
import { preSignUp } from "../auth/pre-sign-up/resource";
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
