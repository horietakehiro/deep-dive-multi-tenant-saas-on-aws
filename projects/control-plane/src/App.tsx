import Authenticator from "./components/Authenticator";
import { LocalStateRepository } from "./components/utils";
import AppBar from "./components/AppBar";
import TenantInfo from "./components/TenantInfo";
import React from "react";

function App() {
  const stateRepository = new LocalStateRepository();
  const [signedIn, setSignedIn] = React.useState(
    stateRepository.get("signedIn", false)
  );
  const [userAttributes, setUserAttributes] = React.useState(
    stateRepository.get("userAttributes", null)
  );
  const [tenant, setTenant] = React.useState(
    stateRepository.get("tenant", null)
  );
  return (
    <>
      <Authenticator
        stateRepository={stateRepository}
        setSignedIn={setSignedIn}
        setTenant={setTenant}
        setUserAttributes={setUserAttributes}
      >
        {({ signOut }) => (
          <>
            <AppBar
              signOut={signOut}
              stateRepository={stateRepository}
              userAttributes={userAttributes}
              setUserAttributes={setUserAttributes}
              signedIn={signedIn}
            />
            <TenantInfo
              stateRepository={stateRepository}
              userAttributes={userAttributes}
              tenant={tenant}
              setTenant={setTenant}
            />
          </>
        )}
      </Authenticator>
    </>
  );
}

export default App;
