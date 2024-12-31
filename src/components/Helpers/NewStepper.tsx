import { Check } from '@mui/icons-material';
import { Grid2, Paper, Step, StepConnector, StepLabel, Stepper, Theme, Typography } from '@mui/material';
import { makeStyles, withStyles } from '@mui/styles';
import clsx from 'clsx';
import { FaHourglassHalf } from 'react-icons/fa';
import { FcCancel } from 'react-icons/fc';
import { Link } from 'react-router-dom';
import { getUniqueCurrencies } from '../../constants/helpers';

import routes from './Routes';

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2)
  },

  infoContainer: {
    display: 'flex',
    marginTop: theme.spacing(2),
    justifyContent: 'space-evenly',
    [theme.breakpoints.down('sm')]: 'flex-start'
  },

  box: {
    backgroundColor: '#E6F4FF',
    borderRadius: 8,
    padding: theme.spacing(1.5, 2)
  }
}));

const QontoConnector = withStyles((theme: Theme) => ({
  alternativeLabel: {
    top: 10,
    left: 'calc(-90% - 16px)',
    right: 'calc(10% - 16px)'
  },
  line: {
    borderColor: '#09445A',
    borderTopWidth: 3,
    borderRadius: 1,
    color: '#09445A'
  }
}))(StepConnector);

