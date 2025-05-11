import { useEffect, useState } from "react";
import { getCurrentUser, GetCurrentUserOutput } from "aws-amplify/auth";
import "./App.css";
import { Authenticator } from "@aws-amplify/ui-react";
import {} from "aws-amplify/auth";
import MyAppBar from "./components/AppBar";
function App() {
  const [user, setUser] = useState<GetCurrentUserOutput>();
  const getCurrentUserAsync = async () => {
    const res = await getCurrentUser();
    setUser(res);
  };

  useEffect(() => {
    getCurrentUserAsync();
  }, []);

  return (
    <>
      <Authenticator>
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
