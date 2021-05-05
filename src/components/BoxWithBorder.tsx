import { makeStyles } from "@material-ui/core/styles";
import { Box } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {
    border: "1px solid #D4D6D7",
    borderRadius: 4,
    padding: theme.spacing(1, 2),
    overflow: "hidden",
  },
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
