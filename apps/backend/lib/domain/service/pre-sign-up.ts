import type { PreSignUpTriggerEvent } from "aws-lambda";
import type { IRepository } from "../port/repository";
import type { SignupUserAttributes } from "../model/user";

export const preSingUpServiceFactory = (
  repository: Pick<IRepository, "createTenant">
): ((event: Pick<PreSignUpTriggerEvent, "request">) => void) => {
  return async (event: Pick<PreSignUpTriggerEvent, "request">) => {
    console.log(event);
    const userAttributes = event.request.userAttributes as SignupUserAttributes;

    // テナントアイデンティティを作成
    const tenant = await repository.createTenant({
      id: userAttributes["custom:tenantId"],
      name: userAttributes["custom:tenantName"],
      status: "pending",
    });
    console.log(tenant);
    return event;
  };
};
