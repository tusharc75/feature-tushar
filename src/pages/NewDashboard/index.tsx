import { Box, Grid, Typography } from '@material-ui/core';
import { camelCase } from 'lodash';
import React from 'react';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import moment from 'moment';

import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ChartTypes from './ChartTypes';
import seed from './seed';
import countriesData from '../../constants/Country.json';
import GlobalFilter from './GlobalFilter';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import Loader from '../../components/Loader';
import placeholder_img from '../../assets/PerformanceTuning.png';
import { useData } from '../../StateProvider/Provider';

const DashbaordNew = () => {
  const {
    state: {
      user: { user }
    }
  } = useData();
  const [commonSalesData, setCommonSalesData] = React.useState(null);
  const [filtersOptions, setFilterOptions] = React.useState(null);
  const [globalFilters, setGlobalFilters] = React.useState({
    dashboardType: '',
    currency: '',
    between: {
      from: new Date(moment().subtract(1, 'year').calendar()),
      to: new Date()
    }
  });

  React.useEffect(() => {
    const dashboards = (user && user.dashboards) || null;
    if (!dashboards) return;
    setGlobalFilters((prevState) => ({ ...prevState, dashboardType: dashboards[0] }));
  }, [user]);

  React.useEffect(() => {
    (async () => {
      try {
        const {
          data: { data }
        } = await axiosInstance().get(
          `sa-formbuilder/lookup?lookupResource=Product Category,Market Segment,Sub Market Segment,Customer Account,Sub-Market Segment,User`
        );
        if (!data) return;

        Object.keys(data).forEach((_d) => {
          setFilterOptions((prevState: any): any => ({
            ...prevState,
            countryBillTo: countriesData,
            countrySellTo: countriesData,
            [camelCase(_d) === 'user' ? 'salesRep' : camelCase(_d)]: data[_d]
          }));
        });
      } catch (error) {
        alert(JSON.stringify(error));
      }
    })();
  }, []);

  const charts = globalFilters.dashboardType && seed.find((_d) => _d.name === globalFilters.dashboardType).charts;

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <div className="headerbox">
        <CustomBreadCrumbs routes={[{ title: 'Dashboard' }]} />
      </div>
      <div className="detail-container">
        {globalFilters.dashboardType ? (
          <React.Fragment>
            <GlobalFilter globalFilters={globalFilters} setGlobalFilters={setGlobalFilters} />
            <Box bgcolor="#efefef" p={1} pt={1}>
              {/* {seed.map((board) => ( */}
              <Grid
                // key={board.name}
                container
                spacing={1}
                justifyContent="space-between"
                alignItems="stretch"
              >
                {charts ? (
                  charts.map((chart, index) => (
                    <ChartTypes
                      globalFilters={globalFilters}
                      key={chart.type + ' ' + index + 1}
                      chart={chart}
                      filterData={{ ...filtersOptions }}
                      commonSalesData={commonSalesData}
                      setCommonSalesData={setCommonSalesData}
                    />
                  ))
                ) : (
                  <Loader minHeight="100%" noLoader={true} text="Loading Dasboard" />
                )}
              </Grid>
              {/* ))} */}
            </Box>
          </React.Fragment>
        ) : (
          <Box
            style={{ height: 'calc(100vh - 110px)', minHeight: '400px' }}
            width={'100%'}
            display={'flex'}
            flexDirection="column"
            justifyContent={'center'}
            alignItems={'center'}
            bgcolor={'rgba(255, 255, 255, 0.7)'}
          >
            <img width={400} height={340} src={placeholder_img} alt="dashboard" />
            <Typography color="textSecondary" variant="h5">
              You don't have access to any dashboard
            </Typography>
          </Box>
        )}
      </div>
    </MuiPickersUtilsProvider>
  );
};

export default DashbaordNew;
