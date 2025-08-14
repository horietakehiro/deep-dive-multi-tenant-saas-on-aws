import type { CustomUserAttributes } from "./admin-user";
import type { RootContext } from "./context";

export const status = ["pending", "active", "inactive"] as const;
export type Status = (typeof status)[number];

export const getTenantFromUserAttributes = async (
  customUserAttributesFactory: () => Promise<CustomUserAttributes>,
  tenantClient: {
    // getTenant: OutletContext["client"]["models"]["Tenant"]["get"];
    getTenant: RootContext["client"]["getTenant"];
  }
) => {
  const userAttributes = await customUserAttributesFactory();
  console.log(userAttributes);

  const res = await tenantClient.getTenant({
    id: userAttributes["custom:tenantId"],
  });
  console.log(res, res.errors);
  if (res.errors !== undefined || res.data === null) {
    throw Error("Tenant info failed to be read");
  }
  return res.data;
};
