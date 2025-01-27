import React from 'react';
import Chart from 'react-chartjs-2';
import { Paper, Box, useTheme, useMediaQuery, Typography, Badge, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ImportExport, TableChart, Timeline } from '@mui/icons-material';
import { BsFilter, BsFillPinFill } from 'react-icons/bs';
import { Skeleton } from '@mui/material';
import { TbPinnedOff } from 'react-icons/tb';
import FiltersDropdown from './FiltersDropdown';
import axiosInstance from 'src/axios/axiosInstance';
import ExportDropdown from './ExportDropdown';
import TableView from './TableView';
import { GlobalFiltersType } from './GlobalFilter';
import Loader from 'src/components/Loader';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { camelCase, isEmpty, isObject } from 'lodash';
import MapView from './MapView';
import { IFormDataType } from '../DashboardBuilder/builderHelpers';
import getStaticData from './getStaticData';
import StaticCards from './StaticCards';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useAppTheme } from 'src/constants/AppConfig';
import RefreshIcon from '@mui/icons-material/Refresh';
import { dateFormatToSend, formatAmountWithCurrency } from 'src/constants/helpers';
import { FunnelChart } from 'react-funnel-pipeline';
import 'react-funnel-pipeline/dist/index.css';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import axios, { CancelTokenSource } from 'axios';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import routes from 'src/components/Helpers/Routes';
import queryString from 'query-string';

export interface ChartDataType extends IFormDataType {
  _id: any;
  horizontalChart?: string;
  numberOfCards?: number;
  pin: boolean;
}
interface Props {
  chart: ChartDataType;
  fullScreen?: boolean;
  filterData: any;
  globalFilters: GlobalFiltersType;
  setSelectedChart?: (Chart: ChartDataType) => void;
  selectedDashboardId?: String;
  fetchDashboards: any;
  kpiFilters: any[];
  fetchKpiFilters: any;
}

