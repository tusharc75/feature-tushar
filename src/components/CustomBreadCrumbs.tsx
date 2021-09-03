import { useState } from "react"
import { Breadcrumbs, Typography } from "@material-ui/core";
import { Link } from "react-router-dom";
import ConfirmCancelDialog from "../components/ConfirmCancelDialog"

const CustomBreadCrumbs = ({ routes = [], isConfirmBeforeClick = false, onBreadCrumbClick = null }) => {

  return (
    <div >
      <Breadcrumbs separator="›" aria-label="breadcrumb">
        {
          isConfirmBeforeClick ?
            <Typography
              className="cursor-pointer"
              onClick={() => onBreadCrumbClick('/')}>
              Home
            </Typography>
            : <Link to="/" className="cursor-pointer">
              Home
            </Link>
        }

        {routes.map((route, index) => {
          return index !== routes.length - 1 ? (
            <>
              {
                isConfirmBeforeClick ?
                  <Typography
                    className="cursor-pointer"
                    onClick={() => onBreadCrumbClick(route.path)}>
                    {route.title}
                  </Typography>
                  :
                  < Link
                    key={index}
                    to={route.path}
                    className="cursor-pointer" >
                    {route.title}
                  </Link>
              }
            </>
          ) : (
            <Typography key={index}>
              {route.title}
            </Typography>
          );
        })}
      </Breadcrumbs>
    </div >
  );
};

export default CustomBreadCrumbs;
