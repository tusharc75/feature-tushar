import { useState, useEffect, useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { isEmpty } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Box } from '@mui/material';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import FilterAlertModel from './FilterAlertModel';
import { useAppTheme } from 'src/constants/AppConfig';
import moment from 'moment';
import { dateTimeFormat24Hours } from 'src/constants/helpers';
import routes from 'src/components/Helpers/Routes';

const downloadIconHTML = `<div title="Download">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" strokeLinejoin="round" class="ico-download">
<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
<polyline points="7 10 12 15 17 10"></polyline>
<line x1="12" y1="15" x2="12" y2="3"></line>
</svg>
<div/>
`;

const toggleIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
<line x1="6" y1="14" x2="6" y2="10" stroke="currentColor" stroke-width="2"/>
<line x1="9" y1="14" x2="9" y2="6" stroke="currentColor" stroke-width="2"/>
<line x1="12" y1="14" x2="12" y2="8" stroke="currentColor" stroke-width="2"/>
<path d="M15 14L15 10" stroke="currentColor" stroke-width="2"/>
<path d="M18 14L18 12" stroke="currentColor" stroke-width="2"/>
<path d="M15 10L18 12" stroke="currentColor" stroke-width="2"/>
</svg>
`;
const Chart = ({ deviceTemplate = null, dateFilters, assetId, dataPoints }) => {
  const toastConfig = useContext(CustomToastContext);
  const [chartData, setChartData] = useState(null);
  const [alert, setAlert] = useState(null);
  const [alertOptions, setAlertOptions] = useState([]);
  const [alarm, setalarm] = useState(null);
  const [alarmOptions, setAlarmOptions] = useState([]);
  const [showHighLow, setShowHighLow] = useState(false);
  const [highLowData, setHighLowData] = useState([]);
  const [currentChartTheme, setCurrentChartTheme] = useState('light');
  const [themeColor] = useAppTheme();

  const [options, setOptions] = useState<ApexOptions>({
    theme: {
      mode: 'light',
      palette: 'palette2'
    },
    grid: {
      show: true,
      borderColor: 'var(--common-border-color)'
    },
    chart: {
      background: 'transparent',
      stacked: false,
      zoom: {
        type: 'x',
        enabled: true,
        autoScaleYaxis: true
      },
      toolbar: {
        autoSelected: 'zoom',
        tools: {
          download: downloadIconHTML,
          customIcons: [
            {
              icon: toggleIconSvg,
              title: 'Toggle Chart Type',
              class: 'custom-icon',
              click: function (chart, options, e) {
                const newType = chart.w.config.chart.type === 'line' ? 'bar' : 'line';
                const newSharedTooltip = newType !== 'bar';
                chart.updateOptions({
                  chart: {
                    type: newType
                  },
                  tooltip: {
                    shared: newSharedTooltip,
                    intersect: !newSharedTooltip
                  }
                });
              }
            }
          ]
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'straight',
      width: 1
    },
    fill: {
      type: 'solid'
    },
    markers: {
      size: 0
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false
      }
    },
    // yaxis: {
    //     min: 0
    // },
    tooltip: {
      shared: dataPoints[0]?.chartType === 'Bar' ? false : true,
      x: {
        formatter: function (value) {
          const formattedDateTime = moment(value).format(dateTimeFormat24Hours);
          return formattedDateTime;
        }
      },
      y: {
        formatter: function (val, { seriesIndex, w }) {
          const dataPoint = dataPoints?.find((d) => d?.fieldLabel === w?.globals?.seriesNames[seriesIndex]);
          const value =
            typeof val === 'number'
              ? `${val.toFixed(parseInt(dataPoint?.decimalPlaces))}`
              : parseFloat(val).toFixed(parseInt(dataPoint?.decimalPlaces));
          return dataPoint?.unit ? `${value} (${dataPoint?.unit})` : `${value}`;
        }
      }
    },
    annotations: {
      xaxis: [],
      points: []
    }
  });

  useEffect(() => {
    if (!isEmpty(dataPoints)) {
      fetchData();
    }
  }, [assetId, dataPoints, dateFilters]);

  useEffect(() => {
    let data = highLowData;
    if (!showHighLow) data = [];
    setOptions({
      ...options,
      annotations: {
        ...options?.annotations,
        yaxis: data
      }
    });
  }, [showHighLow]);

  useEffect(() => {
    setOptions((prevOptions) => {
      const newOptions = { ...prevOptions };
      if (themeColor === 'dark') {
        newOptions.theme.palette = 'palette2';
      } else {
        newOptions.theme.palette = 'palette1';
      }
      newOptions.theme.mode = themeColor;
      return newOptions;
    });
    setCurrentChartTheme(themeColor);
  }, [themeColor]);

  const fetchData = () => {
    let api = `/report/iot-data-points`;
    let filterById = [
      {
        field: 'dataPoints',
        term: { $in: dataPoints.map((d: any) => d._id) }
      },
      {
        field: 'asset',
        term: assetId
      }
    ];
    let deepFilter = [
      { field: 'from_date', term: new Date(dateFilters.from).toISOString() },
      { field: 'to_date', term: new Date(dateFilters.to).toISOString() },
      { field: 'interval', term: dateFilters.intervals }
    ];
    let param = {
      timezone: Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone,
      filterById: JSON.stringify(filterById),
      deepFilter: JSON.stringify(deepFilter)
    };
    axiosInstance()
      .get(api, { params: param })
      .then(({ data: { data } }) => {
        const newData: any = [];
        const yaxis: any = [];
        dataPoints?.forEach((dataPoint) => {
          newData.push({
            name: dataPoint?.fieldLabel,
            data: data?.map((e) => [new Date(e.time).getTime(), e[dataPoint?.fieldName]])
          });
          if (dataPoint?.highValue) {
            yaxis.push({
              y: dataPoint?.highValue,
              borderColor: '#ff0000',
              label: {
                borderColor: '#ff0000',
                style: {
                  color: '#fff',
                  background: '#ff0000'
                },
                text: `${dataPoint?.fieldLabel} High : ${dataPoint?.highValue}`
              }
            });
          }
          if (dataPoint?.lowValue) {
            yaxis.push({
              y: dataPoint?.lowValue,
              borderColor: '#ff0000',
              label: {
                borderColor: '#fff',
                style: {
                  color: '#fff',
                  background: '#ff0000'
                },
                text: `${dataPoint?.fieldLabel} Low : ${dataPoint?.lowValue}`
              }
            });
          }
        });
        setHighLowData(yaxis);
        setChartData(newData);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  useEffect(() => {
    if (deviceTemplate) {
      const query = [{ field: 'deviceTemplate', term: deviceTemplate }];
      const deepFilter = [
        { field: 'active', term: 'yes' },
        { field: 'alarm', term: 'yes' }
      ];
      axiosInstance()
        .get(`${routes.iotDataPoints.path}?filterById=${JSON.stringify(query)}&deepFilter=${JSON.stringify(deepFilter)}&filterType=and`)
        .then(({ data: { data } }) => {
          setAlarmOptions(
            data?.data?.map((d) => ({
              optionValue: d?._id,
              optionLabel: d?.fieldLabel
            })) || []
          );
        });

      axiosInstance()
        .get(`${routes?.deviceTemplateAlert?.path}?filterById=${JSON.stringify(query)}&filterType=and`)
        .then(({ data: { data } }) => {
          setAlertOptions(data?.map((d) => d?.alertNumber));
        });
    }
  }, [assetId, deviceTemplate]);

  const fetchAlert = () => {
    if (alarm) {
      let api = `/report/iot-alerts?asset=${assetId}&from_date=${new Date(dateFilters.from).toISOString()}&to_date=${new Date(
        dateFilters.to
      ).toISOString()}`;

      if (alarm) {
        let dataPoints = alarm?.optionValue;
        if (alarm?.optionValue === 'All') {
          dataPoints = alarmOptions?.map((alarm) => alarm?.optionValue)?.toString();
        }
        api = api + `&dataPoints=${dataPoints}`;
      }

      if (alert) {
        api = api + `&fieldValue=${alert}`;
      }

      axiosInstance()
        .get(api)
        .then(({ data: { data } }) => {
          const xaxis: any = [];
          const points: any = [];
          data?.forEach((d) => {
            if (d?.message) {
              const x = new Date(d.time).getTime();
              xaxis.push({
                x,
                strokeDashArray: 0,
                borderColor: '#775DD0',
                label: {
                  borderColor: '#775DD0',
                  style: {
                    color: '#fff',
                    background: '#775DD0'
                  },
                  text: d?.message
                }
              });
              points.push({
                x,
                y: 145,
                marker: {
                  size: 5,
                  fillColor: '#fff',
                  strokeColor: '#fff',
                  radius: 2
                },
                label: {
                  borderColor: '#FF4560',
                  offsetY: 0,
                  style: {
                    color: '#fff',
                    background: '#FF4560'
                  },
                  text: d?.message
                }
              });
            }
          });
          setOptions({
            ...options,
            annotations: {
              ...options?.annotations,
              xaxis: xaxis,
              points: points
            }
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      setOptions({
        ...options,
        annotations: {
          xaxis: [],
          points: []
        }
      });
    }
  };

  useEffect(() => {
    fetchAlert();
  }, [alert, alarm, assetId, dateFilters]);

  return (
    <>
      {' '}
      {chartData ? (
        <>
          <FilterAlertModel
            alertOptions={alertOptions}
            selectedAlert={alert}
            setSelectedAlert={setAlert}
            alarmOptions={alarmOptions}
            selectedAlarm={alarm}
            setSelectedAlarm={setalarm}
            showHighLow={showHighLow}
            setShowHighLow={setShowHighLow}
          />
          <ReactApexChart
            key={currentChartTheme}
            options={options}
            series={chartData}
            type={dataPoints?.length === 1 ? dataPoints[0]?.chartType?.toLowerCase() || 'line' : 'line'}
            height={500}
          />
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
};

export default Chart;
