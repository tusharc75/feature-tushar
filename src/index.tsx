import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "./StateProvider/Provider";
import "./styles/index.scss";
import "./styles/common-styles.scss";
import "./styles/material-component.scss";
import "./styles/responsive-styles.scss"
import { CustomToastProvider } from "./StateProvider/CustomToastContext/CustomToastContext";
import { CustomNotificationCountProvider } from "./StateProvider/CustomNotificationCountContext/CustomNotificationCountContext";

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Provider>
        <CustomToastProvider>
          <CustomNotificationCountProvider>
            <App />
          </CustomNotificationCountProvider>
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
