import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from './StateProvider/Provider';
import { FastProvider, useStore } from './StateProvider/fastContext';
import { CustomToastProvider } from './StateProvider/CustomToastContext/CustomToastContext';
import { NewAddressOptionListProvider } from './StateProvider/AddressProvider';
import { MsalProvider } from '@azure/msal-react';
import AzureInstance from './AzureInstance';
import { init } from '@sentry/react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles/index.scss';
import './styles/custom-react-table.scss';
import './styles/common-styles.scss';
import './styles/material-component.scss';
import './styles/responsive-styles.scss';
import './styles/rbc-calender.scss';
import './styles/vis-network/vis-network.min.css';
import './styles/safari.scss';
import './styles/colors.scss';
import { Integrations } from '@sentry/tracing';
import { CustomNotificationCountProvider } from './StateProvider/CustomNotificationCountContext/CustomNotificationCountContext';
import './components/Chatter/style.scss';
import { CustomChatNotificationCountProvider } from './StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext';
import { GlobalChatProvider } from './StateProvider/GlobalChatContext';
import { CustomOfflineProvider } from './StateProvider/OfflineContext/OfflineContext';
import { version } from '../package.json';
import { FiltersProvider } from './StateProvider/FiltersContext/FiltersContext';
import { VITE_APP_ENV } from 'src/config';

// @ts-ignore
if (VITE_APP_ENV !== 'local' && navigator.onLine) {
  init({
    environment: VITE_APP_ENV,
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
      <FastProvider>
        <Provider>
          <CustomToastProvider>
            <CustomNotificationCountProvider>
              <CustomChatNotificationCountProvider>
                <MsalProvider instance={AzureInstance}>
                  <GlobalChatProvider>
                    <CustomOfflineProvider>
                      <NewAddressOptionListProvider>
                        <FiltersProvider>
                          <App />
                        </FiltersProvider>
                      </NewAddressOptionListProvider>
                    </CustomOfflineProvider>
                  </GlobalChatProvider>
                </MsalProvider>
              </CustomChatNotificationCountProvider>
            </CustomNotificationCountProvider>
          </CustomToastProvider>
        </Provider>
      </FastProvider>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
// serviceWorkerRegistration.register();
