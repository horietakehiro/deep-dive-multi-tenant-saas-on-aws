import type { signUp } from "aws-amplify/auth";
import { CUSTOM_USER_ATTRIBUTES } from "../admin-user";
import { handleSignUpFactory } from "../auth";

describe("認証ロジック", () => {
  test("サインアップ時にテナント情報をカスタム属性として渡す", async () => {
    const mockSignUp = vi.fn<typeof signUp>((input) => {
      console.debug(input);
      return Promise.resolve({
        isSignUpComplete: true,
        nextStep: {
          signUpStep: "DONE",
        },
      });
    });
    await handleSignUpFactory(
      () => "tenant-id",
      mockSignUp
    )({
      username: "test-name",
      options: {
        userAttributes: {
          [CUSTOM_USER_ATTRIBUTES.TENANT_NAME]: "tenant-name",
          email: "test@example.com",
        },
      },
    });
    expect(mockSignUp).toHaveBeenCalledWith<Parameters<typeof signUp>>({
      username: "test-name",
      options: {
        userAttributes: {
          email: "test@example.com",
          [CUSTOM_USER_ATTRIBUTES.TENANT_NAME]: "tenant-name",
          [CUSTOM_USER_ATTRIBUTES.TENANT_ID]: "tenant-id",
        },
      },
    });
  });
});
