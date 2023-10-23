import { Box, Chip, Grid, IconButton, makeStyles, Tooltip, Typography } from '@material-ui/core';
import { Fragment, useEffect, useState, useReducer, ReactNode } from 'react';
import { useHistory } from 'react-router-dom';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import Gauges from 'src/components/Gauges';
import { SEARCH, useStore } from 'src/StateProvider/fastContext';
import MetricsWithIcon from 'src/components/MetricsWithIcon';
import { FaSuitcase, FaTruck } from 'react-icons/fa';

const useStyles = makeStyles((theme) => ({
  cardBox: {
    borderRadius: '12px',
    boxShadow: '0px 3px 30px rgba(0, 0, 0, 0.08)',
    border: '1px solid var(--common-border-color)',
    backgroundColor: 'var(--dark-secondary, #fff)',
    position: 'relative',
    height: '100%',
    cursor: 'pointer'
  },
  text: {
    fontSize: '14px',
    lineHeight: '1.28',
    color: 'var(--dark-primary-text, #2A3042)',
    marginBottom: '7px'
  },

  singleGauge: {
    maxWidth: '150px',
    flexBasis: '150px',
    padding: '10px 10px 0 0',

    [theme.breakpoints.up('md')]: {
      flexBasis: '50%',
      maxWidth: '50%'
    },
    [theme.breakpoints.up('lg')]: {
      flexBasis: '33.33%',
      maxWidth: '33.33%'
    }
  }
}));

const CardView = ({ jobs, setShowManageJobDialog, setSingleJobDelete, dispatch, loading }) => {
  const classes = useStyles();
  const history = useHistory();
  const [searchQuery] = useStore((store) => store[SEARCH]);

  const {
    state: { permissions }
  }: any = useData();

  useEffect(() => {
    let timer;
    if (searchQuery) {
      timer = setTimeout(() => {
        let query = searchQuery?.trim();
        if (query !== '') {
          dispatch({ type: 'search', search: query });
        }
      }, 300);
    } else {
      timer = setTimeout(() => {
        dispatch({ type: 'search', search: '' });
        dispatch({ type: 'loading', loading: false });
      }, 300);
    }
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="card-view">
      {loading ? (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      ) : (
        <Box mt={3}>
          {jobs?.length > 0 ? (
            <Grid container spacing={2}>
              {jobs.map((job, index) => {
                return (
                  <Grid item md={4} sm={6} xs={12} key={index}>
                    <Box
                      className={`${classes.cardBox} p-[15px] md:p-[22px_22px_26px] `}
                      onClick={(e) => {
                        history.push(`${routes.jobDetail.path}/${job?._id}`);
                      }}
                    >
                      <div
                        className="flex flex-wrap justify-between items-start pb-[16px] mb-[18px]"
                        style={{ borderBottom: '1px solid var(--common-border-color)' }}
                      >
                        <div>
                          <Typography className={classes.text}>
                            <strong>Job Number :</strong> {job?.jobNumber}
                          </Typography>
                          <Typography className={classes.text}>
                            <strong>Customer Account :</strong> {job?.customerAccount}
                          </Typography>
                        </div>
                        <span className="p-[5px_10px] line-clamp-1 bg-[var(--new-theme-color)] text-white text-[12px] leading-[13px] rounded-[14px] font-semibold">
                          Fleet Required
                        </span>
                        {/* {parseInt((Math.random() * 10)?.toFixed(0)) % 2 === 0 ? <Chip color="primary" label="Fleet Required" /> : null} */}
                      </div>
                      <div className="flex justify-between gap-2 items-end">
                        <Box className={`flex gap-2 flex-wrap`}>
                          <RenderIconCard
                            icon={<FaSuitcase size={30} />}
                            label={'Job Total'}
                            value={`${parseInt((Math.random() * 1000)?.toFixed(0))} MMcf`}
                          />
                          <RenderIconCard
                            icon={<FaTruck className=" [transform:rotateY(180deg)]" size={30} />}
                            label={'Total Fleet'}
                            value={`${parseInt((Math.random() * 10)?.toFixed(0))}`}
                          />
                        </Box>
                        <Box className={''}>
                          <Tooltip title={`${permissions?.job?.isCreate ? 'Clone' : 'You do not have permission to clone/create'}`}>
                            <span>
                              <IconButton
                                style={{ border: '1px solid var(--common-border-color)' }}
                                className="p-[6px_!important] dark:bg-[var(--dark-primary)] disabled:opacity-40 rounded-[5px_!important] [display:block_!important] mb-2"
                                size="small"
                                disabled={!permissions?.job?.isCreate}
                                aria-label="Clone"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowManageJobDialog({ open: true, isClone: true, idToClone: job._id });
                                }}
                              >
                                <FileCopyIcon fontSize="small" color="primary" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title={`${job?.canDelete ? 'Delete' : 'You do not have permission to delete'}`}>
                            <span>
                              <IconButton
                                aria-label={`Delete`}
                                style={{ border: '1px solid var(--common-border-color)' }}
                                className="p-[6px_!important] dark:bg-[var(--dark-primary)] disabled:opacity-40 rounded-[5px_!important] [display:block_!important] "
                                disabled={!job?.canDelete}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSingleJobDelete({
                                    show: true,
                                    id: job._id,
                                    jobNumber: `${job.jobNumber}`
                                  });
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </div>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Box my={5}>
              <Typography align="center">No Data To Show</Typography>
            </Box>
          )}
        </Box>
      )}
    </div>
  );
};

export default CardView;

type TIconCardProps = {
  icon: ReactNode | string;
  label: ReactNode | string;
  value: ReactNode | string;
} & React.HTMLAttributes<HTMLDivElement>;

const RenderIconCard: React.FC<TIconCardProps> = ({ icon, label, value, className, ...others }) => {
  return (
    <div {...others} className={` text-center bg-[#F1F5FF] dark:bg-[var(--dark-primary)] min-w-[114px] py-[8px] rounded-[8px] ${className}`}>
      <div
        className={`icon bg-[#2A3042] p-2 [--size:38px] rounded-[8px] max-w-max w-[var(--size)] h-[var(--size)] flex items-center justify-center text-white mx-auto mb-[8px]`}
      >
        {icon}
      </div>
      <h6 className="text-[14px] font-semibold ">{label}</h6>
      <span className="text-[13px] font-normal">{value}</span>
    </div>
  );
};
