import { Box, Grid } from '@material-ui/core';
import React from 'react';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import moment from 'moment';

import axiosInstance from 'src/axios/axiosInstance';
import ChartTypes from './ChartTypes';
import countriesData from 'src/constants/Country.json';
import GlobalFilter from './GlobalFilter';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import Loader from 'src/components/Loader';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import placeholder_img from 'src/assets/PerformanceTuning.png';
import { useData } from 'src/StateProvider/Provider';
import { ChartDataType } from './ChartTypes';
import AssetStats from '../KpiDashboard/AssetDashboard/AssetStats';

const DashbaordNew = () => {
  const {
    state: {
      user: { user },
      userLoading,
      selectedEntity
    }
  } = useData();
  const { setToastConfig } = React.useContext(CustomToastContext);
  const [commonSalesData, setCommonSalesData] = React.useState(null);
  const [filtersOptions, setFilterOptions] = React.useState(null);
  const [dashboardLoading, setDashboardLoading] = React.useState(false);
  const [dashboardList, setDashboardList] = React.useState([]);
  const [charts, setCharts] = React.useState([]);
  const [globalFilters, setGlobalFilters] = React.useState({
    dashboardType: '',
    currency: '',
    between: {
      from: new Date(moment().subtract(1, 'year').calendar()),
      to: new Date()
    }
  });

  React.useEffect(() => {
    const selectedDashboard = dashboardList.find((d) => d.name === globalFilters?.dashboardType);
    if (selectedDashboard) {
      setCharts(selectedDashboard?.charts || []);
    }
  }, [globalFilters?.dashboardType]);

  React.useEffect(() => {
    (async () => {
      try {
        const {
          data: { data }
        } = await axiosInstance().get(`sa-formbuilder/lookup?lookupResource=Product Category,Market Segment,Customer Account,Product,User`);
        if (!data) return;

        Object.keys(data).forEach((_d) => {
          setFilterOptions({
            productDescription: data['Product'],
            productCategory: data['Product Category'],
            customerAccount: data['Customer Account'].filter((c: any) =>
              Array.isArray(c?.entity) ? c?.entity?.findIndex((entity: any) => entity === selectedEntity) !== -1 : c?.entity === selectedEntity
            ),
            salesRep: data['User'].filter((u: any) => u?.entities?.findIndex((d: any) => d.entity === selectedEntity) !== -1),
            marketSegment: data['Market Segment'].filter((d) => !d.parentMarketSegment),
            subMarketSegment: data['Market Segment'].filter((d) => d.parentMarketSegment),
            countryBillTo: countriesData,
            countrySellTo: countriesData,
            country: countriesData
          });
        });
      } catch (error) {
        alert(JSON.stringify(error));
      }
    })();
    fetchDashboards();
  }, []);

  const fetchDashboards = () => {
    setDashboardLoading(true);
    axiosInstance()
      .get('/dashboard-master')
      .then(({ data: { data } }) => {
        if (data?.length) {
          setGlobalFilters((prevState) => ({ ...prevState, dashboardType: data[0].name }));
          setCharts([...data[0].charts]);
          setDashboardList(data);
          setDashboardLoading(false);
        }
      })
      .catch((err) => {
        setToastConfig(err);
        setDashboardLoading(false);
      });
  };

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <div className="headerbox">
        <CustomBreadCrumbs routes={[{ title: 'Dashboards' }]} />
      </div>
      <div className="detail-container">
        {!userLoading ? (
          <React.Fragment>
            <GlobalFilter
              dashboardList={dashboardList.map((d) => ({ id: d._id, name: d.name }))}
              globalFilters={globalFilters}
              setGlobalFilters={setGlobalFilters}
            />
            <Box bgcolor="#efefef" p={1} pt={1}>
              {dashboardLoading ? (
                <Loader minHeight={'100%'} height="calc(100vh - 200px)" noLoader={false} text="Loading Dashboards..." />
              ) : (
                <Grid container spacing={1} justifyContent="space-between" alignItems="stretch">
                  {charts.map((chart: ChartDataType, index: number) => (
                    <ChartTypes
                      globalFilters={globalFilters}
                      key={chart.chartType + ' ' + index + 1}
                      chart={chart}
                      filterData={{ ...filtersOptions }}
                      commonSalesData={commonSalesData}
                      setCommonSalesData={setCommonSalesData}
                    />
                  ))}
                  {globalFilters.dashboardType?.includes('Asset') && (
                    <Grid item xs={12}>
                      <AssetStats />
                    </Grid>
                  )}
                </Grid>
              )}
            </Box>
          </React.Fragment>
        ) : (
          <Loader minHeight="100%" noLoader={false} text="Loading Data..." />
        )}
      </div>
    </MuiPickersUtilsProvider>
  );
};

export default DashbaordNew;
