import { Box } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";

const ActivityLoader = () => {
  return (
    <>
      <Box className="activity">
        <Box display="flex" mb={1}>
          <Skeleton variant="text" width="60px" />
          <Box mx={1} />
          <Skeleton variant="text" width="100px" />
        </Box>
        <Skeleton
          style={{ borderRadius: "16px" }}
          width="200px"
          height="40px"
        />
      </Box>
      <Box mx={1} />
      <Box className="activity">
        <Box display="flex" mb={1}>
          <Skeleton variant="text" width="60px" />
          <Box mx={1} />
          <Skeleton variant="text" width="100px" />
        </Box>
        <Skeleton
          style={{ borderRadius: "18px" }}
          width="200px"
          height="40px"
        />
      </Box>
    </>
  );
};

export default ActivityLoader;
