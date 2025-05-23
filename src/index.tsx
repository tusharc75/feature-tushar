import { MsalProvider } from '@azure/msal-react';
import { init } from '@sentry/react';
import { Integrations } from '@sentry/tracing';
import React from 'react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { VITE_APP_ENV } from 'src/config';
import TimezoneLocalizationProvider from 'src/StateProvider/TimeLocalizationProvider';
import { version } from '../package.json';
import App from './App';
import AzureInstance from './AzureInstance';
import './components/Chatter/style.scss';
import { NewAddressOptionListProvider } from './StateProvider/AddressProvider';
import { CustomChatNotificationCountProvider } from './StateProvider/CustomChatNotificationCountContext/CustomChatNotificationCountContext';
import { CustomNotificationCountProvider } from './StateProvider/CustomNotificationCountContext/CustomNotificationCountContext';
import { CustomToastProvider } from './StateProvider/CustomToastContext/CustomToastContext';
import { FastProvider } from './StateProvider/fastContext';
import { CustomOfflineProvider } from './StateProvider/OfflineContext/OfflineContext';
import { Provider } from './StateProvider/Provider';
import './styles/colors.scss';
import './styles/common-styles.scss';
import './styles/custom-react-table.scss';
import './styles/index.scss';
import './styles/material-component.scss';
import './styles/rbc-calender.scss';
import './styles/responsive-styles.scss';
import './styles/safari.scss';
import './styles/vis-network/vis-network.min.css';
import './components/CustomCalendar/index.scss';
import './styles/ai.scss';
import { InfoSidebarProvider } from 'src/components/InfoSidebar/store';

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
                  <CustomOfflineProvider>
                    <NewAddressOptionListProvider>
                      <InfoSidebarProvider>
                        <TimezoneLocalizationProvider>
                          <App />
                        </TimezoneLocalizationProvider>
                      </InfoSidebarProvider>
                    </NewAddressOptionListProvider>
                  </CustomOfflineProvider>
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
