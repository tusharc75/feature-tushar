import { Box, Grid, Typography } from '@material-ui/core';
import React, { useEffect } from 'react';
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
import FullScreenChart from './FullScreenChart';
import { periodOption, frequencyData } from '../DashboardBuilder/builderHelpers';
import { camelCase, set } from 'lodash';

const DashbaordNew = () => {
  const {
    state: { user, userLoading, selectedEntity }
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
  const [globalFilters, setGlobalFilters] = React.useState(() => {
    const selectedDashboard = localStorage.getItem('selectedDashboard') ? localStorage.getItem('selectedDashboard') : '';
    return {
      dashboardType: selectedDashboard,
      currency: user?.user?.currency,
      between: {
        from: new Date(moment().startOf('year').calendar()),
        to: new Date(moment().endOf('year').calendar())
      }
    };
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
          frequency: frequencyData,

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
          if (!savedSelected) {
            setGlobalFilters((prevState) => ({ ...prevState, dashboardType: data[0].name }));
            setCharts(data[0]?.charts);
            setKpis(data[0]?.charts?.map((chart) => {
              if (chart?.hasFilters) {
                return camelCase(chart.kpi.name);
              }
            }));
            setSelectedDashboardId(data[0]?._id);
          } else {
            setGlobalFilters((prevState) => ({ ...prevState, dashboardType: savedSelected }));
            const selectedDashboard = data.find((d) => d.name === savedSelected);
            if (selectedDashboard) {
              setCharts(selectedDashboard?.charts || []);
              setKpis(selectedDashboard?.charts?.map((chart) => {
                if (chart?.hasFilters) {
                  return camelCase(chart.kpi.name);
                }
              }))
              setSelectedDashboardId(selectedDashboard?._id);
            }
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
    axiosInstance().get(`kpi/filters?kpi=${kpis.join(',')}`).then(({ data }) => {
      setKpiFilters(data?.data || []);
    }).catch((err) => {
      setToastConfig(err);
    });
  }

  useEffect(() => {
    if (kpis?.length) fetchKpiFilters();
  }, [kpis]);

  return (
    <div className="main-container-v1">
      <MuiPickersUtilsProvider utils={DateFnsUtils}>
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{ title: 'Dashboards' }]} />
        </div>
        <div className="detail-container-v1">
          {!userLoading ? (
            <React.Fragment>
              <GlobalFilter
                dashboardList={dashboardList.map((d) => ({ id: d._id, name: d.name }))}
                globalFilters={globalFilters}
                setGlobalFilters={setGlobalFilters}
                disabled={dashboardList.length === 0}
              />
              <Box pt={1}>
                {dashboardLoading ? (
                  <Loader minHeight={'100%'} height="calc(100vh - 200px)" noLoader={false} text="Loading Dashboards..." />
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
          />
        )}
      </MuiPickersUtilsProvider>
    </div>
  );
};

export default DashbaordNew;
