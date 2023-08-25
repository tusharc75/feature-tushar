import React, { useState, useEffect, useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { Box, Checkbox, FormControlLabel, FormGroup } from '@material-ui/core';
import moment from 'moment';
import Chart from '../Chart';
import { isEmpty } from 'lodash';
import FilterModel from '../Chart/FilterModel';
import { dateTimeFormat } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';

const PerformanceAnalysis = ({ assetId, dataPoints = [] }) => {
  const toastConfig = useContext(CustomToastContext);

  // const [dateFilters, setDateFilters] = useState({
  //   from: new Date(moment().subtract(15, 'days').format('MM-DD-YYYY')),
  //   to: new Date(),
  //   intervals: '1minute'
  // });

  const [chartData, setChartData] = useState(null);
  const [selectedDataPoint, setSelectedDataPoint] = useState({});

  // const fetchData = () => {
  //   const dataPointsSend = Object.keys(selectedDataPoint).filter((_k) => selectedDataPoint[_k])?.map((k) => dataPoints.find((d) => d.fieldName === k)?._id);

  //   axiosInstance()
  //     .get(`/report/iot/data-points`, {
  //       params: {
  //         asset: assetId,
  //         from_date: new Date(dateFilters.from).toISOString(),
  //         to_date: new Date(dateFilters.to).toISOString(),
  //         interval: dateFilters.intervals,
  //         dataPoints: dataPointsSend?.toString()
  //       }
  //     })
  //     .then(({ data: { data } }) => {
  //       setChartData(data?.data);
  //     })
  //     .catch((error) => {
  //       toastConfig.setToastConfig(error);
  //     });
  // }

  const fetchData = (from, to, interval) => {
    const dataPointsSend = Object.keys(selectedDataPoint)
      .filter((_k) => selectedDataPoint[_k])
      ?.map((k) => dataPoints?.find((d) => d.fieldName === k)?._id);

    axiosInstance()
      .get(`/report/iot/data-points`, {
        params: {
          asset: assetId,
          from_date: new Date(from).toISOString(),
          to_date: new Date(to).toISOString(),
          interval: interval,
          dataPoints: dataPointsSend?.toString()
        }
      })
      .then(({ data: { data } }) => {
        setChartData(data?.data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  useEffect(() => {
    const to = new Date();
    const from = new Date(moment().subtract(15, 'days').format('MM-DD-YYYY'));
    fetchData(from, to, '1minute');
  }, [assetId, dataPoints, selectedDataPoint]);

  // useEffect(() => {
  //   if (!isEmpty(selectedDataPoint)) {
  //     fetchData();
  //   }
  // }, [assetId, dataPoints, dateFilters, selectedDataPoint]);

  const generateSeries = () => {
    return Object.keys(selectedDataPoint)
      .filter((k) => selectedDataPoint[k])
      .map((key) => {
        const seriesData = chartData
          ?.map((d) => {
            const date = moment(d.time).valueOf();
            return isNaN(date) || d[key] === undefined ? null : [date, d[key]];
          })
          .filter(Boolean);

        return {
          name: key,
          type: 'line',
          data: seriesData,
          tooltip: {
            valueDecimals: 2
          }
        };
      });
  };

  const options = {
    navigator: {
      enabled: true,
      adaptToUpdatedData: false
    },
    scrollbar: {
      liveRedraw: false,
      enabled: true
    },

    rangeSelector: {
      selected: 5,
      buttons: [
        { type: 'second', count: 1, text: '1s' },
        { type: 'second', count: 5, text: '5s' },
        { type: 'second', count: 10, text: '10s' },
        { type: 'second', count: 30, text: '30s' },
        { type: 'minute', count: 1, text: '1m' },
        { type: 'minute', count: 5, text: '5m' },
        { type: 'minute', count: 15, text: '15m' },
        { type: 'hour', count: 1, text: '1h' },
        { type: 'hour', count: 6, text: '6h' },
        { type: 'day', count: 1, text: '1D' },
        { type: 'day', count: 7, text: '7D' },
        { type: 'day', count: 30, text: '30D' }
      ]
    },
    series: generateSeries(),
    xAxis: {
      type: 'datetime',
      events: {
        setExtremes: function (e) {
          if (e.min && e.max && (!e.trigger || e.trigger === 'rangeSelectorButton')) {
            fetchData(new Date(e.min), new Date(e.max), e.rangeSelectorButton.type);
          }
        }
      },
      dateTimeLabelFormats: {
        second: '%H:%M:%S',
        minute: '%H:%M',
        hour: '%H:%M',
        day: '%e. %b',
        week: '%e. %b',
        month: "%b '%y",
        year: '%Y'
      }
    },
    tooltip: {
      crosshairs: true,
      shared: true,
      useHTML: true,
      headerFormat: '<small>{point.key}</small><table>',
      pointFormat: '<tr><td style="color: {series.color}">{series.name}: </td>' + '<td style="text-align: right"><b>{point.y}</b></td></tr>',
      footerFormat: '</table>',
      valueDecimals: 2
    },
    dataGrouping: {
      enabled: false
    }
  };

  return (
    <>
      {/* <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} /> */}
      <Box mt={2}>
        <div className="grid gap-y-4 sm:gap-x-3 md:gap-x-4 grid-cols-1 sm:grid-cols-[5fr_9fr] md:grid-cols-[4fr_9fr] lg:grid-cols-[320px_1fr]">
          <div className="container-with-border">
            <p className=" font-semibold px-4 py-3 text-[16px]" style={{ borderBottom: '1px solid var(--common-border-color)' }}>
              Data Points
            </p>
            <div className="sm:h-[calc(574px-48px)] h-[250px] px-4 overflow-auto py-1">
              <FormGroup>
                {Array.isArray(dataPoints) &&
                  dataPoints?.map((dataPoint) => {
                    return (
                      <FormControlLabel
                        control={
                          <Checkbox
                            onChange={(e) => {
                              setSelectedDataPoint({ ...selectedDataPoint, [dataPoint?.fieldName]: e.target.checked });
                            }}
                            checked={selectedDataPoint[dataPoint?.fieldName]}
                            inputProps={{
                              'aria-labelledby': `checkbox-list-label-select-all`
                            }}
                          />
                        }
                        label={dataPoint?.fieldLabel}
                      />
                    );
                  })}
              </FormGroup>
            </div>
          </div>
          <div className="container-with-border">
            {Object.keys(selectedDataPoint).filter((item) => selectedDataPoint[item]).length ? (
              // <Chart
              //   id={`${Date.now()}`}
              //   data={{
              //     labels: chartData?.map((e) => moment(e?.time).format(dateTimeFormat)),
              //     datasets: Object.keys(selectedDataPoint)
              //       .filter((_k) => selectedDataPoint[_k])
              //       .map((_d, i) => ({
              //         label: dataPoints?.find((d) => d.fieldName === _d)?.fieldLabel,
              //         data: chartData?.map((e) => e[_d]),
              //         borderColor: ['rgb(255, 99, 132)', 'rgba(54, 162, 235)', 'rgba(255, 206, 86)', 'rgba(75, 192, 192)'],
              //         backgroundColor: ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)']
              //       }))
              //   }}
              // />
              <HighchartsReact highcharts={Highcharts} constructorType={'chart'} options={options} />
            ) : (
              <div className="text-center grid place-items-center text-xl font-semibold text-gray-400 dark:text-gray-300 min-h-[574px]">
                <p className="border-dashed border-r-0 border-l-0 py-4">Select Some Datapoints</p>
              </div>
            )}
          </div>
        </div>
      </Box>
    </>
  );
};

export default PerformanceAnalysis;
