import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  _: a.model({}),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
  },
});
