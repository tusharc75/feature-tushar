import { useEffect, useState } from "react";
import { camelCase } from "lodash";
import { Redirect, Route, useLocation } from "react-router-dom";
import { useData } from "../StateProvider/Provider";
import Unauthorized from "../pages/Unauthorized";

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
    const path = camelCase(pathnames[0]);
    if (permissions && permissions[path]) {
      if (permissions[path].isRead) {
        setAccess(true);
        setChecking(false);
      }
    } else if (
      pathname === "/" ||
      ["activity", "terms-conditions", "product-category", "product-template", "product-cost", "form-builder", "product-builder","currency-converter",
        "profile", "brand-configuration", "project-sales"].indexOf(pathnames[0]) >= 0) {
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
            children
          ) : (
            <Unauthorized />
          )
        ) : (
          <Redirect to={{ pathname: "/login", state: { from: location } }} />
        )
      }
    />
  );
};

export default ProtectedRoute;
