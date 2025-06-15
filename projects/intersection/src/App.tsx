import { LocalStateRepository } from "./../../control-plane/src/components/utils";
import Authenticator from "./components/Authenticator";
import AppBar from "./components/AppBar";
import React from "react";
import { Files } from "./components/Files";
import outputs from "./../amplify_outputs.json";
import sharedOutputs from "./../shared/amplify_outputs.json";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { Schema } from "../../control-plane/amplify/data/resource";
Amplify.configure({
  ...outputs,
  data: {
    ...sharedOutputs.data,
  },
});

function App() {
  const client = generateClient<Schema>();

  const stateRepository = new LocalStateRepository();
  const [signedIn, setSignedIn] = React.useState(
    stateRepository.get("signedIn", false)
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
        tenantGetter={async (tenantId) => {
          return (await client.models.Tenant.get({ id: tenantId })).data;
        }}
      >
        {({ signOut }) => (
          <>
            <AppBar
              signOut={signOut}
              stateRepository={stateRepository}
              signedIn={signedIn}
            />
            <Files
              resourcesConfig={Amplify.getConfig()}
              stateRepository={stateRepository}
              tenant={tenant}
            />
          </>
        )}
      </Authenticator>
    </>
  );
}

export default App;
