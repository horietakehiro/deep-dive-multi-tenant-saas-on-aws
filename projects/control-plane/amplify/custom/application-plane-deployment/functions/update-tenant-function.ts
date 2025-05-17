import { generateClient } from "aws-amplify/data";
import { type Schema } from "../../../data/resource";
import outputs from "../../../../amplify_outputs.json";
import { Amplify } from "aws-amplify";

Amplify.configure(outputs);
const client = generateClient<Schema>();

export interface Input {
  tenantId: string;
  url: string;
}
export const handler = async (event: Input, context: any): Promise<void> => {
  console.log(event);
  console.log(`テナント[${event.tenantId}]のステータスをactiveに更新する`);
  const currentTenant = await client.models.Tenant.get({ id: event.tenantId });
  console.log(currentTenant);
  if (currentTenant.data === null) {
    throw Error(`テナント[${event.tenantId}]が存在しない`);
  }
  const newTenant = await client.models.Tenant.update({
    ...currentTenant.data,
    status: "active",
    url: event.url,
  });
  console.log(newTenant);
};
