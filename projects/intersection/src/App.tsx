import { LocalStateRepository } from "./../../control-plane/src/components/utils";
import Authenticator from "./components/Authenticator";
import AppBar from "./components/AppBar";
import React from "react";

function App() {
  const stateRepository = new LocalStateRepository();
  const [signedIn, setSignedIn] = React.useState(
    stateRepository.get("signedIn", false)
  );
  return (
    <>
      <Authenticator
        stateRepository={stateRepository}
        setSignedIn={setSignedIn}
      >
        {({ signOut }) => (
          <>
            <AppBar
              signOut={signOut}
              stateRepository={stateRepository}
              signedIn={signedIn}
            />
          </>
        )}
      </Authenticator>
    </>
  );
}

export default App;
