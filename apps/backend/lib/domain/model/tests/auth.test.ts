import { signInFactory } from "../auth";
import type { Config } from "../config";
// describe("Amplifyを使用せず認証ロジックを疑似出来る", () => {
//   const config: Config = {
//     type: "NO_AMPLIFY",
//     dummyUserAttributes: {
//       "custom:tenantId": "id",
//       "custom:tenantName": "name",
//       "custom:tenantRole": "ADMIN",
//     },
//   };
//   test("signIn", async () => {
//     const f = signInFactory(config);
//     const output = await f({ username: "test-name" });
//     expect(output.isSignedIn).toBe(true);
//     expect(output.nextStep.signInStep).toBe("DONE");
//   });
//   test("getCurrentUser", async () => {
//     const f = getCurrentUserFactory(config);
//     const output = await f();
//     expect(output.userId).toBe("dummy-id");
//   });
//   test("fetchUserAttributes", async () => {
//     const f = fetchUserAttributesFactory(config);
//     const output = await f();
//     expect(output["custom:tenantId"]).toBe("id");
//     expect(output["custom:tenantName"]).toBe("name");
//     expect(output["custom:tenantRole"]).toBe("ADMIN");
//   });
//   test("signOut", async () => {
//     const f = signOutFactory(config);
//     const output = await f();
//     expect(output).toBe(undefined);
//   });
// });

describe("サインインロジック", () => {
  test("クライアントメタデータとしてアプリケーション種別を渡すことが出来る", async () => {
    const mockSignIn = vi.fn<Parameters<typeof signInFactory>[0]>(async () => {
      return {
        isSignedIn: true,
        nextStep: { signInStep: "DONE" },
      };
    });
    const signIn = signInFactory(mockSignIn, {
      appType: "control-plane",
    } as Config);

    await signIn({ username: "test" });

    expect(mockSignIn).toHaveBeenCalledWith(
      expect.objectContaining({
        options: {
          clientMetadata: {
            appType: "control-plane",
          },
        },
      } as unknown as Parameters<typeof signIn>[0])
    );
  });
});
