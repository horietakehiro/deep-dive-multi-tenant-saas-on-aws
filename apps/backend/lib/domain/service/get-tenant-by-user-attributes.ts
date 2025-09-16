import type { IRepository } from "@intersection/backend/lib/domain/port/repository";
import type { fetchUserAttributes } from "aws-amplify/auth";
import type { CustomUserAttributes } from "../model/user";

export const getTenantByUserAttributes = async (
  fetchUserAttributesFn: typeof fetchUserAttributes,
  getTenantFn: IRepository["getTenant"]
) => {
  const userAttributes =
    (await fetchUserAttributesFn()) as CustomUserAttributes;
  const res = await getTenantFn({ id: userAttributes["custom:tenantId"] });
  console.debug(res);
  if (res.errors !== undefined || res.data === null) {
    throw Error("tenant get failed");
  }
  return res.data;
};
