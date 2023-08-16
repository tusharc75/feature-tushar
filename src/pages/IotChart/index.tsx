import { Grid } from '@material-ui/core';
import React, { Fragment } from 'react'
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import Chart from './Chart'

function IotChart() {
    return (
        <div className="main-container-v1">
            <Grid container className="headerbox-v1">
                <Grid item md={4} sm={11} xs={10}>
                    <CustomBreadCrumbs routes={[routes.iotChart]} />
                </Grid>
            </Grid>
            <CustomContainer>
                <Chart />
            </CustomContainer>
        </div>
    )
}

export default IotChart;