import { makeStyles } from '@mui/styles';
import { Box } from '@mui/material';

const useStyles = makeStyles((theme) => ({
  root: {
    border: '1px solid var(--dark-mode-border-color, #D4D6D7)',
    borderRadius: 4,
    padding: 15,
    overflow: 'hidden'
  }
}));

const BoxWithBorder = ({ children, ...rest }) => {
  const classes = useStyles();
  return (
    <Box component="div" className={classes.root} {...rest}>
      {children}
    </Box>
  );
};

export default BoxWithBorder;