const ChartTypes = ({
  chart,
  filterData,
  globalFilters,
  setSelectedChart,
  fullScreen,
  selectedDashboardId,
  fetchDashboards,
  kpiFilters,
  fetchKpiFilters
}: Props) => {
  const [themeColor] = useAppTheme();
  const theme = useTheme();
  const isScreenSmall = useMediaQuery(theme.breakpoints.down('xs'));
  const { setToastConfig } = React.useContext(CustomToastContext);
  const {
    state: { selectedEntity, user }
  } = useData();

  const getDefaultFilter = (filters) => {
    const defaultFilters = filters?.filter((f) => f.default);
    return defaultFilters?.length ? defaultFilters[0] : {};
  };

  const currency = user?.user?.currency || 'USD';
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
      const isEmpty = Array.isArray(filterValues[key]) ? Object.keys(filterValues[key]).length === 0 : filterValues[key] === 0;
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
        from: dateFormatToSend(globalFilters.between.from),
        to: dateFormatToSend(globalFilters.between.to)
      })
    };
    const keys = Object.keys(params);
    keys.forEach((key) => {
      if (Array.isArray(params[key]) && params[key].length > 0) {
        url = `${url}&${key}=${JSON.stringify(params[key].map((p: any) => p.optionValue))}`;
      }
      if (typeof params[key] === 'number' && params[key] > 0) {
        url = `${url}&${key}=${params[key]}`;
      }
      if (params[key]) {
        if (key === 'between') {
          url = `${url}&${key}=${params[key]}`;
        }
        if (key !== 'between' && params[key].optionValue) {
          url = `${url}&${key}=${params[key].optionValue}`;
        }
      }
    });

    if (chart.kpi?.currencyConverter) {
      url = `${url}&currency=${globalFilters?.currency || currency}`;
    }

    return url;
  };

  React.useEffect(() => {
    if (!filterValues) return;
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [filterValues, globalFilters, selectedEntity]);

  const swapChartColors = React.useCallback(
    (colorMap: { [index: string]: string[] }) => {
      if (!chartData?.datasets) return null;
      const obj = chartData;
      for (let i = 0; i < chartData?.datasets.length; i++) {
        const d = chartData?.datasets[i];
        const color: string = d.borderColor;

        for (let x in colorMap) {
          const cList: string[] = colorMap[x];
          if (cList.length !== 2 || !obj.datasets[i].fill) return null;
          if (cList.includes(color)) {
            if (themeColor === 'dark') {
              obj.datasets[i].borderColor = cList[1];
              obj.datasets[i].backgroundColor = cList[1];
            } else {
              obj.datasets[i].borderColor = cList[0];
              obj.datasets[i].backgroundColor = `${cList[0].replace(/[\d.]+\)$/g, '0.5)')}`;
            }
          }
        }
      }
      return obj;
    },
    [themeColor, chartData]
  );

  React.useEffect(() => {
    const colorMap = {
      color1: ['rgba(255, 99, 132, 1)', 'rgba(255, 99, 132, 0.5)'],
      color2: ['rgba(54, 162, 235, 1)', 'rgba(54, 162, 235, 0.5)'],
      color3: ['rgba(255, 99, 132, 0.6)', 'rgba(255, 150, 132, 0.5)']
    };
    const obj = swapChartColors(colorMap);
    if (!obj) return;
    setChartData(obj);
    return () => setChartData(null);
  }, [swapChartColors]);

  const fetchData = (cancelTokenSource?: CancelTokenSource) => {
    const urlParams = getParams();
    setLoading(true);
    let url = `kpi/${chart.kpi.kpi}?entity=${selectedEntity}${urlParams}`;
    axiosInstance()
      .get(url, { cancelToken: cancelTokenSource?.token })
      .then(async ({ data: { data } }) => {
        if (chart?.chartType === 'Funnel') {
          const funnelData = data?.map((d: any) => {
            return { name: `${d.name} - ${d.percentage}%`, value: d.percentage };
          });
          setChartData(funnelData);
        } else {
          if (chart.kpi?.custom) {
            const cardData = await getStaticData(chartData, data, globalFilters.currency, currency);
            setChartData(cardData);
          } else {
            setChartData(data);
          }
        }
        setLoading(false);
      })
      .catch((err: any) => {
        setToastConfig(err);
        setLoading(false);
      });
  };

  const handlePinUnpin = async (type) => {
    setLoading(true);
    axiosInstance()
      .put(`/dashboard-master/${selectedDashboardId}/${type}/${chart?._id}`)
      .then(async ({ data }) => {
        setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        fetchDashboards();
        setLoading(false);
      })
      .catch((err: any) => {
        setToastConfig(err);
        setLoading(false);
      });
  };

  return (
    <Grid size={{ xs: 12, md: chart?.column || 12 }}>
      {chart.graphType === 'Custom' ? (
        <Grid container spacing={1}>
          {loading ? (
            [...Array(4).keys()].map((_, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index + 1}>
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
        <Box height={'100%'} flexDirection="column" justifyContent="space-between" sx={{ border: '1px solid var(--common-border-color)' }}>
          <Box style={{ padding: '15px 10px' }}>
            <div className="flex items-center justify-between">
              <div>
                {chart.hasFilters && (
                  <Badge color="secondary" variant="dot" invisible={invisible}>
                    <ThemeButton disabled={loading} onClick={handleOpenFilter} startIcon={<BsFilter fontSize={14} />}>
                      Filters
                    </ThemeButton>
                  </Badge>
                )}
              </div>
              <div className="flex items-center">
                {chart.hasExport && (
                  <ThemeButton
                    disabled={loading}
                    style={{ marginRight: chart.hasTableView ? 10 : 0 }}
                    onClick={handleOpenExport}
                    buttonType="transparent"
                    startIcon={<ImportExport />}
                  >
                    Export to
                  </ThemeButton>
                )}
                {chart.hasTableView && chartData?.tableData && (
                  <ThemeButton
                    disabled={loading}
                    style={{ marginRight: 10 }}
                    onClick={() => {
                      setTableView(!tableView);
                    }}
                    buttonType="transparent"
                    startIcon={!tableView ? <TableChart /> : <Timeline />}
                  >
                    {!tableView ? 'Table' : 'Chart'} View
                  </ThemeButton>
                )}
                {selectedDashboardId ? (
                  !chart?.pin ? (
                    <HtmlTooltip title="Pin">
                      <IconButton
                        disabled={loading}
                        style={{ marginRight: 10 }}
                        onClick={() => {
                          handlePinUnpin('pin');
                        }}
                        color="primary"
                        size="small"
                      >
                        <BsFillPinFill fontSize="18px" />
                      </IconButton>
                    </HtmlTooltip>
                  ) : (
                    <HtmlTooltip title="Unpin">
                      <IconButton
                        disabled={loading}
                        style={{ marginRight: 10 }}
                        onClick={() => {
                          handlePinUnpin('un-pin');
                        }}
                        color="primary"
                        size="small"
                      >
                        <TbPinnedOff fontSize="18px" />
                      </IconButton>
                    </HtmlTooltip>
                  )
                ) : null}
                <HtmlTooltip title="Refresh">
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => {
                      fetchData();
                    }}
                    style={{ marginRight: 10 }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
                {setSelectedChart && (
                  <HtmlTooltip title="Full Screen">
                    <IconButton size="small" color="primary" onClick={() => setSelectedChart(chart)}>
                      <OpenInFullIcon fontSize="small" />
                    </IconButton>
                  </HtmlTooltip>
                )}
              </div>
            </div>

            {chart.chartTitle && (
              <Typography component="div" align="center" color="textPrimary">
                <h4>
                  {chart.chartTitle.includes('CUR')
                    ? chart.chartTitle.replace(/CUR/gi, globalFilters.currency || currency)
                    : chart.chartTitle.replace(/statusType/gi, filterValues?.status?.optionLabel || 'Open')}
                </h4>
              </Typography>
            )}
          </Box>
          <Box minHeight={fullScreen ? window.innerHeight - 200 : isScreenSmall ? 350 : chart.column <= 6 ? 400 : 500}>
            {loading ? (
              <Loader noLoader={false} text="" style={{ minHeight: '100%' }} />
            ) : !chartData || chartData.length === 0 ? (
              <Loader noLoader={true} text="No Data Avaiable" style={{ minHeight: '100%' }} />
            ) : chart.graphType !== 'Table' ? (
              chart.hasTableView && tableView ? (
                <TableView
                  id={chart.uniqueId}
                  type={chart.chartType?.toLowerCase()}
                  chart={chart}
                  chartData={chartData?.tableData}
                  currency={globalFilters.currency || currency}
                  filters={filterValues}
                />
              ) : chart.graphType === 'Map' ? (
                <MapView height={fullScreen ? window.innerHeight - 200 : isScreenSmall ? 350 : chart.column <= 6 ? 400 : 500} data={chartData} />
              ) : chart.chartType === 'Funnel' ? (
                <Box pr={2} pl={2} pb={2}>
                  <FunnelChart data={chartData} showValues={false} />
                </Box>
              ) : (
                <>
                  <Chart
                    key={themeColor}
                    id={chart.uniqueId}
                    type={chart.chartType?.toLowerCase()}
                    data={{
                      ...chartData,
                      datasets: chartData.datasets?.map((d: any) => {
                        if (!chart.stack) {
                          delete d.stack;
                        }
                        return d;
                      })
                    }}
                    options={{
                      plugins: {
                        ...((chart?.currency || chart?.percentage || chart?.chartType === 'Bar') && {
                          tooltip: {
                            mode: 'index',
                            callbacks: {
                              label: function (context) {
                                let label =
                                  chart?.chartType === 'Bar' && chart?.stack ? context.dataset.label : context.label || context.dataset.label || '';
                                if (label) {
                                  label += ': ';
                                }
                                if (chart?.percentage) {
                                  if (isObject(context?.parsed)) {
                                    label += `${context?.formattedValue}%`;
                                  } else {
                                    label += `${context.parsed}%`;
                                  }
                                } else {
                                  let parseValue = context?.parsed?.y;
                                  if (chart?.kpi?.horizontalBar) {
                                    parseValue = context?.parsed?.x;
                                  }
                                  if (parseValue !== null) {
                                    label += chart?.currency
                                      ? formatAmountWithCurrency(globalFilters.currency || currency, Number(parseValue) ? parseValue : '00')
                                          .fullFormatAmountWithoutSpace
                                      : parseValue;
                                  }
                                }
                                return label;
                              }
                            }
                          }
                        })
                      },
                      onClick: (event, elements) => {
                        if (elements.length > 0 && chart?.kpi?.redirectField && chart?.kpi?.resource) {
                          const dataIndex = elements[0].index;
                          const resourcePath = routes[camelCase(chart.kpi.resource)]?.path;
                          const queryObj = {};
                          queryObj[chart.kpi.redirectField] = chartData.labels[dataIndex];
                          Object.keys(filterValues).forEach((key) => {
                            const value = filterValues[key];
                            if (Array.isArray(value) && value?.length > 0) {
                              queryObj[key] = JSON.stringify(value);
                            } else if (!Array.isArray(value) && value) {
                              queryObj[key] = JSON.stringify(value);
                            }
                          });
                          window.open(`${resourcePath}?${queryString.stringify(queryObj)}`, '_blank');
                        }
                      },
                      maintainAspectRatio: false,
                      indexAxis: chart?.kpi?.horizontalBar ? 'y' : 'x',
                      scales: {
                        x: {
                          grid: {
                            color: themeColor === 'light' ? '#dee2e6' : '#3d3d5c'
                          }
                        },
                        y: {
                          grid: {
                            color: themeColor === 'light' ? '#dee2e6' : '#3d3d5c'
                          },
                          ticks: {
                            callback: function (value) {
                              return chart?.currency
                                ? formatAmountWithCurrency(globalFilters.currency || currency, Number(value) ? value : '00')
                                    .fullFormatAmountWithoutSpace
                                : value;
                            }
                          }
                        },
                        ...(chartData.datasets.some((d) => d?.yAxisID === 'y1') && {
                          y1: {
                            position: 'right',
                            grid: {
                              color: themeColor === 'light' ? '#dee2e6' : '#3d3d5c'
                            },
                            max: 100,
                            min: 0,
                            ticks: {
                              callback: function (value) {
                                return value + '%';
                              }
                            }
                          }
                        })
                      },
                      ...(chart.stack &&
                        !chartData.datasets.some((d) => d.stack === 'stacked') && {
                          scales: {
                            x: {
                              stacked: true,
                              grid: {
                                color: themeColor === 'light' ? '#dee2e6' : '#3d3d5c'
                              }
                            },
                            y: {
                              stacked: true,
                              grid: {
                                color: themeColor === 'light' ? '#dee2e6' : '#3d3d5c'
                              }
                            }
                          }
                        })
                    }}
                  />
                </>
              )
            ) : (
              <TableView
                id={chart.uniqueId}
                type={chart.chartType}
                chartData={chartData?.tableData}
                chart={chart}
                currency={globalFilters.currency || currency}
                filters={filterValues}
              />
            )}
          </Box>
        </Box>
      )}

      {chart.hasFilters && !isEmpty(filterData) && (
        <FiltersDropdown
          closeAnchor={() => setAnchorElFilter(null)}
          anchorEl={anchorElFilter}
          filters={chart.filters}
          values={filterValues}
          setValues={setFilterValues}
          isCRM={globalFilters.dashboardType?.includes('CRM')}
          filterOptions={filterData}
          kpi={camelCase(chart.kpi.name)}
          kpiFilters={kpiFilters}
          fetchKpiFilters={fetchKpiFilters}
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
