import React from "react";
import { Redirect, Route } from "react-router-dom";
import { useData } from "../StateProvider/Provider";

const ProtectedRoute = ({ children, ...rest }) => {
  const {
    state: { user, token },
  } = useData();

  return (
    <Route
      {...rest}
      render={({ location }) =>
        user || token ? (
          children
        ) : (
          <Redirect to={{ pathname: "/login", state: { from: location } }} />
        )
      }
    />
  );
};

export default ProtectedRoute;
