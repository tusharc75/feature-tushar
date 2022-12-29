import React from 'react';
import Chart from 'react-chartjs-2';
import { Paper, Box, Grid, useTheme, useMediaQuery, Typography, Button, Badge, IconButton } from '@material-ui/core';
import { ImportExport, TableChart, Timeline, Maximize } from '@material-ui/icons';
import { BsFilter, BsFillPinFill } from 'react-icons/bs';
import { FiMaximize2 } from 'react-icons/fi';
import { Skeleton } from '@material-ui/lab';
import {TbPinnedOff} from "react-icons/tb"

import styles from '../KpiDashboard/dashboard.module.scss';
import FiltersDropdown from './FiltersDropdown';
import axiosInstance from 'src/axios/axiosInstance';
import ExportDropdown from './ExportDropdown';
import TableView from './TableView';
import { GlobalFiltersType } from './GlobalFilter';

import Loader from 'src/components/Loader';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { startCase } from 'lodash';
import MapView from './MapView';
import { IFormDataType } from '../DashboardBuilder/builderHelpers';
import getStaticData from './getStaticData';
import StaticCards from './StaticCards';

export interface ChartDataType extends IFormDataType {
  _id: any;
  horizontalChart?: string;
  numberOfCards?: number;
  pin:boolean;
}
interface Props {
  chart: ChartDataType;
  fullScreen?: boolean;
  filterData: any;
  globalFilters: GlobalFiltersType;
  setSelectedChart?: (Chart: ChartDataType) => void;
  selectedDashboardId?: String;
  fetchDashboards:any
}

