import { Typography, makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  footerText: {
    textAlign: "center",
    marginTop: theme.spacing(2),
  },
}));

const Footer = () => {
  const classes = useStyles();
  return (
    <div>
      <Typography
        component="div"
        className={classes.footerText}
        variant="subtitle1"
        color="textSecondary"
      >
        eQuip-T &copy; 2021
      </Typography>
    </div>
  );
};

export default Footer;
