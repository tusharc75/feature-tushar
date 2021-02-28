import _ from "lodash";
import { Breadcrumbs, Link as MuiLink, Typography } from "@material-ui/core";
import { Link, withRouter } from "react-router-dom";
import { capitalize } from "../constants/helpers";
import "./sidebar.css"

const BreadCrumbs = (props) => {
    const {
        location: { pathname },
    } = props;

    const pathnames = pathname.split("/").filter((x) => x);

    return (
        <Breadcrumbs>
            {pathnames.length > 0 ? (
                <MuiLink component={Link} color="inherit" to="/">
                    Home
                </MuiLink>
            ) : (
                    <Typography> Home </Typography>
                )}

            {pathnames.map((val, index) => {
                if (val.includes("&&")) {
                    val = val.split("&&")[0];
                }
                if (val.includes("-")) {
                    val = _.startCase(val);
                }

                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join("/")}`;

                return last ? (
                    <Typography color="textPrimary" key={val} className="pathNames">
                        {capitalize(val)}
                    </Typography>
                ) : (
                        <MuiLink component={Link} to={to} key={val} color="inherit">
                            {capitalize(val)}
                        </MuiLink>
                    );
            })}
        </Breadcrumbs>
    );
};

export default withRouter(BreadCrumbs);
