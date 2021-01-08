import React from "react";
import Sidebar from "./Sidebar/Sidebar";

const Layout = ({ children }) => {
  return (
    <div>
      <Sidebar>{children}</Sidebar>
    </div>
  );
};

export default Layout;
