import { PreSignUpTriggerHandler } from "aws-lambda";
import { generateClient } from "aws-amplify/data";
import { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import type { SignupUserAttributes } from "../../../app/models/admin-user";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "../../../.amplify/generated/env/pre-sign-up";
/**
 * テナント管理者に対応するテナントアイデンティティをDB上に作成する
 * @param event
 */
export const handler: PreSignUpTriggerHandler = async (event) => {
  const { resourceConfig, libraryOptions } =
    await getAmplifyDataClientConfig(env);
  Amplify.configure(resourceConfig, libraryOptions);
  const client = generateClient<Schema>();

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
