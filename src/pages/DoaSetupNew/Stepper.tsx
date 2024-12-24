import { Box, Grid, Paper, Step, StepConnector, StepLabel, Stepper } from '@mui/material';
import { Check } from '@material-ui/icons';
import clsx from 'clsx';
import { DoaApproveType, getUniqueCurrencies } from 'src/constants/helpers';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import { withStyles, makeStyles } from '@mui/styles';

const QontoConnector = withStyles((theme) => ({
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

const useQontoStepIconStyles = makeStyles((theme) => ({
  root: {
    color: '#09445A',
    display: 'flex',
    alignItems: 'center'
  },
  active: {
    color: '#aaa'
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    zIndex: 1,
    border: '2px solid #163340',
    padding: '5px 23px 23px 5px',
    marginTop: '-6px',
    background: '#f6f6f6'
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

function QontoStepIcon() {
  const classes = useQontoStepIconStyles();

  return (
    <div className={clsx(classes.root)}>
      <div className={clsx(classes.circle)}>
        <Check className={classes.check} />
      </div>
    </div>
  );
}

const DoaStepper = ({ data }) => {
  return (
    <Paper elevation={0}>
      <Box m={2} p={2}>
        <Grid container justifyContent="center" alignItems="center">
          <Grid item xs={12} md={12} lg={7}>
            <Stepper activeStep={-1} connector={<QontoConnector />} alternativeLabel>
              {data?.approveType === DoaApproveType.user
                ? data?.users?.map((user, i) => {
                    return (
                      <Step key={i}>
                        <StepLabel StepIconComponent={QontoStepIcon}>
                          <>
                            {user?.user
                              ?.filter((u) => u?._id && u?.name)
                              ?.map((u) => {
                                return (
                                  <div style={{ color: 'var(--dark-secondary-text, #09445A)' }}>
                                    <Link title={u?.name} target="_blank" className="link" to={`${routes.userDetail.path}/${u?._id}`}>
                                      {u?.name}
                                    </Link>
                                  </div>
                                );
                              })}
                            {user?.user?.length > 4 && `+ ${user?.user.length - 4} more`}
                            {data?.currency && (
                              <div style={{ color: 'var(--dark-secondary-text, #09445A)' }}>
                                {getUniqueCurrencies().filter((d) => d?.currencyCode === data?.currency).length
                                  ? getUniqueCurrencies().filter((d) => d?.currencyCode === data?.currency)[0].symbolNative
                                  : null}
                                {user?.amount}
                              </div>
                            )}
                          </>
                        </StepLabel>
                      </Step>
                    );
                  })
                : data?.roles?.map((role, i) => {
                    return (
                      <Step key={i}>
                        <StepLabel StepIconComponent={QontoStepIcon}>
                          <>
                            {role?.role
                              ?.filter((r) => r?._id && r?.name)
                              ?.map((r) => {
                                return (
                                  <div style={{ color: 'var(--dark-secondary-text, #09445A)' }}>
                                    <Link title={r?.name} target="_blank" className="link" to={`${routes.roleDetail.path}/${r?._id}`}>
                                      {r?.name}
                                    </Link>
                                  </div>
                                );
                              })}
                            {role?.role?.length > 4 && `+ ${role?.role?.length - 4} more`}
                            {data?.currency && (
                              <div style={{ color: 'var(--dark-secondary-text, #09445A)' }}>
                                {getUniqueCurrencies().filter((d) => d?.currencyCode === data?.currency).length
                                  ? getUniqueCurrencies().filter((d) => d?.currencyCode === data?.currency)[0].symbolNative
                                  : null}
                                {role?.amount}
                              </div>
                            )}
                          </>
                        </StepLabel>
                      </Step>
                    );
                  })}
            </Stepper>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default DoaStepper;
