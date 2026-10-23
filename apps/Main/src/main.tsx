import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { AppwriteProvider, AuthProvider } from "@repo/react-appwrite";

import i18n from "./i18n";
import { Provider } from "./components/ui/provider";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "./lib/appwrite";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <Provider>
        <AppwriteProvider
          endpoint={APPWRITE_ENDPOINT}
          project={APPWRITE_PROJECT_ID}
        >
          <AuthProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AuthProvider>
        </AppwriteProvider>
      </Provider>
    </I18nextProvider>
  </React.StrictMode>
);
