import { useState, useEffect, useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { isEmpty } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { Box } from '@mui/material';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const Chart = ({ dateFilters, assetId, dataPoints }) => {
  const toastConfig = useContext(CustomToastContext);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!isEmpty(dataPoints)) {
      fetchData();
    }
  }, [assetId, dataPoints, dateFilters]);

  const fetchData = () => {
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
    axiosInstance()
      .get(`/report/iot-data-points`, {
        params: {
          filterById: JSON.stringify(filterById),
          deepFilter: JSON.stringify(deepFilter),
          timezone: Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone
        }
      })
      .then(({ data: { data } }) => {
        const newData = [];
        dataPoints?.forEach((obj) => {
          newData.push({
            name: `${obj?.fieldLabel}${obj?.unit ? ` (${obj?.unit})` : ``}`,
            type: 'line',
            data: data?.map((e) => {
              return [new Date(e.time).getTime(), e[obj?.fieldName]];
            }),
            tooltip: {
              valueDecimals: parseInt(obj?.decimalPlaces) || 2
            }
          });
        });
        setChartData(newData);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      {' '}
      {chartData ? (
        <HighchartsReact
          highcharts={Highcharts}
          constructorType={'stockChart'}
          options={{
            title: {
              text: ''
            },
            yAxis: [
              {
                title: {
                  text: ''
                },
                valueDecimals: 2,
                opposite: false
              }
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
                }
              }
            },
            rangeSelector: {
              inputEnabled: false,
              chart: {
                zoomType: 'x'
              },
              verticalAlign: 'top',
              x: 0,
              y: 0
            },
            series: chartData,
            tooltip: {
              crosshairs: true,
              shared: true,
              useHTML: true,
              pointFormat: '<tr><td style="color: {series.color}">{series.name}: </td>' + '<td style="text-align: right"><b>{point.y}</b></td></tr>',
              footerFormat: '</table>',
              valueDecimals: 2
            }
          }}
          containerProps={{ style: { height: '100%' } }}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
};

export default Chart;
