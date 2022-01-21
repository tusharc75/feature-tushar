import { Breadcrumbs, Typography } from "@material-ui/core";
import { Link } from "react-router-dom";
import mainRoutes from "../../Helpers/Routes";

const ECommerceBreadCrumbs = ({
  routes = [], isConfirmBeforeClick = false,
  onBreadCrumbClick = null, onRouteClick = null }) => {

  return <Breadcrumbs separator="›" aria-label="breadcrumb">
    {
      isConfirmBeforeClick ?
        <Typography
          className="cursor-pointer setLink font-weight-bold"
          onClick={() => onBreadCrumbClick(mainRoutes.eCommerce.path)}>
          Home
        </Typography>
        : <Link to={mainRoutes.eCommerce.path} className="cursor-pointer setLink font-weight-bold">
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
              className="cursor-pointer setLink font-weight-bold"
            >
              {route.title}
            </Link>

        ) : <Typography
          onClick={() => {
            if (route?.hasOnClick) {
              onRouteClick()
            }
          }} key={index} className="setLink detail-heading-bread-crumb">
          {route.title}
        </Typography>

      })
    }
  </Breadcrumbs>
};

export default ECommerceBreadCrumbs;
