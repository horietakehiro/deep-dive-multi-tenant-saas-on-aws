import type { CustomUserAttributes } from "./admin-user";
import type { OutletContext } from "./context";

export const status = ["pending", "active", "inactive"] as const;
export type Status = (typeof status)[number];
export const getTenantFromUserAttributes = async (
  f: () => Promise<CustomUserAttributes>,
  c: OutletContext["client"]
) => {
  const userAttributes = await f();
  console.log(userAttributes);

  const res = await c.models.Tenant.get({
    id: userAttributes["custom:tenantId"],
  });
  console.log(res);
  if (res.errors !== undefined || res.data === null) {
    throw Error("Tenant info failed to be read");
  }
  return res.data;
};
