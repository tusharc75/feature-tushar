import { Box } from '@mui/material';
import { CircularProgress } from '@mui/material';

const ActivityLoader = () => {
  return (
    <>
      <Box className="activity" justifyContent="center" display="flex">
        <CircularProgress size={22} className="mr-1" /> <strong>Fetching Data</strong>
      </Box>
    </>
  );
};

export default ActivityLoader;