const ChartTypes = ({ chart, filterData, globalFilters, setSelectedChart, fullScreen, selectedDashboardId,fetchDashboards}: Props) => {
  const theme = useTheme();
  const isScreenSmall = useMediaQuery(theme.breakpoints.down('xs'));
  const { setToastConfig } = React.useContext(CustomToastContext);
  const {
    state: {
      selectedEntity,
      user: { user }
    }
  } = useData();
  const currency = (user && user.currency) || 'USD';
  const [chartData, setChartData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [tableView, setTableView] = React.useState(false);
  const [filterValues, setFilterValues] = React.useState(null);
  const [anchorElFilter, setAnchorElFilter] = React.useState(null);
  const [anchorElExport, setAnchorElExport] = React.useState(null);
  const [invisible, setInvisible] = React.useState(false);

  const handleOpenFilter = React.useCallback((e: React.MouseEvent) => {
    setAnchorElFilter(e.target);
  }, []);

  const handleOpenExport = React.useCallback((e: React.MouseEvent) => {
    setAnchorElExport(e.target);
  }, []);

  React.useEffect(() => {
    if (!filterValues) return;
    const keys = Object.keys(filterValues);
    let values = [];
    keys.forEach((key: string) => {
      if (!filterValues[key]) return;
      const isEmpty = Object.keys(filterValues[key]).length === 0;
      if (!isEmpty) {
        values.push(key);
      }
    });
    if (values.length > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [filterValues]);

  const getParams = () => {
    let url = '';
    let params = {
      ...filterValues,
      ...globalFilters,
      between: JSON.stringify({
        from: new Date(globalFilters.between.from).toISOString().split('T')[0],
        to: new Date(globalFilters.between.to).toISOString().split('T')[0]
      })
    };

    const keys = Object.keys(params);
    keys.forEach((key) => {
      if (Array.isArray(params[key]) && params[key].length > 0) {
        url = `${url}${key}=${JSON.stringify(params[key].map((p: any) => p.optionValue))}&`;
      }

      if (params[key]) {
        if (key === 'between') {
          url = `${url}${key}=${params[key]}&`;
        }
        if (key !== 'between' && params[key].optionValue) {
          url = `${url}${key}=${params[key].optionValue}&`;
        }
      }
    });

    if (chart.kpi?.currencyConverter) {
      url = `${url}currency=${globalFilters?.currency || currency}`;
    }
    return url;
  };

  React.useEffect(() => {
    const fetchTimeout = setTimeout(fetchData, 200);
    return () => clearTimeout(fetchTimeout);
  }, [filterValues, globalFilters, selectedEntity]);

  const fetchData = () => {
    const urlParams = getParams();
    setLoading(true);
    let url = `kpi/${chart.kpi.kpi}?&entity=${selectedEntity}&${urlParams}`;
    axiosInstance()
      .get(url)
      .then(async ({ data: { data } }) => {
        if (chart.kpi?.custom) {
          const cardData = await getStaticData(chartData, data, globalFilters.currency, currency);
          setChartData(cardData);
        } else {
          setChartData(data);
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setToastConfig(err);
        setLoading(false);
      });
  };

  const handlePin = async()=>{
    setLoading(true);
   try{
      let res = await axiosInstance().put(`/dashboard-master/${selectedDashboardId}/pin/${chart?._id}`)
      let data = res?.data
      setToastConfig({
      open:true,
      type:'success',
      message:data?.message
      })
      setLoading(false);
      fetchDashboards()
   }catch(error){
      setLoading(false)
      setToastConfig(error);

    }
  }


  const handleUnpin = async()=>{
    setLoading(true);
  try{
      let res = await axiosInstance().put(`/dashboard-master/${selectedDashboardId}/un-pin/${chart?._id}`)
      let data = res?.data
      setToastConfig({
      open:true,
      type:'success',
      message:data?.message
      })
      setLoading(false);
      fetchDashboards()
  }catch(error){
      setLoading(false)
      setToastConfig(error);
  }}



  const idsWithAdditionStatus = ['openQuotesByCustomer', 'openQuoteByRep'];

  return (
    <Grid item xs={12} md={fullScreen ? 12 : chart.column}>
      {chart.graphType === 'Custom' ? (
        <Grid container spacing={1}>
          {loading ? (
            [...Array(4).keys()].map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index + 1}>
                <Box p={2} component={Paper} height={'100%'} display="flex" flexDirection="column" justifyContent="space-between">
                  <Skeleton variant="text" width={150} height={30} />
                  <Skeleton variant="text" width={100} height={20} />
                </Box>
              </Grid>
            ))
          ) : !chartData ? null : (
            <StaticCards chartData={chartData} />
          )}
        </Grid>
      ) : (
        <Box component={Paper} p={'8px'} height={'100%'} display="flex" flexDirection="column" justifyContent="space-between">
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex">
                {chart.hasFilters && (
                  <Badge color="secondary" variant="dot" invisible={invisible}>
                    <Button
                      disabled={loading}
                      onClick={handleOpenFilter}
                      size="small"
                      disableElevation
                      color="primary"
                      startIcon={<BsFilter fontSize={14} />}
                    >
                      Filters
                    </Button>
                  </Badge>
                )}
              </Box>
              <Box display="flex">
                {chart.hasExport && (
                  <Button
                    disabled={loading}
                    style={{ marginRight: chart.hasTableView ? 16 : 0 }}
                    onClick={handleOpenExport}
                    color="primary"
                    size="small"
                    startIcon={<ImportExport />}
                  >
                    Export to
                  </Button>
                )}
                {chart.hasTableView && chartData?.tableData && (
                  <Button
                    disabled={loading}
                    color="primary"
                    style={{ marginRight: chart.pin ? 16 : 0 }}
                    onClick={() => {
                      setTableView(!tableView);
                    }}
                    size="small"
                    startIcon={!tableView ? <TableChart /> : <Timeline />}
                  >
                    {!tableView ? 'Table' : 'Chart'} View
                  </Button>
                )}

                {selectedDashboardId ? !chart?.pin ? (
                  <IconButton
                    disabled={loading}
                    style={{ marginRight: setSelectedChart ? 16 : 0 }}
                    onClick={handlePin}
                    color="primary"
                    size="small"
                  >

                    <BsFillPinFill fontSize="16px" />
                  </IconButton>
                ) : (
                  <IconButton
                    disabled={loading}
                    style={{ marginRight: setSelectedChart ? 16 : 0 }}
                    onClick={handleUnpin}
                    color="primary"
                    size="small"
                  >
                    <TbPinnedOff fontSize="16px" />
                  </IconButton>
                ) : null}
                {setSelectedChart && (
                  <IconButton size="small" color="primary" onClick={() => setSelectedChart(chart)}>
                    <FiMaximize2 fontSize="16px" />
                  </IconButton>
                )}
              </Box>
            </Box>

            {chart.chartTitle && (
              <Typography component="div" align="center" color="textPrimary">
                <h4>
                  {chart.chartTitle.includes('CUR')
                    ? startCase(chart.chartTitle.replace(/CUR/gi, globalFilters.currency || currency))
                    : startCase(chart.chartTitle.replace(/statusType/gi, filterValues?.status?.optionLabel || 'Open'))}
                </h4>
              </Typography>
            )}
          </Box>

          <Box minHeight={fullScreen ? window.innerHeight - 150 : isScreenSmall ? 350 : chart.column <= 6 ? 400 : 500}>
            {loading ? (
              <Loader noLoader={false} text="" style={{ minHeight: '100%' }} />
            ) : !chartData || chartData.length === 0 ? (
              <Loader noLoader={true} text="No Data Avaiable" style={{ minHeight: '100%' }} />
            ) : chart.graphType !== 'Table' ? (
              chart.hasTableView && tableView ? (
                <TableView
                  id={chart.uniqueId}
                  type={chart.chartType?.toLowerCase()}
                  chartData={chartData?.tableData}
                  isScreenSmall={isScreenSmall}
                  currency={globalFilters.currency || currency}
                  selectedDashboard={globalFilters?.dashboardType}
                />
              ) : chart.graphType === 'Map' ? (
                <MapView height={isScreenSmall ? 350 : chart.column <= 6 ? 400 : 500} data={chartData} />
              ) : (
                <Chart
                  id={chart.uniqueId}
                  type={chart.chartType?.toLowerCase()}
                  data={chartData}
                  options={{
                    maintainAspectRatio: false,
                    indexAxis: chart?.kpi?.horizontalBar ? 'y' : 'x'
                  }}
                />
              )
            ) : (
              <TableView
                id={chart.uniqueId}
                type={chart.chartType}
                chartData={chartData?.tableData}
                isScreenSmall={isScreenSmall}
                currency={globalFilters.currency || currency}
                selectedDashboard={globalFilters?.dashboardType}
              />
            )}
          </Box>
        </Box>
      )}

      {chart.hasFilters && filterData && (
        <FiltersDropdown
          closeAnchor={() => setAnchorElFilter(null)}
          anchorEl={anchorElFilter}
          filters={chart.filters}
          values={filterValues}
          setValues={setFilterValues}
          isCRM={globalFilters.dashboardType?.includes('CRM')}
          filterOptions={{
            ...filterData,
            status: chart.statusOptions
          }}
        />
      )}
      {chart.hasExport && (
        <ExportDropdown
          anchorEl={anchorElExport}
          setAnchorClose={setAnchorElExport}
          currency={globalFilters.currency || currency}
          tableData={chartData ? chartData?.tableData : []}
          chart={chart}
          isTableView={chartData?.graphType !== 'Table' && tableView}
          chartData={chartData?.tableData}
        />
      )}
    </Grid>
  );
};

export default ChartTypes;
