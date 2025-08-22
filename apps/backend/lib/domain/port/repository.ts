import type { F, Client, Schema } from "../model/data";

export interface IRepository {
  getTenant: F<Client["models"]["Tenant"]["get"], Schema["Tenant"]["type"]>;
}
