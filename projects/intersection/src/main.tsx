import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import sharedOutputs from "../shared/amplify_outputs.json";
// コントロールプレーン側から共有したい
// リソース設定を上書きする
Amplify.configure({
  ...outputs,
  auth: sharedOutputs.auth,
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Authenticator>
      <App />
    </Authenticator>
  </StrictMode>
);
