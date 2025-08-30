import { a, defineFunction, type ClientSchema } from "@aws-amplify/backend";

/**
 * カスタムクエリのハンドラに依存するのではなく、ハンドラがこのスキーマに依存出来るよう、
 * スキーマ情報そのものではなくスキーマのファクトリのみをエクスポートする
 * @param handlerFunction
 * @returns
 */
export const schemaFactory = (
  handlerFunction: ReturnType<typeof defineFunction>
) => ({
  AppointmentStatus: a.enum(["requested", "approved", "rejected"]),
  Appointment: a.model({
    id: a.id().required(),
    description: a.string().required(),
    datetime: a.datetime().required(),
    status: a.ref("AppointmentStatus").required(),

    userIdMadeBy: a.id().required(),
    userMadeBy: a.belongsTo("User", "userIdMadeBy"),

    userIdsMadeWith: a.string().array().required(),
    // userMadeWith: a.belongsTo("User", "userIdMadeWith"),

    spotId: a.id(),
    spot: a.belongsTo("Spot", "spotId"),
  }),
  Spot: a.model({
    id: a.id().required(),
    name: a.string().required(),
    available: a.boolean().default(true).required(),
    description: a.string(),
    appointments: a.hasMany("Appointment", "spotId"),
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
    // appointmentMadeWith: a.hasMany("Appointment", "userIdMadeWith"),
  }),

  TenantStatus: a.enum([
    "pending",
    "activating",
    "active",
    "inactive",
    "activationFailed",
  ]),
  Tenant: a.model({
    // id: a.id().required(),
    name: a.string().required(),
    status: a.ref("TenantStatus").required(),
    url: a.url(),
    spots: a.hasMany("Spot", "tenantId"),
    // appointments: a.hasMany("Appointment", "tenantId"),
    users: a.hasMany("User", "tenantId"),
  }),

  requestTenantActivation: a
    .query()
    .arguments({
      tenantId: a.id().required(),
    })
    .returns(a.string())
    .handler(a.handler.function(handlerFunction)),
});

const h = defineFunction({
  entry: "./dummy-handler.ts",
});
// 型情報だけ公開するためにダミーのハンドラを使用する
const schema = a.schema(schemaFactory(h));
export type Schema = ClientSchema<typeof schema>;
export type Tenant = Schema["Tenant"]["type"];
