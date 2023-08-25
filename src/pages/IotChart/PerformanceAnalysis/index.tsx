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

  const [dateFilters, setDateFilters] = useState({
    from: new Date(moment().subtract(15, 'days').format('MM-DD-YYYY')),
    to: new Date(),
    intervals: '1minute'
  });

  const [chartData, setChartData] = useState(null);
  const [selectedDataPoint, setSelectedDataPoint] = useState({});

  const fetchData = () => {
    const dataPointsSend = Object.keys(selectedDataPoint).filter((_k) => selectedDataPoint[_k])?.map((k) => dataPoints?.find((d) => d.fieldName === k)?._id);
    axiosInstance()
      .get(`/report/iot/data-points`, {
        params: {
          asset: assetId,
          from_date: new Date(dateFilters.from).toISOString(),
          to_date: new Date(dateFilters.to).toISOString(),
          interval: dateFilters.intervals,
          dataPoints: dataPointsSend?.toString(),
          timezone: Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone
        }
      })
      .then(({ data: { data } }) => {
        const newData = [];
        for (const key in selectedDataPoint) {
          newData.push({
            name: dataPoints.find((d) => d.fieldName === key)?.fieldLabel,
            type: 'line',
            data: data?.data?.map((e) => { return [new Date(e.time).getTime(), e[key]] }),
            tooltip: {
              valueDecimals: 2,
            },
          })
        }
        setChartData(newData);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  useEffect(() => {
    if (!isEmpty(selectedDataPoint)) {
      fetchData();
    }
  }, [assetId, dataPoints, selectedDataPoint, dateFilters]);

  return (
    <>
      <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} />
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
          <div className="container-with-border sm:h-[calc(574px-48px)] h-[250px] px-4 overflow-auto py-1">
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
              chartData ?
                <HighchartsReact
                  highcharts={Highcharts}
                  constructorType={'stockChart'}
                  options={{
                    title: {
                      text: 'Chart',
                    },
                    yAxis: [
                      {
                        title: {
                          text: "",
                        },
                        valueDecimals: 2,
                        opposite: false,
                      },
                    ],
                    xAxis: {
                      type: 'datetime',
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
                    navigator: {
                      enabled: true,
                      adaptToUpdatedData: false
                    },
                    scrollbar: {
                      liveRedraw: false,
                      enabled: true
                    },
                    plotOptions: {
                      series: {
                        dataGrouping: {
                          enabled: false
                        },
                      },
                    },
                    rangeSelector: {
                      inputEnabled: false,
                      chart: {
                        zoomType: "x",
                      },
                      verticalAlign: 'top',
                      x: 0,
                      y: 0,
                    },
                    series: chartData,
                    tooltip: {
                      crosshairs: true,
                      shared: true,
                      useHTML: true,
                      pointFormat: '<tr><td style="color: {series.color}">{series.name}: </td>' + '<td style="text-align: right"><b>{point.y}</b></td></tr>',
                      footerFormat: '</table>',
                      valueDecimals: 2
                    },
                  }}
                  containerProps={{ style: { height: '100%' } }}
                /> : null
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
