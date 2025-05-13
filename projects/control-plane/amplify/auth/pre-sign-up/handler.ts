import { PreSignUpTriggerHandler } from "aws-lambda";
import { generateClient } from "aws-amplify/data";
import { Schema } from "../../data/resource";
import outputs from "../../../amplify_outputs.json";
import { Amplify } from "aws-amplify";
Amplify.configure(outputs);
const client = generateClient<Schema>();

/**
 * テナント所有者に対応するテナントアイデンティティを作成する
 * @param event
 */
export const handler: PreSignUpTriggerHandler = async (event) => {
  console.log(event);
  // テナントアイデンティティを作成
  const tenant = await client.models.Tenant.create({
    status: "pending",
    owner: event.request.userAttributes["email"],
  });
  console.log(tenant);
  // テナントIDをユーザーアイデンティティに紐づけ
  event.request.userAttributes["custom:tenantId"] = tenant.data!.id;
  console.log(event);
  return event;
};
