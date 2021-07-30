import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "./StateProvider/Provider";
import { CustomToastProvider } from "./StateProvider/CustomToastContext/CustomToastContext";
import { MsalProvider } from "@azure/msal-react";
import AzureInstance from "./AzureInstance";
import * as Sentry from "@sentry/react";
import 'ag-grid-community/dist/styles/ag-grid.min.css';
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./styles/index.scss";
import "./styles/common-styles.scss";
import "./styles/material-component.scss";
import "./styles/responsive-styles.scss"
import "./styles/rbc-calender.scss";
import "./styles/vis-network/vis-network.min.css"
import "./styles/safari.scss";
import { Integrations } from "@sentry/tracing";
import { CustomNotificationCountProvider } from "./StateProvider/CustomNotificationCountContext/CustomNotificationCountContext";
import "./components/Chatter/style.scss"
import { CustomChatNotificationCountProvider } from "./StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext";
import { GlobalChatProvider } from "./StateProvider/GlobalChatContext";

// @ts-ignore
if(process.env.REACT_APP_ENV !== 'local'){
  Sentry.init({
    environment: process.env.REACT_APP_ENV,
    release: process.env.REACT_APP_RELEASE,
    dsn: "https://42514b3242b14f7d8c5b8dbacd0c4237@o718098.ingest.sentry.io/5850347",
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: ['production', 'staging'].includes(process.env.REACT_APP_ENV) ? 0.2 : 0.6,
  });
}

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Provider>
        <CustomToastProvider>
          <CustomNotificationCountProvider>
            <CustomChatNotificationCountProvider>
              <MsalProvider instance={AzureInstance}>
                <GlobalChatProvider>
                  <App />
                </GlobalChatProvider>
              </MsalProvider>
            </CustomChatNotificationCountProvider>
          </CustomNotificationCountProvider>
        </CustomToastProvider>
      </Provider>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);
