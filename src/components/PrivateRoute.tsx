import React, { useEffect, useState } from "react";
import { lowerCase, kebabCase } from "lodash";
import { Redirect, Route, useLocation } from "react-router-dom";
import { useData } from "../StateProvider/Provider";
import Unauthorized from "../pages/Unauthorized";
import Loader from "./Loader";

const ProtectedRoute = ({ children, ...rest }) => {
  const {
    state: { user },
  }: any = useData();
  const { pathname } = useLocation();
  const token = localStorage.getItem("token");
  const [access, setAccess] = useState(false);
  const [checking, setChecking] = useState(true);

  const pathnames = pathname.split("/").filter((x) => x);

  useEffect(() => {
    checkAccess();

    // eslint-disable-next-line
  }, [pathnames]);

  const checkAccess = async () => {
    const data = await user?.role.sideBar.find(
      (item) => lowerCase(kebabCase(item.name)) === pathnames[0]
    );
    if (data) {
      data.isRead ? setAccess(true) : setAccess(false);
      setChecking(false);
    }

    if (
      !pathnames.length ||
      pathname.includes("opportunity") ||
      pathname.includes("lead") ||
      pathname.includes("activity") ||
      pathname.includes("account") ||
      pathname.includes("contact") ||
      pathname.includes("product")
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
          checking ? (
            <Loader
              style={{ height: "calc(100vh - 88px)" }}
              text="Checking Authorization"
            />
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
