import React from "react";
import ReactDOM from "react-dom";
import ReactGA from "react-ga";
import App from "./App";
// import reportWebVitals from "./reportWebVitals";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "./StateProvider/Provider";
import { CustomToastProvider } from "./StateProvider/CustomToastContext/CustomToastContext";
import { MsalProvider } from "@azure/msal-react";
import AzureInstance from "./AzureInstance";
import RouteChangeTracker from "./components/GoogleAnalytics/RouteChangeTracker";
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

Sentry.init({
  dsn: "https://b9188e1338604e7c9e6a0bdd2978b210@o718098.ingest.sentry.io/5780577",
  integrations: [new Integrations.BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

//* Google Analytics */
const TRACKING_ID = "UA-196035023-2"; // YOUR_OWN_TRACKING_ID
ReactGA.initialize(TRACKING_ID);



ReactDOM.render(
  <React.StrictMode>
    <Router>
      <RouteChangeTracker>
        <Provider>
          <CustomToastProvider>
            <CustomNotificationCountProvider>
              <CustomChatNotificationCountProvider>
                <MsalProvider instance={AzureInstance}>
                  <App />
                </MsalProvider>
              </CustomChatNotificationCountProvider>
            </CustomNotificationCountProvider>
          </CustomToastProvider>
        </Provider>
      </RouteChangeTracker>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
