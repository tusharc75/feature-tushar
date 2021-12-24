import { Box, Typography } from "@material-ui/core";
import { CircularProgress } from "@material-ui/core";

import PropTypes from "prop-types";

const Loader = ({ noLoader = false, text, ...rest }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      {...rest}
    >
      {!noLoader && <CircularProgress />}
      <Box marginY={1} />
      {text && <Typography variant="caption">{text}</Typography>}
    </Box>
  );
};

Loader.propTypes = {
  text: PropTypes.any,
};

export default Loader;
