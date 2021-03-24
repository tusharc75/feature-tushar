import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, Typography, Box, Avatar, Paper } from "@material-ui/core";
import { Skeleton } from '@material-ui/lab';
import { capitalize } from "../services/util";

const useStyles = makeStyles((theme) => ({
    root: {
        minHeight: "100%!important",
        marginTop: 0
    },
    box: {
        backgroundColor: "#E6F4FF",
        borderRadius: 6,
        padding: theme.spacing(0.6, 1.8),
    },
    customHeaderPaper: {
        marginBottom: '16px',
        padding: '10px'
    }
}));

const CustomHeader = (props) => {
    const { mainPoints, heading, children, showHeading, logo, loading } = props;
    const classes = useStyles();
    return (
        <React.Fragment>
            <Paper className={classes.customHeaderPaper} elevation={0}>
                <Grid container justify="space-between" style={{ marginBottom: '10px' }}>
                    <Grid item key="custom-header-heading">
                        {
                            loading ?
                                <Skeleton width={100} /> :
                                showHeading ? <>
                                    <Typography style={{ display: 'inline-block' }} variant="h6" component="h2" color="primary">
                                        {
                                            logo ? <Avatar
                                                src={logo}
                                                style={{ width: 20, height: 20, display: 'inline-block', marginRight: '10px' }}
                                                alt="acc_logo" /> : null
                                        }
                                        <span>{capitalize(heading)}</span>
                                    </Typography>
                                </>
                                    : null
                        }
                    </Grid>
                    <Grid item key="custom-header-children">{children}</Grid>
                </Grid>
                <Box display="flex" id="tapleen2">
                    {
                        loading ?
                            <Grid container wrap="nowrap">
                                {
                                    [...Array(4).keys()].map(i => (
                                        <>
                                            <Skeleton variant="rect" style={{ marginRight: '10px' }} width={80} height={50} />
                                            <Box marginY={1} /></>
                                    ))
                                }
                            </Grid> : mainPoints && Object.keys(mainPoints).length ?
                                Object.keys(mainPoints).map((key, i) => {
                                    return <>
                                        {
                                            mainPoints[key] ? (
                                                <React.Fragment>
                                                    <Box className={classes.box} key={key + i} >
                                                        <Typography align="center" variant="subtitle1" style={{ color: '#1a91b5' }}
                                                            className="text-capitalize">{key}</Typography>
                                                        <Typography align="center" color="primary" style={{ fontWeight: 500 }}>
                                                            {mainPoints[key] || ''}
                                                        </Typography>
                                                    </Box>
                                                    <Box component="span" marginX={1} /></React.Fragment>
                                            ) : null
                                        }
                                    </>
                                }) : null
                    }
                </Box>
            </Paper>
        </React.Fragment >
    );
};

CustomHeader.propTypes = {
    total: PropTypes.any,
    active: PropTypes.any,
    inactive: PropTypes.any,
    heading: PropTypes.string.isRequired,
    children: PropTypes.node,
    loading: PropTypes.any,
    logo: PropTypes.any,
    mainPoints: PropTypes.any,
    showHeading: PropTypes.any
};

export default CustomHeader;
