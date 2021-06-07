import { Box } from "@material-ui/core";
import { CircularProgress } from "@material-ui/core"

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
