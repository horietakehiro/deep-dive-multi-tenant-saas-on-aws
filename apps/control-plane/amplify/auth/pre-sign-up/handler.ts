import { PreSignUpTriggerEvent } from "aws-lambda";
import { generateClient } from "aws-amplify/data";
import { Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import type { SignupUserAttributes } from "../../../app/models/admin-user";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "../../../.amplify/generated/env/pre-sign-up";
import type { F } from "../../../app/utils";
export interface Client {
  createTenant: F<
    ReturnType<typeof generateClient<Schema>>["models"]["Tenant"]["create"]
  >;
}
export const handlerFactory = (
  clientFn: () => Promise<Client>
): ((event: Pick<PreSignUpTriggerEvent, "request">) => void) => {
  return async (event: Pick<PreSignUpTriggerEvent, "request">) => {
    console.log(event);
    const userAttributes = event.request.userAttributes as SignupUserAttributes;

    const client = await clientFn();
    // テナントアイデンティティを作成
    const tenant = await client.createTenant({
      id: userAttributes["custom:tenantId"],
      name: userAttributes["custom:tenantName"],
      status: "pending",
    });
    console.log(tenant);
    return event;
  };
};
/**
 * テナント管理者に対応するテナントアイデンティティをDB上に作成する
 * @param event
 */
export const handler = handlerFactory(async () => {
  const { resourceConfig, libraryOptions } =
    await getAmplifyDataClientConfig(env);
  Amplify.configure(resourceConfig, libraryOptions);
  const client = generateClient<Schema>();
  return {
    createTenant: async (props) => client.models.Tenant.create(props),
  };
});
