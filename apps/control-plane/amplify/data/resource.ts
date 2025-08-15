import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
// import { status } from "../../app/models/tenant";
import { invokeDeploymentFunction } from "../custom/application-plane-deployment/invoke-deployment/resource";
import { updateTenantFunction } from "../custom/application-plane-deployment/update-tenant/resource";
import { preSignUp } from "../auth/pre-sign-up/resource";
const schema = a
  .schema({
    TenantStatus: a.enum(["pending", "activating", "active", "inactive"]),
    Tenant: a
      .model({
        id: a.id().required(),
        name: a.string().required(),
        status: a.ref("TenantStatus").required(),
        url: a.url(),
      })
      .authorization((allow) => [allow.publicApiKey()]),
    invokeApplicationPlaneDeployment: a
      .query()
      .arguments({
        tenantId: a.string(),
      })
      .returns(a.string())
      .authorization((allow) => [allow.publicApiKey(), allow.authenticated()])
      .handler(a.handler.function(invokeDeploymentFunction)),
  })
  .authorization((allow) => [
    allow.resource(updateTenantFunction),
    allow.resource(preSignUp),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
  },
});