const useQontoStepIconStyles = makeStyles((theme: Theme) => ({
  root: {
    color: '#09445A',
    display: 'flex',
    alignItems: 'center'
  },
  active: {
    color: '#aaa'
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    zIndex: 1,
    border: '2px solid #163340',
    marginTop: '-6px',
    background: '#f6f6f6',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  completed: {
    color: theme.palette.primary.main //  darkBg
  },
  check: {
    zIndex: 1,
    fontSize: 18,
    color: '#09445A'
  }
}));

const useQontoStepIconStylesForQuote = makeStyles((theme: Theme) => ({
  root: {
    color: 'white',
    display: 'flex',
    alignItems: 'center'
  },
  active: {
    color: '#aaa'
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: 'currentColor',
    display: 'grid',
    placeItems: 'center',
    zIndex: 1,
    border: '2px solid #163340',
    marginTop: '-6px',
    background: '#f6f6f6'
  },
  completed: {
    color: theme.palette.primary.main //  darkBg
  },
  check: {
    zIndex: 1,
    fontSize: 18,
    color: '#047d1c !important'
  },
  cancel: {
    zIndex: 1,
    fontSize: 18,
    color: '#d60f0f !important'
  },
  pending: {
    zIndex: 1,
    fontSize: 18,
    color: '#d1c4c4 !important'
  }
}));

function QontoStepIcon(status) {
  const classes = useQontoStepIconStyles();

  return (
    <div className={clsx(classes.root)}>
      <div className={clsx(classes.circle)}>
        <Check className={classes.check} />
      </div>
    </div>
  );
}

function QontoStepIconForApprove(status) {
  const classes = useQontoStepIconStylesForQuote();

  return (
    <div className={clsx(classes.root)}>
      <div className={clsx(classes.circle)}>
        <Check className={classes.check} />
      </div>
    </div>
  );
}
function QontoStepIconForPending(status) {
  const classes = useQontoStepIconStylesForQuote();

  return (
    <div className={clsx(classes.root)}>
      <div className={clsx(classes.circle)}>
        <FaHourglassHalf className={classes.pending} />
      </div>
    </div>
  );
}
function QontoStepIconForReject(status) {
  const classes = useQontoStepIconStylesForQuote();

  return (
    <div className={clsx(classes.root)}>
      <div className={clsx(classes.circle)}>
        <FcCancel className={classes.cancel} />
      </div>
    </div>
  );
}
const NewStepper = ({ steps = null, heading, doaCurrency = null, quoteDOA = null, doaApproveType = 'User' }) => {
  const classes = useStyles();

  return (
    <Paper elevation={0} className={classes.container}>
      <Typography variant="h6">{heading}</Typography>
      <Grid2 container sx={{ justifyContent: 'center', alignItems: 'center' }}>
        <Grid2 size={{ xs: 12, md: 12, lg: 7 }}>
          <Stepper activeStep={-1} connector={<QontoConnector />} alternativeLabel>
            {quoteDOA
              ? quoteDOA?.map((label, index) => (
                  <Step key={index}>
                    <StepLabel
                      StepIconComponent={
                        label?.status === 'approve'
                          ? QontoStepIconForApprove
                          : label?.status === 'pending'
                            ? QontoStepIconForPending
                            : QontoStepIconForReject
                      }
                    >
                      <>
                        {label?.status === 'pending' ? (
                          <>
                            {label?.users?.slice(0, 3).map((obj) => (
                              <div style={{ color: 'var(--dark-secondary-text, #09445A)' }}>
                                <Link title={obj?.firstName} className="link" target="_blank" to={`${routes.userDetail.path}/${obj?.id}`}>
                                  {`${obj?.firstName} ${obj?.lastName}`}
                                </Link>
                              </div>
                            ))}
                            {label?.users?.length > 4 && `+ ${label?.users.length - 4} more`}
                          </>
                        ) : (
                          <div style={{ color: 'var(--dark-secondary-text, #09445A)' }}>
                            <Link
                              title={label?.users.find((d) => d?.status === label?.status)?.firstName}
                              className="link"
                              target="_blank"
                              to={`${routes.userDetail.path}/${label?.users.find((d) => d?.status === label?.status)?.id}`}
                            >
                              {`${label?.users.find((d) => d?.status === label?.status)?.firstName} ${
                                label?.users.find((d) => d.status === label?.status)?.lastName
                              }`}
                            </Link>
                          </div>
                        )}
                      </>
                    </StepLabel>
                  </Step>
                ))
              : steps
                  .filter((item) => !item?.disable)
                  .map((label) => (
                    <Step key={label}>
                      <StepLabel StepIconComponent={QontoStepIcon}>
                        {doaApproveType === 'User' ? (
                          <>
                            {label?.user
                              ?.slice(0, 3)
                              .filter((user) => user?.firstName && user?.lastName)
                              .map((obj) => (
                                <div style={{ color: 'var(--dark-secondary-text, #09445A)' }}>
                                  <Link title={obj?.firstName} target="_blank" className="link" to={`${routes.userDetail.path}/${obj?._id}`}>
                                    {`${obj?.firstName} ${obj?.lastName}`}
                                  </Link>
                                </div>
                              ))}
                            {label?.users?.length > 4 && `+ ${label?.users.length - 4} more`}
                            {doaCurrency && (
                              <div style={{ color: 'var(--dark-secondary-text, #09445A)' }}>
                                {getUniqueCurrencies().filter((data) => data?.currencyCode === doaCurrency).length
                                  ? getUniqueCurrencies().filter((data) => data?.currencyCode === doaCurrency)[0].symbolNative
                                  : null}
                                {label?.amount}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {label?.role
                              ?.slice(0, 3)
                              .filter((role) => role?.name)
                              .map((obj) => (
                                <div style={{ color: 'var(--dark-secondary-text, #09445A)' }}>
                                  <Link title={obj?.name} className="link" to={`${routes.roleDetail.path}/${obj?._id}`}>
                                    {`${obj?.name}`}
                                  </Link>
                                </div>
                              ))}
                            {label?.role?.length > 4 && `+ ${label?.role.length - 4} more`}
                            {doaCurrency && (
                              <div style={{ color: 'var(--dark-secondary-text, #09445A)' }}>
                                {getUniqueCurrencies().filter((data) => data?.currencyCode === doaCurrency).length
                                  ? getUniqueCurrencies().filter((data) => data?.currencyCode === doaCurrency)[0].symbolNative
                                  : null}
                                {label?.amount}
                              </div>
                            )}
                          </>
                        )}
                      </StepLabel>
                    </Step>
                  ))}
          </Stepper>
        </Grid2>
      </Grid2>
    </Paper>
  );
};

export default NewStepper;
