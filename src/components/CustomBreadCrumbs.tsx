import { Breadcrumbs, Typography } from "@material-ui/core";
import { Fragment } from "react";
import { Link } from "react-router-dom";

const CustomBreadCrumbs = ({ routes = [], isConfirmBeforeClick = false, onBreadCrumbClick = null }) => {

  return <Breadcrumbs separator="›" aria-label="breadcrumb">
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

    {
      routes.map((route, index) => {
        return index !== routes.length - 1 ? (
          isConfirmBeforeClick ?
            <Typography
              key={index}
              className="cursor-pointer"
              onClick={() => onBreadCrumbClick(route.path)}>
              {route.title}
            </Typography>
            :
            <Link
              key={index}
              to={route.path}
              className="cursor-pointer" >
              {route.title}
            </Link>
        ) : <Typography key={index}>
          {route.title}
        </Typography>

      })
    }
  </Breadcrumbs>
};

export default CustomBreadCrumbs;
