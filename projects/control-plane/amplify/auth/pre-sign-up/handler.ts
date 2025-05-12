import { PreSignUpTriggerHandler } from "aws-lambda";
import { generateClient } from "aws-amplify/data";
import { Schema } from "../../data/resource";
const client = generateClient<Schema>();

/**
 * テナント所有者に対応するテナントアイデンティティを作成する
 * @param event
 * @param context
 */
export const handler: PreSignUpTriggerHandler = async (event, context) => {
  console.log(event)
  // テナントアイデンティティを作成
  const tenant = await client.models.Tenant.create({
    status: "pending",
  })
  console.log(tenant)

  // テナントIDをユーザーアイデンティティに紐づけ
  event.request.userAttributes["custom:tenantId"] = tenant.data!.id
  return event 

};
