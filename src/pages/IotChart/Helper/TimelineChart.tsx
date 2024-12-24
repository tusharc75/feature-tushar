import { useState, useEffect, useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Box } from '@mui/material';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ReactApexChart from 'react-apexcharts';
import { useAppTheme } from 'src/constants/AppConfig';
import moment from 'moment';
import { dateTimeFormat24Hours } from 'src/constants/helpers';

let chartOptions: any = {
  theme: {
    mode: 'light',
    palette: 'palette2'
  },
  chart: {
    background: 'transparent',
    height: 350,
    type: 'rangeBar'
  },
  plotOptions: {
    bar: {
      horizontal: true,
      barHeight: '10%',
      rangeBarGroupRows: true
    }
  },
  grid: {
    show: true,
    borderColor: 'var(--common-border-color)'
  },
  colors: ['#00E396', '#FF0000'],
  fill: {
    type: 'solid'
  },
  xaxis: {
    type: 'datetime',
    labels: {
      formatter: function (value) {
        const formattedDateTime = moment(value).format(dateTimeFormat24Hours);
        return formattedDateTime;
      }
    },
    tickAmount: 8
  },
  legend: {
    position: 'right'
  },
  tooltip: {
    x: {
      formatter: function (value) {
        let date = new Date(value);
        if (isNaN(date.getTime())) {
          return value;
        } else {
          return moment(value).format(dateTimeFormat24Hours);
        }
      }
    }
  }
};

const TimelineChart = ({ assetId, dateFilters, dataPoints }) => {
  const [themeColor] = useAppTheme();
  const toastConfig = useContext(CustomToastContext);
  const [chartData, setChartData] = useState(null);
  const [currentChartTheme, setCurrentChartTheme] = useState('light');

  useEffect(() => {
    fetchData();
  }, [assetId, dateFilters, dataPoints]);

  const fetchData = () => {
    let filterById = [
      {
        field: 'dataPoints',
        term: { $in: dataPoints?.map((d: any) => d._id) }
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
        if (data?.length) {
          setChartData(transformData(data));
        } else {
          setChartData({ active: [], inactive: [] });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  function transformData(piData) {
    const dataPointsFieldName: any = dataPoints?.map((e) => e.fieldName);

    if (!piData) return null;
    const statusKeys = Object.keys(piData[0]).filter((key) => key !== 'time' && dataPointsFieldName?.includes(key));

    let activeIntervals = [];
    let inactiveIntervals = [];

    for (let key of statusKeys) {
      const fieldLabel = dataPoints?.find((e) => e?.fieldName === key)?.fieldLabel || key;

      let currentIntervalStart = new Date(piData[0].time).getTime();
      let currentStatus = piData[0][key];

      for (let i = 1; i < piData.length; i++) {
        let currentTime = new Date(piData[i].time).getTime();

        if (piData[i][key] !== currentStatus) {
          // If status changes, push the previous interval
          if (currentStatus === 1) {
            activeIntervals.push({ x: fieldLabel, y: [currentIntervalStart, currentTime] });
          } else {
            inactiveIntervals.push({ x: fieldLabel, y: [currentIntervalStart, currentTime] });
          }

          // Reset currentIntervalStart and currentStatus for the next series
          currentIntervalStart = currentTime;
          currentStatus = piData[i][key];
        }
      }

      // Push the last interval after the loop
      if (currentStatus === 1) {
        activeIntervals.push({ x: fieldLabel, y: [currentIntervalStart, new Date(piData[piData.length - 1].time).getTime()] });
      } else {
        inactiveIntervals.push({ x: fieldLabel, y: [currentIntervalStart, new Date(piData[piData.length - 1].time).getTime()] });
      }
    }

    return { active: activeIntervals, inactive: inactiveIntervals };
  }

  useEffect(() => {
    const newOptions = { ...chartOptions };
    newOptions.theme.mode = themeColor;
    chartOptions = newOptions;
    setCurrentChartTheme(themeColor);
  }, [themeColor]);

  return (
    <>
      {chartData ? (
        <ReactApexChart
          key={currentChartTheme}
          options={chartOptions}
          series={[
            {
              name: 'Active',
              data: chartData?.active
            },
            {
              name: 'Inactive',
              data: chartData?.inactive
            }
          ]}
          type="rangeBar"
          height={500}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
};

export default TimelineChart;
