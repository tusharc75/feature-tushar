import { useEffect, useState } from 'react';
import { camelCase } from 'lodash';
import { Redirect, Route, useLocation } from 'react-router-dom';
import { useData } from '../StateProvider/Provider';
import Unauthorized from '../pages/Unauthorized';
import Layout from './Layout';
import NotFound from 'src/pages/NotFound';
import UserManual from '../pages/UserManual';

const ProtectedRoute = ({ children, ...rest }) => {
  const {
    state: { user, permissions, userLoading }
  }: any = useData();
  const { pathname, key } = useLocation();
  const token = localStorage.getItem('token');
  const [access, setAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(false);

  const pathnames = pathname.split('/').filter((x) => x);

  useEffect(() => {
    checkAccess();
    // eslint-disable-next-line
  }, [key, user]);

  const checkAccess = async () => {
    let path = camelCase(pathnames[0]);
    if (path === 'quotes') {
      path = 'quoteBuilder';
    }
    if (permissions && permissions[path]) {
      if (permissions[path].isRead) {
        setAccess(true);
        setChecking(false);
      }
    } else if (
      pathname === '/' ||
      [
        'dashboards',
        'case',
        'task',
        'user-manual',
        'attachment',
        'note',
        'event',
        'terms-conditions',
        'product-template',
        'price-template',
        'product-builder',
        'currency-converter',
        'profile',
        'brand-configuration',
        'support-ticket',
        'doa-request',
        'quote-pdf-template',
        'equiptment-rental-master',
        'entity',
        'logout',
        'reports',
        'erecs',
        'resource-calendar',
        'serialized-asset-new',
        'import-export',
        'custom-report',
        'user-download-request',
        'trigger-notification-history',
        'reports-new'
      ].indexOf(pathnames[0]) >= 0
    ) {
      setAccess(true);
      setChecking(false);
    } else {
      setAccess(false);
      setChecking(false);
      setError(true);
    }
  };
  return (
    <Route
      {...rest}
      render={({ location }) =>
        user || token ? (
          checking || userLoading ? (
            <div
              style={{
                padding: '1rem'
              }}
            >
              <p>Checking Credentials...</p>
            </div>
          ) : access && rest?.userManual ? (
            <UserManual />
          ) : access ? (
            <Layout>{children}</Layout>
          ) : error ? (
            <NotFound />
          ) : (
            <Unauthorized />
          )
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              search: `${location && location.pathname ? `?redirect=${location.pathname}${location.search}` : null}`,
              state: { from: location }
            }}
          />
        )
      }
    />
  );
};

export default ProtectedRoute;
