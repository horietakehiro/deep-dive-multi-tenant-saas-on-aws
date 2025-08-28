import type { signUp as amplifySignUp } from "aws-amplify/auth";
import { signUpFactory } from "../sign-up";
import type { SignupUserAttributes } from "@intersection/backend/lib/domain/model/user";

describe("サインアップサービス", () => {
  test("サインアップ時に必要なテナント情報をバックエンドに渡すことが出来る", async () => {
    const mockSignUp = vi.fn<typeof amplifySignUp>(async (...args) => {
      console.debug(args);
      return {
        isSignUpComplete: true,
        nextStep: {
          signUpStep: "DONE",
        },
      };
    });
    const signUp = signUpFactory(mockSignUp, () => "test-id");
    await signUp({
      username: "test-name",
      options: {
        // Eメールとテナント名のみ渡されれる
        userAttributes: {
          "custom:tenantName": "test-name",
          email: "test@example.com",
        } satisfies Pick<SignupUserAttributes, "custom:tenantName" | "email">,
      },
    });

    expect(mockSignUp).toHaveBeenCalledWith<Parameters<typeof mockSignUp>>({
      username: "test-name",
      options: {
        userAttributes: {
          "custom:tenantId": "test-id",
          "custom:tenantName": "test-name",
          "custom:tenantRole": "OWNER",
          email: "test@example.com",
        } satisfies SignupUserAttributes,
      },
    });
  });
});
