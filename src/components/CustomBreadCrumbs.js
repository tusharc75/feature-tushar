import _ from "lodash";
import { Breadcrumbs, Link as MuiLink, Typography } from "@material-ui/core";
import "./sidebar.css"

const CustomBreadCrumbs = ({ routes = [] }) => {

    return (
        <Breadcrumbs separator="›" aria-label="breadcrumb">
            <MuiLink color="inherit" to="/" className="cursor-pointer">
                Home
            </MuiLink>

            {
                routes.map((route, index) => {
                    return (index !== routes.length - 1) ?
                        <MuiLink key={index} color="inherit" to={route.path}>
                            {route.title}
                        </MuiLink> :
                        <Typography key={index} color="textPrimary">{route.title}</Typography>
                })
            }
        </Breadcrumbs>
    );

};

export default CustomBreadCrumbs;
