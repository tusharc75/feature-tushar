import React from 'react';
import Chart from 'react-chartjs-2';
import { Paper, Box, Grid, useTheme, useMediaQuery, Typography, Button, Badge } from '@material-ui/core';
import { ImportExport, TableChart, Timeline } from '@material-ui/icons';
import { BsFilter } from 'react-icons/bs';
import { Skeleton } from '@material-ui/lab';

import styles from '../KpiDashboard/dashboard.module.scss';
import FiltersDropdown from './FiltersDropdown';
import axiosInstance from 'src/axios/axiosInstance';
import ExportDropdown from './ExportDropdown';
import getMappedData from './getMappedData';
import TableView from './TableView';
import { GlobalFiltersType } from './GlobalFilter';

import Loader from 'src/components/Loader';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import EyeTooltip from './EyeTooltip';
import { startCase } from 'lodash';

export type ChartDataType = {
  col: any;
  type: string;
  filters: { key: string; title: string; multiple: boolean }[];
  title: string;
  kpi: string;
  hasFilter: boolean;
  hasTableView: boolean;
  hasExport: boolean;
  uniqueId: string;
  axis?: string;
  numberOfCards?: number;
};
interface Props {
  commonSalesData?: any;
  setCommonSalesData?: any;
  chart: ChartDataType;
  filterData: any;
  globalFilters: GlobalFiltersType;
}

const StatusOptions1 = [
  { optionLabel: 'Open', optionValue: 'open' },
  { optionLabel: 'Won', optionValue: 'won' }
];

const StatusOptions2 = [
  { optionLabel: 'Open', optionValue: 'open' },
  { optionLabel: 'Won', optionValue: 'won' },
  { optionLabel: 'Lost', optionValue: 'lost' }
];

const ChartTypes = ({ chart, filterData, globalFilters }: Props) => {
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
      if (params[key]) {
        if (key === 'between') {
          url = `${url}${key}=${params[key]}&`;
        }
        if (key !== 'between' && params[key].optionValue) {
          url = `${url}${key}=${params[key].optionValue}&`;
        }
        if (key === 'status' && !params[key].optionValue) {
          url = `${url}${key}=open&`;
        }
      }
    });

    if (chart.uniqueId === 'offeredVsEntities') {
      url = `${url}allEntity=1`;
    }
    if (chart.uniqueId === 'volume2VsBudget') {
      url = `${url}volumeUnit=GM`;
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
    axiosInstance()
      .get(`dashboard/${chart.kpi}?entity=${selectedEntity}&${urlParams}`)
      .then(async ({ data: { data } }) => {
        const statusForQuoteChart = chart.uniqueId === 'openQuote' && filterValues ? filterValues?.status?.optionLabel : null;
        const chartData = await getMappedData(chart, data, globalFilters.currency, currency, statusForQuoteChart);
        setChartData(chartData);
        setLoading(false);
      })
      .catch((err) => {
        setToastConfig(err);
        setLoading(false);
      });
  };

  const idsWithAdditionStatus = ['openQuotesByCustomer', 'openQuoteByRep'];

  return (
    <Grid item xs={12} md={chart.col}>
      {chart.type === 'cards' ? (
        <Grid container spacing={1}>
          {loading
            ? [...Array(chart.numberOfCards).keys()].map((_, index) => (
                <Grid item xs={12} sm={6} md={3} key={index + 1}>
                  <Box p={2} component={Paper} height={'100%'} display="flex" flexDirection="column" justifyContent="space-between">
                    <Skeleton variant="text" width={150} height={30} />
                    <Skeleton variant="text" width={100} height={20} />
                  </Box>
                </Grid>
              ))
            : !chartData || chartData.length === 0
            ? null
            : Object.keys(chartData?.cardData).map((key, index) => (
                <Grid item xs={12} sm={6} md={3} key={index + 1}>
                  <Box p={2} component={Paper} height={'100%'} display="flex" flexDirection="column" justifyContent="space-between">
                    <Box>
                      <Typography className={styles.price}>{chartData?.cardData[key] ? chartData?.cardData[key] : 0}</Typography>
                      <Typography variant="h6" className={styles.title}>
                        {key}
                      </Typography>
                      {chartData?.additionalData && (
                        <p className={styles.hit_ratio}>
                          Hit Ratio: {chartData?.additionalData[key] ? (chartData?.additionalData[key]).toFixed(2) : 0} %
                        </p>
                      )}
                    </Box>
                  </Box>
                </Grid>
              ))}
        </Grid>
      ) : (
        <Box component={Paper} p={'8px'} height={'100%'} display="flex" flexDirection="column" justifyContent="space-between">
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex">
                {chart.hasFilter && (
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
                {chart.hasTableView && (
                  <Button
                    disabled={loading}
                    color="primary"
                    onClick={() => {
                      setTableView(!tableView);
                    }}
                    size="small"
                    startIcon={!tableView ? <TableChart /> : <Timeline />}
                  >
                    {!tableView ? 'Table' : 'Chart'} View
                  </Button>
                )}
              </Box>
            </Box>

            {chart.title && (
              <Typography component="div" align="center" color="textPrimary">
                <h4>
                  {chart.title.includes('currency')
                    ? startCase(chart.title.replace(/currency/gi, globalFilters.currency || currency))
                    : startCase(chart.title.replace(/Type/gi, filterValues?.status?.optionLabel || 'Open'))}
                </h4>
              </Typography>
            )}
          </Box>

          <Box minHeight={isScreenSmall ? 350 : chart.col <= 6 ? 400 : 500}>
            {loading ? (
              <Loader noLoader={false} text="" style={{ minHeight: '100%' }} />
            ) : !chartData || chartData.length === 0 ? (
              <Loader noLoader={true} text="No Data Avaiable" style={{ minHeight: '100%' }} />
            ) : chart.type !== 'list' ? (
              chart.hasTableView && tableView ? (
                <TableView
                  id={chart.uniqueId}
                  type={chart.type}
                  chartData={chartData.tableData}
                  isScreenSmall={isScreenSmall}
                  currency={globalFilters.currency || currency}
                />
              ) : (
                <Chart
                  id={chart.uniqueId}
                  type={chart.type}
                  data={chartData}
                  options={{
                    maintainAspectRatio: false,
                    indexAxis: chart.axis
                  }}
                />
              )
            ) : (
              <TableView
                id={chart.uniqueId}
                type={chart.type}
                chartData={chartData}
                isScreenSmall={isScreenSmall}
                currency={globalFilters.currency || currency}
              />
            )}
          </Box>
        </Box>
      )}

      {chart.hasFilter && filterData && (
        <FiltersDropdown
          closeAnchor={() => setAnchorElFilter(null)}
          anchorEl={anchorElFilter}
          filters={chart.filters}
          values={filterValues}
          setValues={setFilterValues}
          filterOptions={{
            ...filterData,
            [idsWithAdditionStatus.includes(chart.uniqueId) && 'status']: chart.uniqueId === 'openQuote' ? StatusOptions1 : StatusOptions2
          }}
        />
      )}
      {chart.hasExport && (
        <ExportDropdown
          anchorEl={anchorElExport}
          setAnchorClose={setAnchorElExport}
          currency={globalFilters.currency || currency}
          tableData={chartData ? (chart.type === 'list' ? chartData : chartData.tableData) : []}
          chart={chart}
          chartData={chartData}
        />
      )}
    </Grid>
  );
};

export default ChartTypes;
