import Authenticator from "./components/Authenticator";
import { LocalStateRepository } from "./components/utils";
import Header from "./components/Header";
import TenantInfo from "./components/TenantInfo";
import React from "react";
import LeftMenu from "./components/LeftMenu";
import { Box, CssBaseline } from "@mui/material";

function App() {
  const stateRepository = new LocalStateRepository();
  const [signedIn, setSignedIn] = React.useState(
    stateRepository.get("signedIn", false)
  );
  const [leftMenuOpened, setLeftMenuOpened] = React.useState(
    stateRepository.get("leftMenuOpened", false)
  );
  const [userAttributes, setUserAttributes] = React.useState(
    stateRepository.get("userAttributes", null)
  );
  const [tenant, setTenant] = React.useState(
    stateRepository.get("tenant", null)
  );
  return (
    <>
      {/* <Authenticator
        stateRepository={stateRepository}
        setSignedIn={setSignedIn}
        setTenant={setTenant}
        setUserAttributes={setUserAttributes}
      >
        {({ signOut }) => (
          <> */}
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <Header
          // signOut={signOut}
          signOut={undefined}
          stateRepository={stateRepository}
          userAttributes={userAttributes}
          setUserAttributes={setUserAttributes}
          signedIn={signedIn}
          leftMenuOpened={leftMenuOpened}
          setLeftMenuOpened={setLeftMenuOpened}
        />
        <LeftMenu
          stateRepository={stateRepository}
          leftMenuOpened={leftMenuOpened}
          setLeftMenuOpened={setLeftMenuOpened}
        />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          {/* <DrawerHeader /> */}
          <TenantInfo
            stateRepository={stateRepository}
            userAttributes={userAttributes}
            tenant={tenant}
            setTenant={setTenant}
          />
        </Box>
      </Box>
      {/* </>
        )}
      </Authenticator> */}
    </>
  );
}

export default App;
