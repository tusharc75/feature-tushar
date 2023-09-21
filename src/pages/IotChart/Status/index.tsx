import { useState } from 'react';
import { Box } from '@material-ui/core';
import moment from 'moment';
import FilterModel from '../Helper/FilterModel';
import DigitalChart from '../Helper/DigitalChart';

const PerformanceAnalysis = ({ assetId, dataPoints = [] }) => {
  const [dateFilters, setDateFilters] = useState({
    from: new Date(moment().subtract(8, 'days').format('MM-DD-YYYY')),
    to: new Date(),
    intervals: '1hour'
  });

  return (
    <>
      <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} />
      <Box mt={2}/>
      <DigitalChart assetId={assetId} dateFilters={dateFilters} dataPoints={dataPoints} />
    </>
  );
};

export default PerformanceAnalysis;
