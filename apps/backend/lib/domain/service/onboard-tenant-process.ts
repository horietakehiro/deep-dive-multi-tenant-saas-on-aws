import type {
  PreSignUpTriggerEvent,
  PreSignUpTriggerHandler,
} from "aws-lambda";
import type { IRepositoryFactory } from "../port/repository";
import type { SignupUserAttributes } from "../model/user";
import type { Config } from "../model/config";

/**
 * テナントアイデンティティと、テナント管理者のユーザーアイデンティティをDB上に作成する
 * @param config
 * @param repositoryFactory
 * @returns
 */
export const onboardTenantFactory = (
  config: Config,
  repositoryFactory: IRepositoryFactory<"createTenant" | "createUser">
): ((
  event: Pick<PreSignUpTriggerEvent, "request" | "userName">
) => ReturnType<PreSignUpTriggerHandler>) => {
  return async (event) => {
    const { createTenant, createUser } = await repositoryFactory(config);
    console.log(event);
    const userAttributes = event.request.userAttributes as SignupUserAttributes;
    const userId = event.userName;

    // テナントアイデンティティを作成
    const tenant = await createTenant({
      id: userAttributes["custom:tenantId"],
      name: userAttributes["custom:tenantName"],
      status: "pending",
    });
    console.log(tenant);

    // ユーザーアイデンティティを作成
    const user = await createUser({
      id: userId,
      tenantId: tenant.data?.id,
      email: userAttributes["email"],
      role: userAttributes["custom:tenantRole"],
      name: userAttributes["custom:ownerName"],
      departmentName: userAttributes["custom:ownerDepartmentName"],
      teamName: userAttributes["custom:ownerName"],
    });
    console.log(user);
    return event;
  };
};
