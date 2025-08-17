import { vi } from "vitest";
import { Client, handlerFactory } from "./handler";
import type { SignupUserAttributes } from "../../../app/models/admin-user";

describe("サインアップトリガー", () => {
  test("テナント管理者に対応するテナントアイデンティティを作成出来る", async () => {
    const mockCreateTenant = vi.fn<Client["createTenant"]>((props) => {
      return Promise.resolve({
        data: {
          id: props.id!,
          name: props.name!,
          status: "pending",
          url: null,
          // createdAt: "",
          // updatedAt: "",
          // users: () => {
          //   throw Error("このテストでは不要");
          // },
          // appointments: () => {
          //   throw Error("このテストでは不要");
          // },
          // spots: () => {
          //   throw Error("このテストでは不要");
          // },
        },
      });
    });
    const handler = handlerFactory(() => {
      return Promise.resolve({
        createTenant: mockCreateTenant,
      });
    });

    await handler({
      request: {
        userAttributes: {
          "custom:tenantId": "test-id",
          "custom:tenantName": "test-name",
          email: "test@example.com",
        } satisfies SignupUserAttributes,
      },
    });

    expect(mockCreateTenant).toHaveBeenCalledWith({
      id: "test-id",
      name: "test-name",
      status: "pending",
    });
  });
});
