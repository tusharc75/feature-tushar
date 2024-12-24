import { Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
  footerText: {
    textAlign: 'center',
    marginTop: theme.spacing(2)
  }
}));

const Footer = () => {
  const classes = useStyles();
  return (
    <div>
      <Typography component="div" className={classes.footerText} variant="subtitle1" color="textSecondary">
        Equipt &copy; 2022
      </Typography>
    </div>
  );
};

export default Footer;
