import Authenticator from "./components/Authenticator";
import { LocalStateRepository } from "./components/utils";
import AppBar from "./components/AppBar";
import TenantInfo from "./components/TenantInfo";

function App() {
  const stateRepository = new LocalStateRepository();
  return (
    <>
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
