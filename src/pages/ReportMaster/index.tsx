import React from 'react';
import { Grid, Typography, Box, CircularProgress, useTheme, useMediaQuery } from '@material-ui/core';
import styles from '../Leads/Header.module.scss';
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { REPORT_LIST } from './../../constants/helpers';
import { MdOutlineReceiptLong } from "react-icons/md";
import { Link, withRouter, useHistory } from "react-router-dom";
import { camelCase, startCase } from 'lodash';

const ReportMaster = () => {


    return (<div>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[{ title: 'Reports', path: '' }]} />
            </Grid>
        </Grid>
        <div className="main-container">
            <div className="header-panel">
                <Grid container className={styles.filter_side_container}>
                    <Grid item xs={12} className="d-flex align-items-center gap-1 layout-for-tablet">
                        <Grid style={{ display: "flex", justifyContent: "center" }}>
                            <MdOutlineReceiptLong size={22} className="headerLogo" />
                            <span className="listingHeader">Reports</span>
                        </Grid>
                    </Grid>
                </Grid>
            </div>
            <hr />
            <Box p={3}>
                <Grid container spacing={2}>
                    {REPORT_LIST.map((report) =>
                        <Grid item xs={3}>
                            <Link to={`/reports${routes[`${camelCase(report)}`]?.path}`}>
                                <Box border={1} borderColor='grey.300' bgcolor='grey.100' borderRadius={1} p={2} >
                                    <Typography variant="h6">{routes[camelCase(report)]?.title}</Typography>
                                </Box>
                            </Link>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </div>
    </div>
    );
};

export default ReportMaster;
