import { useState } from 'react';
import { Box } from '@mui/material';
import FilterModel from '../Helper/FilterModel';
import TimleineChart from '../Helper/TimelineChart';
import dayjs from 'dayjs';

const PerformanceAnalysis = ({ assetId, dataPoints = [] }) => {
  const [dateFilters, setDateFilters] = useState({
    from: new Date(dayjs().subtract(8, 'day').startOf('day').toJSON()),
    to: new Date(),
    intervals: 'perCycle'
  });

  return (
    <>
      {dataPoints?.filter((e) => e.type === 'Digital')?.length ? (
        <>
          <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} />
          <Box mt={2}>
            <TimleineChart assetId={assetId} dateFilters={dateFilters} dataPoints={dataPoints?.filter((e) => e.type === 'Digital')} />
          </Box>
        </>
      ) : (
        <span>Status Data Point Not Configured Yet</span>
      )}
    </>
  );
};

export default PerformanceAnalysis;
