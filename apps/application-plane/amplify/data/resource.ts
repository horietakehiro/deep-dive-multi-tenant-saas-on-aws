import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import type { Schema as ControlPlaneSchema } from "../../../control-plane/amplify/data/resource";
const schema = a.schema({
  Site: a
    .model({
      id: a.id().required(),
      name: a.string(),
      // floor: a.string(),
      // section: a.string(),
      // purpose: a.string(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema> & ControlPlaneSchema;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
  },
});
