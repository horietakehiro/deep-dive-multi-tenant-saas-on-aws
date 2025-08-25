import { amplifyRepositoryFactory } from "../../../adaptor/repository";
import type { CustomUserAttributes } from "../../model/user";
import type { IRepository, TenantClient } from "../../port/repository";
import { preSingUpServiceFactory } from "../pre-sign-up";
describe("サインアップ前プロセス", () => {
  test("ユーザのカスタム属性に対応したテナントアイデンティティを作成出来る", async () => {
    const mockCreateTenant = vi.fn<IRepository["createTenant"]>(
      async (props) => {
        return {
          data: {
            id: props.id!,
            name: props.name!,
            status: "pending",
            url: null,
            createdAt: "",
            updatedAt: "",
            spots: () => {
              throw Error();
            },
            users: () => {
              throw Error();
            },
          },
        };
      }
    );

    const userAttributes = {
      "custom:tenantId": "dummy-id",
      "custom:tenantName": "dummy-name",
      "custom:tenantRole": "ADMIN",
    } satisfies CustomUserAttributes;
    const service = preSingUpServiceFactory(
      {
        type: "NO_AMPLIFY",
        dummyUserAttributes: userAttributes,
      },
      async () => {
        return {
          createTenant: mockCreateTenant,
        };
      }
    );
    await service({
      request: {
        userAttributes: {
          ...userAttributes,
        },
      },
    });
    expect(mockCreateTenant).toHaveBeenCalledWith({
      id: "dummy-id",
      name: "dummy-name",
      status: "pending",
    });
  });
});
