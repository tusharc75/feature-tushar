import { Breadcrumbs, Typography } from "@material-ui/core";
import { Fragment } from "react";
import { Link } from "react-router-dom";

const CustomBreadCrumbs = ({
  routes = [], isConfirmBeforeClick = false,
  onBreadCrumbClick = null, onRouteClick = null }) => {

  return <Breadcrumbs separator="›" aria-label="breadcrumb">
    {
      isConfirmBeforeClick ?
        <Typography
          className={`${"cursor-pointer"} ${"setLink"}`}
          onClick={() => onBreadCrumbClick('/')}>
          Home
        </Typography>
        : <Link to="/" className={`${"cursor-pointer"} ${"setLink"}`}>
          Home
        </Link>
    }

    {
      routes.map((route, index) => {
        return index !== routes.length - 1 ? (
          isConfirmBeforeClick ?
            <Typography
              key={index}
              className="cursor-pointer setLink"
              onClick={() => onBreadCrumbClick(route.path)}>
              {route.title}
            </Typography>
            :
            <Link
              key={index}
              to={route.path}
              className="cursor-pointer setLink"
            >
              {route.title}
            </Link>

        ) : <Typography
          onClick={() => {
            if (route?.hasOnClick) {
              onRouteClick()
            }
          }} key={index} className="setLink text-truncate detail-heading-bread-crumb">
          {route.title}
        </Typography>

      })
    }
  </Breadcrumbs>
};

export default CustomBreadCrumbs;
