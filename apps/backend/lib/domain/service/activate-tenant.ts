import type { Schema } from "../model/data";

// TODO:
export const activateTenantFactory: () => Schema["requestTenantActivation"]["functionHandler"] =
  () => {
    return async (...args) => {
      console.log(args[0].arguments.tenantId);
      return "";
    };
  };
