import { PreSignUpTriggerHandler } from "aws-lambda";
import { generateClient } from "aws-amplify/data";
import { Schema } from "../../data/resource";
import outputs from "../../../amplify_outputs.json";
import { Amplify } from "aws-amplify";
import { type SignUpUserAttributes } from "../types";
Amplify.configure(outputs);
const client = generateClient<Schema>();

/**
 * テナント所有者に対応するテナントアイデンティティを作成する
 * @param event
 */
export const handler: PreSignUpTriggerHandler = async (event) => {
  console.log(event);
  const userAttributes = event.request.userAttributes as SignUpUserAttributes;
  // テナントアイデンティティを作成
  const tenant = await client.models.Tenant.create({
    id: userAttributes["custom:tenantId"],
    name: userAttributes["custom:tenantName"],
    status: "pending",
    // owner: userAttributes.email,
  });
  console.log(tenant);
  return event;
};
