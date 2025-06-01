import { generateClient } from "aws-amplify/data";
import { type Schema } from "../../../control-plane/amplify/data/resource";
import { defineStorage } from "@aws-amplify/backend";

// コントロールプレーン上のDynamoDBにアクセスするためのGraphQLクライアントを構成
import { Amplify } from "aws-amplify";
import sharedOutputs from "../../shared/amplify_outputs.json";
Amplify.configure(sharedOutputs);
const client = generateClient<Schema>();

export const storages: {
  [tenantName: string]: ReturnType<typeof defineStorage>;
} = {
  // Amplifyの仕様上デフォルトのストレージを設定する必要がある(アクセスは許可しない)
  defaultStorage: defineStorage({
    name: "defaultStorage",
    isDefault: true,
    access: (allow) => ({}),
  }),
};
console.log("コントロールプレーンからテナントのリストを取得");
const { data, errors } = await client.models.Tenant.list();
if (errors !== undefined) {
  console.error("コントロールプレーンからテナントのリストの取得に失敗");
  console.error(errors);
}
console.log("取得に成功したコントロールプレーン : ");
console.log(data);
data.forEach((tenant) => {
  storages[`storage${tenant.id}`] = defineStorage({
    name: `storage-${tenant.id}`,
    access: (allow) => ({
      "data/*": [allow.authenticated.to(["list", "get", "write"])],
    }),
  });
});
