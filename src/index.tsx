import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from './StateProvider/Provider';
import { CustomToastProvider } from './StateProvider/CustomToastContext/CustomToastContext';
import { MsalProvider } from '@azure/msal-react';
import AzureInstance from './AzureInstance';
import { init } from '@sentry/react';
import 'ag-grid-community/dist/styles/ag-grid.min.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles/index.scss';
import './styles/custom-react-table.scss';
import './styles/common-styles.scss';
import './styles/material-component.scss';
import './styles/responsive-styles.scss';
import './styles/rbc-calender.scss';
import './styles/vis-network/vis-network.min.css';
import './styles/safari.scss';
import { Integrations } from '@sentry/tracing';
import { CustomNotificationCountProvider } from './StateProvider/CustomNotificationCountContext/CustomNotificationCountContext';
import './components/Chatter/style.scss';
import { CustomChatNotificationCountProvider } from './StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext';
import { GlobalChatProvider } from './StateProvider/GlobalChatContext';
import { CustomOfflineProvider } from './StateProvider/OfflineContext/OfflineContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { version } from '../package.json';
import { WishlistProvider } from './StateProvider/WishlistContext/WishlistProvider';

// @ts-ignore
if (process.env.REACT_APP_ENV !== 'local') {
  init({
    environment: process.env.REACT_APP_ENV,
    release: version,
    dsn: 'https://42514b3242b14f7d8c5b8dbacd0c4237@o718098.ingest.sentry.io/5850347',
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.1
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
                  <CustomOfflineProvider>
                    <WishlistProvider>
                      <App />
                    </WishlistProvider>
                  </CustomOfflineProvider>
                </GlobalChatProvider>
              </MsalProvider>
            </CustomChatNotificationCountProvider>
          </CustomNotificationCountProvider>
        </CustomToastProvider>
      </Provider>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();
