import {v4 as uuidv4} from "uuid"
import { useEffect, useState } from "react";
import { getCurrentUser, GetCurrentUserOutput, signUp, SignUpInput } from "aws-amplify/auth";
import "./App.css";
import { Authenticator } from "@aws-amplify/ui-react";
import {} from "aws-amplify/auth";
import MyAppBar from "./components/AppBar";
import {SIGNUP_CUSTOM_USER_ATTRIBUTES, SignUpUserAttributes} from "./../amplify/auth/resource"
function App() {
  const [user, setUser] = useState<GetCurrentUserOutput>();
  const getCurrentUserAsync = async () => {
    const res = await getCurrentUser();
    setUser(res);
  };

  useEffect(() => {
    getCurrentUserAsync();
  }, []);
  const services = {
    async handleSignUp(input: SignUpInput) {
      const userAttributes: SignUpUserAttributes = {
        "custom:tenantId": uuidv4(),
        "custom:tenantName": input.options!.userAttributes[SIGNUP_CUSTOM_USER_ATTRIBUTES.TENANT_NAME]!,
        email: input.options!.userAttributes["email"]!,
      }
      console.log(input)
      return signUp({
        ...input,
        options: {
          ...input.options,
          userAttributes: {
            ...input.options?.userAttributes,
            ...userAttributes
          }
        }
      })

    }
  }
  return (
    <>
      <Authenticator formFields={{
        signUp: {
          [SIGNUP_CUSTOM_USER_ATTRIBUTES.TENANT_NAME]: {
            label: "Tenant Name",
            isRequired: true,
            order: 1,
          }
        }
      }} services={services}>
        {({ signOut }) => (
          <main>
            {user && user.signInDetails && user.signInDetails.loginId ? (
              <MyAppBar
                username={user.signInDetails.loginId}
                signOut={signOut}
              />
            ) : (
              <div></div>
            )}
          </main>
        )}
      </Authenticator>
    </>
  );
}

export default App;
