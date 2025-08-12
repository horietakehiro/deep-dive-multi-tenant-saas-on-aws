import { PreSignUpTriggerHandler } from "aws-lambda";
import { generateClient } from "aws-amplify/data";
import { Schema } from "../../data/resource";
import outputs from "../../../amplify_outputs.json";
import { Amplify } from "aws-amplify";
import type { SignupUserAttributes } from "../../../app/models/admin-user";

Amplify.configure(outputs);
const client = generateClient<Schema>();

/**
 * テナント管理者に対応するテナントアイデンティティをDB上に作成する
 * @param event
 */
export const handler: PreSignUpTriggerHandler = async (event) => {
  console.log(event);
  const userAttributes = event.request.userAttributes as SignupUserAttributes;

  // テナントアイデンティティを作成
  const tenant = await client.models.Tenant.create({
    id: userAttributes["custom:tenantId"],
    name: userAttributes["custom:tenantName"],
    status: "pending",
  });
  console.log(tenant);
  return event;
};
