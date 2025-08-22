import { defineData } from "@aws-amplify/backend";
import { schema } from "../../lib/domain/model/data";
schema.authorization((allow) => [allow.publicApiKey()]);
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
  },
});
