import { Suspense, useEffect, useState, Fragment } from "react";
import { camelCase } from "lodash";
import { Redirect, Route, useLocation } from "react-router-dom";
import { useData } from "../StateProvider/Provider";
import Unauthorized from "../pages/Unauthorized";
import Layout from "./Layout";

const ProtectedRoute = ({ children, ...rest }) => {
  const {
    state: { user, permissions, userLoading },
  }: any = useData();
  const { pathname, key } = useLocation();
  const token = localStorage.getItem("token");
  const [access, setAccess] = useState(false);
  const [checking, setChecking] = useState(true);

  const pathnames = pathname.split("/").filter((x) => x);

  useEffect(() => {
    checkAccess();
    // eslint-disable-next-line
  }, [key, user]);

  const checkAccess = async () => {
    let path = camelCase(pathnames[0]);

    if (path === "quotes") {
      path = "quoteBuilder";
    }
    if (permissions && permissions[path]) {
      if (permissions[path].isRead) {
        setAccess(true);
        setChecking(false);
      }
    } else if (
      pathname === "/" ||
      [
        "case",
        "task",
        "attachment",
        "note",
        "event",
        "terms-conditions",
        "product-category",
        "product-template",
        "price-template",
        "form-builder",
        "product-builder",
        "currency-converter",
        "profile",
        "brand-configuration",
        "project-sales",
        "doa-request",
        "product-list",
        "product/details",
        "quote-pdf-template"
      ].indexOf(pathnames[0]) >= 0
    ) {
      setAccess(true);
      setChecking(false);
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
                width: "100vw",
                height: "100vh",
                padding: "1rem",
              }}
            >
              <p>Checking Credentials...</p>
            </div>
          ) : access ? (
            <Layout>
              <Suspense fallback={<div>Loading...</div>}>
                {children}
              </Suspense>
            </Layout>
          ) : (
            <Unauthorized />
          )
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              search: `${location && location.pathname
                ? `?redirect=${location.pathname}${location.search}`
                : null
                }`,
              state: { from: location },
            }}
          />
        )
      }
    />
  );
};

export default ProtectedRoute;
