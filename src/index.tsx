import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
// import reportWebVitals from "./reportWebVitals";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "./StateProvider/Provider";
import { CustomToastProvider } from "./StateProvider/CustomToastContext/CustomToastContext";
import { MsalProvider } from "@azure/msal-react";
import AzureInstance from "./AzureInstance";
import 'ag-grid-community/dist/styles/ag-grid.min.css';
import "./styles/index.scss";
import "./styles/common-styles.scss";
import "./styles/material-component.scss";
import "./styles/responsive-styles.scss"
import "./styles/vis-network/vis-network.min.css"
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";

Sentry.init({
    dsn: "https://b9188e1338604e7c9e6a0bdd2978b210@o718098.ingest.sentry.io/5780577",
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});



ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Provider>
        <CustomToastProvider>
          <MsalProvider instance={AzureInstance}>
            <App />
          </MsalProvider>
        </CustomToastProvider>
      </Provider>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
