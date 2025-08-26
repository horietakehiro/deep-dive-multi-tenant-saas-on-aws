import { generateClient } from "aws-amplify/api";
import type { CustomUserAttributes } from "@intersection/backend/lib/domain/model/user";
import type { IRepository } from "../../port/repository";
import { preSingUpServiceFactory } from "../pre-sign-up-service";
import type { Schema } from "@intersection/backend/lib/domain/model/data";

const clientForType = async () => {
  return await generateClient<Schema>()["models"]["Tenant"]["get"](
    { id: "" },
    {
      selectionSet: ["id", "name"],
    }
  );
};
describe("サインアップ前プロセス", () => {
  test("ユーザのカスタム属性に対応したテナントアイデンティティを作成出来る", async () => {
    const mockCreateTenant = vi.fn<typeof clientForType>(async () => {
      return {
        data: { id: "dummy-id", name: "dummy-name" },
      };
    });
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
          createTenant: mockCreateTenant as IRepository["createTenant"],
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
    expect(mockCreateTenant).toHaveBeenCalledWith(
      {
        id: "dummy-id",
        name: "dummy-name",
        status: "pending",
      },
      {
        selectionSet: ["id", "name", "status"],
      }
    );
  });
});
