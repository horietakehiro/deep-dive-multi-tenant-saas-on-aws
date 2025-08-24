import type {
  PreSignUpTriggerEvent,
  PreSignUpTriggerHandler,
} from "aws-lambda";
import type { IRepository, IRepositoryFactory } from "../port/repository";
import type { SignupUserAttributes } from "../model/user";
import type { Config } from "../model/config";

export const preSingUpServiceFactory = (
  config: Config,
  repositoryFactory: IRepositoryFactory<"createTenant">
): ((
  event: Pick<PreSignUpTriggerEvent, "request">
) => ReturnType<PreSignUpTriggerHandler>) => {
  return async (event: Pick<PreSignUpTriggerEvent, "request">) => {
    const repository = await repositoryFactory(config);
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
