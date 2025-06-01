import { generateClient } from "aws-amplify/data";
import { type Schema } from "../../../control-plane/amplify/data/resource";
import { defineStorage } from "@aws-amplify/backend";
import { Amplify } from "aws-amplify";
import sharedOutputs from "../../shared/amplify_outputs.json";
Amplify.configure(sharedOutputs);
const client = generateClient<Schema>();

export const storages: {
  [tenantName: string]: ReturnType<typeof defineStorage>;
} = {
  defaultStorage: defineStorage({
    name: "defaultStorage",
    isDefault: true,
  }),
};
console.log("コントロールプレーンからテナントのリストを取得");
const { data } = (await client.models.Tenant.list()) ?? [];
console.log(data);
data.forEach((t) => {
  storages[`storage${t.id}`] = defineStorage({
    name: `storage-${t.id}`,
    access: (allow) => ({
      "data/*": [allow.authenticated.to(["list", "get", "write"])],
    }),
  });
});
