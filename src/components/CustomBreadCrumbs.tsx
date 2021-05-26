import { Breadcrumbs, Typography } from "@material-ui/core";
import { Link } from "react-router-dom";

const CustomBreadCrumbs = ({ routes = [] }) => {
  return (
    <div >
      <Breadcrumbs separator="›" aria-label="breadcrumb">
        <Link to="/" className="cursor-pointer">
          Home
        </Link>

        {routes.map((route, index) => {
          return index !== routes.length - 1 ? (
            <Link
              key={index}
              to={route.path}
              className="cursor-pointer">
              {route.title}
            </Link>
          ) : (
            <Typography key={index}>
              {route.title}
            </Typography>
          );
        })}
      </Breadcrumbs>
    </div>
  );
};

export default CustomBreadCrumbs;
