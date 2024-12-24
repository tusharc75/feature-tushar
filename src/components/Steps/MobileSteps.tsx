import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
  mobileStep: {
    backgroundColor: 'var(--dark-primary, #f1f5ff)'
  },
  createLayout: {
    minHeight: '45px',
    backgroundColor: 'var(--dark-primary, #f1f5ff)',
    borderTop: '1px solid var(--common-border-color)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'fixed',
    right: 0,
    bottom: -3,
    zIndex: 123,
    left: 0,
    ['@media (min-width:960px)']: {
      left: '84px'
    }
  },
  stepLayout: {
    paddingTop: '3px',
    fontWeight: 600,
    color: 'var(--primary-text)'
  }
}));

export default function MobileSteps({ nextButton, backButton, stepName, id }) {
  const classes = useStyles();
  return (
    <div className={classes.createLayout}>
      {backButton}
      <span className={classes.stepLayout} id={id}>
        {stepName}
      </span>
      {nextButton}
    </div>
  );
}
