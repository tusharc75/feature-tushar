import { Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, { useEffect } from 'react';
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
import AssetStats from './AssetStats';
import FullScreenChart from './FullScreenChart';
import { periodOption, frequencyData } from '../DashboardBuilder/builderHelpers';
import { camelCase, set } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const Dashboard = () => {
  const {
    state: { user, userLoading }
  } = useData();

  const { setToastConfig } = React.useContext(CustomToastContext);
  const [filtersOptions, setFilterOptions] = React.useState(null);
  const [dashboardLoading, setDashboardLoading] = React.useState(false);
  const [dashboardList, setDashboardList] = React.useState([]);
  const [charts, setCharts] = React.useState([]);
  const [kpis, setKpis] = React.useState([]);
  const [kpiFilters, setKpiFilters] = React.useState([]);
  const [openFullScreenChart, setOpenFullScreenChart] = React.useState(false);
  const [selectedChart, setSelectedChart] = React.useState(null);

  const [globalFilters, setGlobalFilters] = React.useState<any>(() => {
    return { currency: user?.user?.currency };
  });

  const [selectedDashboardId, setSelectedDashboardId] = React.useState(null);

  React.useEffect(() => {
    const selectedDashboard = dashboardList.find((d) => d.name === globalFilters?.dashboardType);
    setSelectedDashboardId(selectedDashboard?._id);
    if (selectedDashboard) {
      setCharts(selectedDashboard?.charts || []);
    }
  }, [globalFilters?.dashboardType]);

  React.useEffect(() => {
    (async () => {
      try {
        let businessUnitOptions = [];
        const res = await axiosInstance().get('/field?resource=Project Sales');
        res?.data?.data.forEach((e: any) => {
          if (e?.fieldData?.fieldName === 'businessUnit') {
            businessUnitOptions = e.fieldData.option;
          }
        });
        setFilterOptions({
          countryBillTo: countriesData,
          countrySellTo: countriesData,
          country: countriesData,
          period: periodOption,
          businessUnit: businessUnitOptions,
          frequency: frequencyData
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
          const savedSelected = localStorage.getItem('selectedDashboard');
          if (savedSelected && data.find((d) => d.name === savedSelected)) {
            const selectedDashboard = data.find((d) => d.name === savedSelected);
            setGlobalFilters((prevState) => ({
              ...prevState,
              dashboardType: savedSelected,
              timeFrame: selectedDashboard?.defaultDuration || 'current-year'
            }));
            setCharts(selectedDashboard?.charts || []);
            setKpis(selectedDashboard?.charts?.filter((chart) => chart?.hasFilters)?.map((chart) => camelCase(chart?.kpi?.name)));
            setSelectedDashboardId(selectedDashboard?._id);
          } else {
            setGlobalFilters((prevState) => ({ ...prevState, dashboardType: data[0].name, timeFrame: data[0]?.defaultDuration || 'current-year' }));
            setCharts(data[0]?.charts);
            setKpis(data[0]?.charts?.filter((chart) => chart?.hasFilters)?.map((chart) => camelCase(chart?.kpi?.name)));
            setSelectedDashboardId(data[0]?._id);
          }
          setDashboardList(data);
        }
        setDashboardLoading(false);
      })
      .catch((err) => {
        setToastConfig(err);
        setDashboardLoading(false);
      });
  };

  const fetchKpiFilters = () => {
    axiosInstance()
      .get(`kpi/filters?kpi=${kpis.join(',')}`)
      .then(({ data }) => {
        setKpiFilters(data?.data || []);
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  useEffect(() => {
    if (kpis?.length) fetchKpiFilters();
  }, [kpis]);

  return (
    <div className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: 'Dashboard' }]} />
      </div>
      <div className="detail-container-v1">
        {!userLoading ? (
          <React.Fragment>
            <GlobalFilter
              dashboardList={dashboardList.map((d) => ({ id: d._id, name: d.name, defaultDuration: d?.defaultDuration }))}
              globalFilters={globalFilters}
              setGlobalFilters={setGlobalFilters}
              disabled={dashboardList.length === 0}
            />
            <Box pt={1}>
              {dashboardLoading ? (
                <CommonSkeleton />
              ) : dashboardList.length === 0 ? (
                <Box
                  style={{ height: 'calc(100vh - 256px)', minHeight: '400px' }}
                  width={'100%'}
                  display={'flex'}
                  flexDirection="column"
                  justifyContent={'center'}
                  alignItems={'center'}
                  className="asdfkasjhdfkjsdh"
                >
                  <img width={400} height={340} src={placeholder_img} alt="dashboard" />
                  <Typography color="textSecondary" variant="h5">
                    You don't have access to any dashboard
                  </Typography>
                </Box>
              ) : (
                <Grid
                  container
                  spacing={1}
                  justifyContent="space-between"
                  alignItems="stretch"
                  style={{ height: 'calc(100vh - 256px)', minHeight: '600px', overflow: 'auto' }}
                >
                  {charts.map((chart: ChartDataType, index: number) => (
                    <ChartTypes
                      globalFilters={globalFilters}
                      key={chart.chartType + ' ' + index + 1}
                      chart={chart}
                      filterData={{ ...filtersOptions }}
                      setSelectedChart={(currentChart: ChartDataType) => {
                        setSelectedChart(currentChart);
                        setOpenFullScreenChart(true);
                      }}
                      selectedDashboardId={selectedDashboardId}
                      fetchDashboards={fetchDashboards}
                      kpiFilters={kpiFilters?.filter((k: any) => k.kpi === camelCase(chart.kpi.name))}
                      fetchKpiFilters={fetchKpiFilters}
                    />
                  ))}
                  {globalFilters.dashboardType?.includes('Asset') && (
                    <Grid size={{ xs: 12 }}>
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
      {openFullScreenChart && (
        <FullScreenChart
          chart={selectedChart}
          globalFilters={globalFilters}
          filterData={{ ...filtersOptions }}
          close={() => {
            setOpenFullScreenChart(false);
            setSelectedChart(null);
          }}
          selectedDashboardId={selectedDashboardId}
          fetchDashboards={fetchDashboards}
          kpiFilters={kpiFilters?.filter((k: any) => k.kpi === camelCase(selectedChart.kpi.name))}
          fetchKpiFilters={fetchKpiFilters}
        />
      )}
    </div>
  );
};

export default Dashboard;
