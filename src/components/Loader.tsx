import { Box, Typography, BoxProps } from '@material-ui/core';
import { CircularProgress } from '@material-ui/core';

interface Props extends BoxProps {
  text?: string;
  noLoader?: boolean;
}

const Loader = ({ noLoader = false, text, ...rest }: Props) => {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" {...rest}>
      {!noLoader && <CircularProgress />}
      <Box marginY={1} />
      {text && <Typography variant="caption">{text}</Typography>}
    </Box>
  );
};

export default Loader;
