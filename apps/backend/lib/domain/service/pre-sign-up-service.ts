import type {
  PreSignUpTriggerEvent,
  PreSignUpTriggerHandler,
} from "aws-lambda";
import type { IRepositoryFactory, TenantClient } from "../port/repository";
import type { SignupUserAttributes } from "../model/user";
import type { Config } from "../model/config";

export const preSingUpServiceFactory = (
  config: Config,
  repositoryFactory: IRepositoryFactory<"createTenant">
): ((
  event: Pick<PreSignUpTriggerEvent, "request">
) => ReturnType<PreSignUpTriggerHandler>) => {
  return async (event: Pick<PreSignUpTriggerEvent, "request">) => {
    const { createTenant } = await repositoryFactory(config);
    console.log(event);
    const userAttributes = event.request.userAttributes as SignupUserAttributes;

    // テナントアイデンティティを作成
    // TODO: 妥協案
    const tenant = await (createTenant as unknown as TenantClient["create"])(
      {
        id: userAttributes["custom:tenantId"],
        name: userAttributes["custom:tenantName"],
        status: "pending",
      },
      {
        selectionSet: ["id", "name", "status"],
      }
    );
    console.log(tenant);
    return event;
  };
};
