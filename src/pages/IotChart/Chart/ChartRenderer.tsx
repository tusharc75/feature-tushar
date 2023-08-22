import { useEffect, useState } from 'react';
import Chart from 'react-chartjs-2';
import { FilterHandler } from './FilterHandler';
import { Box, useMediaQuery, useTheme } from '@material-ui/core';
import moment from 'moment';
import axiosInstance from 'src/axios/axiosInstance';
import ContentFullScreen from 'src/components/ContentFullScreen';

export function ChartRenderer({ dashBoardType, dataPoints, dataPoint, filterById }) {

  const [openFullScreen, setOpenFullScreen] = useState(false);
  const [chartData, setChartData] = useState(null);

  const [selectedDataPoints, setSelectedDataPoints] = useState([]);

  const theme = useTheme();

  const isScreenSmall = useMediaQuery(theme.breakpoints.down('xs'));

  const [dateFilters, setDateFilters] = useState({
    from: new Date(moment().subtract(15, 'days').format('MM-DD-YYYY')),
    to: new Date(),
    intervals: null
  });

  useEffect(() => {
    fetchData()
  }, [dataPoint, dateFilters]);

  const fetchData = async () => {

    const deepFilter: any = []
    deepFilter.push({
      field: 'from_date',
      term: moment(new Date(dateFilters.from)).format('MM/DD/YYYY')
    });
    deepFilter.push({
      field: 'to_date',
      term: moment(new Date(dateFilters.to)).format('MM/DD/YYYY')
    });

    let query = `?filterType=and`;

    const newfilterById = [...filterById];
    newfilterById.push({
      field: 'dataPoints',
      term: { $in: [dataPoint?._id] }
    });

    if (newfilterById?.length > 0) {
      query = `${query}&filterById=${JSON.stringify(newfilterById)}`;
    }
    if (deepFilter?.length > 0) {
      query = `${query}&deepFilter=${JSON.stringify(deepFilter)}`;
    }

    axiosInstance().get(`/report/iot/data-points${query}`)
      .then(({ data: { data } }) => {
        const labels = data?.data?.map((e) => e.date);
        const datasets = [{
          label: dataPoint?.fieldLabel,
          data: data?.data?.map((e) => e[dataPoint?.fieldName]),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        }]
        setChartData({ labels, datasets })
      })
      .catch((err) => {
      });
  };

  const handleChange = (_id) => {
    setSelectedDataPoints((prevDataVal) => {
      const updatedDataVal = {
        ...prevDataVal, _id: !prevDataVal[_id]
      };
      return updatedDataVal;
    });
  };

  return (<Box className="max-w-full">
    <ContentFullScreen title={'Chart'} fullScreen={openFullScreen} setFullScreen={setOpenFullScreen}>
      <Box style={{ padding: '15px 10px' }}>
        <FilterHandler
          fullScreen={openFullScreen}
          setOpenFullScreen={setOpenFullScreen}
          dateFilters={dateFilters}
          setDateFilters={setDateFilters}
          dataPoints={dataPoints}
          selectedDataPoints={selectedDataPoints}
          handleChange={handleChange}
        />
      </Box>
      <Box height={openFullScreen ? window.innerHeight - 200 : isScreenSmall ? 350 : 500}
        className="max-w-full overflow-x-auto px-[10px]">
        {chartData &&
          <Chart
            id={`${dataPoint?._id}`}
            type={'line'}
            data={chartData}
            options={{
              maintainAspectRatio: false,
              animation: false,
              fill: false,
            }}
          />
        }
      </Box>
    </ContentFullScreen>
  </Box>

  );
}
