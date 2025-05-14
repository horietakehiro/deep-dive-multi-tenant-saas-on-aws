import * as React from "react";
// import { v4 as uuidv4 } from "uuid";
// import {
//   fetchUserAttributes,
//   FetchUserAttributesOutput,
//   signUp,
//   SignUpInput,
// } from "aws-amplify/auth";
// import "./App.css";
// import { Authenticator } from "@aws-amplify/ui-react";
// import {} from "aws-amplify/auth";
// import MyAppBar from "./components/AppBar";
// import {
//   type SignUpUserAttributes,
//   SIGNUP_CUSTOM_USER_ATTRIBUTES,
// } from "./../amplify/auth/types";
// import TenantInfo from "./components/Tenant";
// import { Hub } from "aws-amplify/utils";
import Authenticator from "./components/Authenticator";
import { LocalStateRepository, StateKey } from "./components/utils";
import AppBar from "./components/AppBar";
import TenantInfo from "./components/TenantInfo";

function App() {
  const stateRepository = new LocalStateRepository();

  // const [userAttributes, setUserAttributes] = React.useState<
  //   FetchUserAttributesOutput | SignUpUserAttributes | undefined
  // >(undefined);

  // const getUserAttributes = async () => {
  //   const res = await fetchUserAttributes();
  //   console.log(res);
  //   setUserAttributes(res);
  // };

  // Hub.listen("auth", async ({ payload }) => {
  //   switch (payload.event) {
  //     case "signedIn":
  //       console.log("signed in");
  //       await getUserAttributes();
  //       break;
  //   }
  // });

  // const services = {
  //   handleSignUp: async (input: SignUpInput) => {
  //     const userAttributes: SignUpUserAttributes = {
  //       // テナントIDはUUIDを生成し、テナント名はユーザから入力してもらう
  //       "custom:tenantId": uuidv4(),
  //       "custom:tenantName":
  //         input.options!.userAttributes[
  //           SIGNUP_CUSTOM_USER_ATTRIBUTES.TENANT_NAME
  //         ]!,
  //       email: input.options!.userAttributes["email"]!,
  //     };
  //     console.log(input);
  //     return signUp({
  //       ...input,
  //       options: {
  //         ...input.options,
  //         userAttributes: {
  //           ...input.options?.userAttributes,
  //           ...userAttributes,
  //         },
  //       },
  //     });
  //   },
  // };
  return (
    <>
      {/* <Authenticator
        formFields={{
          signUp: {
            [SIGNUP_CUSTOM_USER_ATTRIBUTES.TENANT_NAME]: {
              label: "Tenant Name",
              isRequired: true,
              order: 1,
            },
          },
        }}
        services={services}
      >
        {({ signOut }) => (
          <main>
            <MyAppBar signOut={signOut} />
            {userAttributes && userAttributes["custom:tenantId"] ? (
              <TenantInfo id={userAttributes["custom:tenantId"]} />
            ) : (
              <></>
            )}
          </main>
        )}
      </Authenticator> */}
      <Authenticator stateRepository={stateRepository}>
        {({ signOut }) => (
          <>
            <AppBar signOut={signOut} stateRepository={stateRepository} />
            <TenantInfo stateRepository={stateRepository} />
          </>
        )}
      </Authenticator>
    </>
  );
}

export default App;
