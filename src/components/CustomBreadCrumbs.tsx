import _ from "lodash";
import { Breadcrumbs, Link as MuiLink, Typography } from "@material-ui/core";
import { Link } from 'react-router-dom';

const CustomBreadCrumbs = ({ routes = [] }) => {

    return (
        <div className="breadcrumbbox">
                <Breadcrumbs separator="›" aria-label="breadcrumb">
                    <Link color="inherit" to="/" className="cursor-pointer">
                        Home
                    </Link>

                    {
                        routes.map((route, index) => {
                            return (index !== routes.length - 1) ?
                                <Link key={index} color="inherit" to={route.path} className="cursor-pointer">
                                    {route.title}
                                </Link> :
                                <Typography key={index} color="textPrimary">{route.title}</Typography>
                        })
                    }
                </Breadcrumbs>
        </div>
    );

};

export default CustomBreadCrumbs;
