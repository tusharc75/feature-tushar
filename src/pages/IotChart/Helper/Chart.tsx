import { useState, useEffect, useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { isEmpty } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Box } from '@material-ui/core';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import FilterAlertModel from './FilterAlertModel';
import { useAppTheme } from 'src/constants/AppConfig';

const Chart = ({ dateFilters, assetId, dataPoints }) => {
  const toastConfig = useContext(CustomToastContext);
  const [chartData, setChartData] = useState(null);
  const [alert, setAlert] = useState(null);
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
        autoSelected: 'zoom'
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
      type: 'datetime'
    },
    // yaxis: {
    //     min: 0
    // },
    tooltip: {
      shared: true,
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
    let api = `/report/iot/data-points`;
    let param = {
      asset: assetId,
      from_date: new Date(dateFilters.from).toISOString(),
      to_date: new Date(dateFilters.to).toISOString(),
      interval: dateFilters.intervals,
      timezone: Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone,
      dataPoints: dataPoints?.map((e) => e._id)?.toString()
    };
    axiosInstance()
      .get(api, { params: param })
      .then(({ data: { data } }) => {
        const newData: any = [];
        const yaxis: any = [];
        dataPoints?.forEach((dataPoint) => {
          newData.push({
            name: dataPoint?.fieldLabel,
            data: data?.data?.map((e) => [new Date(e.time).getTime(), e[dataPoint?.fieldName]])
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

  const fetchAlert = () => {
    if (alert) {
      let api = `/report/iot/asset-error-message?asset=${assetId}&from_date=${new Date(dateFilters.from).toISOString()}&to_date=${new Date(
        dateFilters.to
      ).toISOString()}`;
      if (alert?.optionValue !== 'All') {
        api = `${api}&deviceTemplateAlert=${alert?.optionValue}`;
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
  }, [alert, assetId, dateFilters]);

  return (
    <>
      {' '}
      {chartData ? (
        <>
          <FilterAlertModel
            assetId={assetId}
            selectedAlert={alert}
            setSelectedAlert={setAlert}
            showHighLow={showHighLow}
            setShowHighLow={setShowHighLow}
          />
          <ReactApexChart key={currentChartTheme} options={options} series={chartData} type="line" height={500} />
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
