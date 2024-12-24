import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
  mobileStep: {
    backgroundColor: '#DEE2E6'
  },
  createLayout: {
    minHeight: '45px',
    backgroundColor: '#DEE2E6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'fixed',
    width: '100%',
    bottom: -3,
    zIndex: 123,
    left: 0
  },
  stepLayout: {
    paddingTop: '3px',
    fontWeight: 600,
    color: 'var(--primary-light)'
  }
}));

export default function CustomMobileStepperOpportunities({ nextButton, backButton, stepName }) {
  const classes = useStyles();
  return (
    <div className={classes.createLayout}>
      {backButton}
      <span className={classes.stepLayout}>{stepName}</span>
      {nextButton}
    </div>
  );
}
