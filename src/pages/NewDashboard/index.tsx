import { Box, Grid, Typography } from '@material-ui/core';
import { camelCase } from 'lodash';
import React from 'react';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import moment from 'moment';

import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import ChartTypes from './ChartTypes';
import seed from './seed';
import countriesData from 'src/constants/Country.json';
import GlobalFilter from './GlobalFilter';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import Loader from 'src/components/Loader';
import placeholder_img from 'src/assets/PerformanceTuning.png';
import { useData } from 'src/StateProvider/Provider';
import { ChartDataType } from './ChartTypes';
import AssetDashboard from '../KpiDashboard/AssetDashboard';

const DashbaordNew = () => {
  const {
    state: {
      user: { user },
      userLoading,
      selectedEntity
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
            customerAccount: data['Customer Account'].filter((c: any) =>
              Array.isArray(c?.entity) ? c?.entity?.findIndex((entity: any) => entity === selectedEntity) !== -1 : c?.entity === selectedEntity
            ),
            salesRep: data['User'].filter((u: any) => u?.entities?.findIndex((d: any) => d.entity === selectedEntity) !== -1),
            marketSegment: data['Market Segment'].filter((d) => !d.parentMarketSegment),
            subMarketSegment: data['Market Segment'].filter((d) => d.parentMarketSegment),
            countryBillTo: countriesData,
            countrySellTo: countriesData,
          }));
        });
      } catch (error) {
        alert(JSON.stringify(error));
      }
    })();
  }, []);

  const typeOfDashboard = globalFilters.dashboardType ?? '';
  const chartData = typeOfDashboard && seed.find((_d) => _d.name === typeOfDashboard);

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <div className="headerbox">
        <CustomBreadCrumbs routes={[{ title: 'Dashboards' }]} />
      </div>
      <div className="detail-container">
        {!userLoading ? (
          typeOfDashboard ? (
            <React.Fragment>
              <GlobalFilter globalFilters={globalFilters} setGlobalFilters={setGlobalFilters} />
              <Box bgcolor="#efefef" p={1} pt={1}>
                {typeOfDashboard.includes('Asset') ? (
                  <AssetDashboard salesFilter={globalFilters} />
                ) : (
                  <Grid container spacing={1} justifyContent="space-between" alignItems="stretch">
                    {chartData?.charts ? (
                      chartData?.charts.map((chart: ChartDataType, index: number) => (
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
                      <Loader minHeight="100%" noLoader={true} text="Something went wrong" />
                    )}
                  </Grid>
                )}
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
          )
        ) : (
          <Loader minHeight="100%" noLoader={false} text="Loading..." />
        )}
      </div>
    </MuiPickersUtilsProvider>
  );
};

export default DashbaordNew;
