import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { status } from "../../app/models/tenant";

const schema = a.schema({
  Tenant: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      // status: a.enum(["pending", "active", "inactive"]),
      status: a.enum(status),
      url: a.url(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
  },
});
