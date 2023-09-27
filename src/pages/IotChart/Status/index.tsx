import { useState } from 'react';
import { Box } from '@material-ui/core';
import moment from 'moment';
import FilterModel from '../Helper/FilterModel';
import TimleineChart from '../Helper/TimelineChart';

const PerformanceAnalysis = ({ assetId, dataPoints = [] }) => {

  const [dateFilters, setDateFilters] = useState({
    from: new Date(moment().subtract(8, 'days').format('MM-DD-YYYY')),
    to: new Date(),
    intervals: '1hour'
  });

  return (
    <>
      <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} />
      <Box mt={2} >
        <TimleineChart
          assetId={assetId}
          dateFilters={dateFilters}
          dataPoints={dataPoints} />
      </Box>
    </>
  );
};

export default PerformanceAnalysis;
