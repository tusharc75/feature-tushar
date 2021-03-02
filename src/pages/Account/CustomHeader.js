import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Typography, Box } from "@material-ui/core";
import Container from "../../components/Container"

const useStyles = makeStyles((theme) => ({
    root: {
        minHeight: "100%!important",
        marginTop: 0
    },
    box: {
        backgroundColor: "#E6F4FF",
        borderRadius: 6,
        padding: theme.spacing(0.5, 1.5),
    },
}));

const CustomHeader = (props) => {
    const { mainPoints, heading, children, showHeading, subHeading } = props;
    const classes = useStyles();
    // let mainPoints = {
    //     "Primary Owner": "Joe Smith",
    //     "Phone": "+13612463463",
    //     "Master Account": "Myntra Corp",
    //     "Annual Revenue $m": "$50m"

    // }
    console.log("***", mainPoints)
    return (
        <React.Fragment>
            <Container className={classes.root} style={{ minHeight: "100%", marginTop: 0 }}>
                <Grid container justify="space-between" style={{ marginBottom: '10px' }}>
                    <Grid item>
                        {
                            showHeading ?
                                <>
                                    <Typography variant="h6" component="h2" color="primary">
                                        {heading}
                                    </Typography>
                                    <Typography variant="h6" component="h2" color="primary">
                                        {subHeading}
                                    </Typography>
                                </>
                                : null
                        }
                    </Grid>
                    <Grid item>{children}</Grid>
                </Grid>
                <Box display="flex" id="tapleen2">
                    {
                        mainPoints && Object.keys(mainPoints).length ?
                            Object.keys(mainPoints).map(key => {
                                return <>
                                    {
                                        mainPoints[key] ? (
                                            <>
                                                <Box className={classes.box}>
                                                    <Typography align="center" color="primary">
                                                        <strong>{mainPoints[key] || ''}</strong>
                                                    </Typography>
                                                    <Typography align="center" color="primary">
                                                        <strong>{key}</strong></Typography>
                                                </Box>
                                                <Box component="span" marginX={1} /></>
                                        ) : null
                                    }
                                </>
                            }) : null
                    }
                </Box>
            </Container>
        </React.Fragment>
    );
};

CustomHeader.propTypes = {
    total: PropTypes.any,
    active: PropTypes.any,
    inactive: PropTypes.any,
    heading: PropTypes.string.isRequired,
    children: PropTypes.node,
};

export default CustomHeader;
