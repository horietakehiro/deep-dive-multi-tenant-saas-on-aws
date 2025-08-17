import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
// import { status } from "../../app/models/tenant";
import { invokeDeploymentFunction } from "../custom/application-plane-deployment/invoke-deployment/resource";
import { updateTenantFunction } from "../custom/application-plane-deployment/update-tenant/resource";
import { preSignUp } from "../auth/pre-sign-up/resource";
const schema = a
  .schema({
    Spot: a.model({
      id: a.id().required(),
      name: a.string().required(),
      available: a.boolean().default(true).required(),
      description: a.string(),
      appointments: a.hasMany("Appointment", "spotId"),
      tenantId: a.id(),
      tenant: a.belongsTo("Tenant", "tenantId"),
    }),
    AppointmentStatus: a.enum(["requested", "approved", "rejected"]),
    Appointment: a.model({
      id: a.id().required(),
      description: a.string().required(),
      datetime: a.datetime().required(),
      status: a.ref("AppointmentStatus").required(),
      userIdMadeBy: a.string().required(),
      userMadeBy: a.belongsTo("User", "userIdMadeBy"),

      userIdMadeWith: a.string().required(),
      userMadeWith: a.belongsTo("User", "userIdMadeWith"),

      spotId: a.id(),
      spot: a.belongsTo("Spot", "spotId"),

      tenantId: a.id(),
      tenant: a.belongsTo("Tenant", "tenantId"),
    }),
    User: a.model({
      id: a.id().required(),
      name: a.string().required(),
      email: a.string().required(),
      departmentName: a.string(),
      teamName: a.string(),

      tenantId: a.id(),
      tenant: a.belongsTo("Tenant", "tenantId"),

      appointmentMadeBy: a.hasMany("Appointment", "userIdMadeBy"),
      appointmentMadeWith: a.hasMany("Appointment", "userIdMadeWith"),
    }),

    TenantStatus: a.enum(["pending", "activating", "active", "inactive"]),
    Tenant: a.model({
      // id: a.id().required(),
      name: a.string().required(),
      status: a.ref("TenantStatus").required(),
      url: a.url(),
      spots: a.hasMany("Spot", "tenantId"),
      appointments: a.hasMany("Appointment", "tenantId"),
      users: a.hasMany("User", "tenantId"),
    }),
    invokeApplicationPlaneDeployment: a
      .query()
      .arguments({
        tenantId: a.string(),
      })
      .returns(a.string())
      .handler(a.handler.function(invokeDeploymentFunction)),
  })
  .authorization((allow) => [
    allow.publicApiKey(),
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
