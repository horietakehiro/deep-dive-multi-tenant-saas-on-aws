import type { CustomUserAttributes } from "lib/domain/model/user";
import { preAuthentication, type Event } from "../pre-authentication";
import type { ClientMetadata } from "lib/domain/model/auth";

describe("サインイン認証前カスタムロジック", () => {
  const allowedRoles: CustomUserAttributes["custom:tenantRole"][] = [
    "ADMIN",
    "OWNER",
  ];
  const disallowedRoles: CustomUserAttributes["custom:tenantRole"][] = ["USER"];
  allowedRoles.forEach((role) => {
    test(`${role}ロールはコントロールプレーンにサインイン出来る`, async () => {
      const res = await preAuthentication({
        request: {
          userAttributes: {
            "custom:tenantRole": role,
          } as Pick<CustomUserAttributes, "custom:tenantRole">,
          validationData: {
            appType: "control-plane",
          } as ClientMetadata,
        },
        userName: "test-user",
      } as Event);

      expect(res.userName).toBe("test-user");
    });
  });
  disallowedRoles.forEach((role) => {
    test(`${role}ロールはコントロールプレーンにサインイン出来ない`, async () => {
      const f = async () => {
        await preAuthentication({
          request: {
            userAttributes: {
              "custom:tenantRole": role,
            } as Pick<CustomUserAttributes, "custom:tenantRole">,
            validationData: {
              appType: "control-plane",
            } as ClientMetadata,
          },
          userName: "test-user",
        } as Event);
      };

      expect(() => f()).rejects.toThrowError();
    });
  });

  const allRoles = allowedRoles.concat(disallowedRoles);
  allRoles.forEach((role) => {
    test(`${role}ロールはアプリケーションプレーンにサインイン出来る`, async () => {
      const res = await preAuthentication({
        request: {
          userAttributes: {
            "custom:tenantRole": role,
          } as Pick<CustomUserAttributes, "custom:tenantRole">,
          validationData: {
            appType: "application-plane",
          } as ClientMetadata,
        },
        userName: "test-user",
      } as Event);

      expect(res.userName).toBe("test-user");
    });
  });
});
