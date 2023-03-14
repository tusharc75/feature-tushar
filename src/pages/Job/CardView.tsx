import { Box, Chip, Grid, IconButton, makeStyles, Tooltip, Typography } from '@material-ui/core';
import { Fragment, useEffect, useState, useReducer } from 'react';
import { useHistory } from 'react-router-dom';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import Gauges from 'src/components/Gauges';

const useStyles = makeStyles((theme) => ({
    cardBox: {
        borderRadius: '4px',
        border: '1px solid #ebebeb',
        backgroundColor: "#F8FFFC",
        position: 'relative',
        padding: '15px',
        paddingBottom: '35px',
        height: '100%',
        cursor: 'pointer'
    },
    text: {
        fontSize: '14px',
        lineHeight: '1.28',
        color: '#2A3042',
        marginBottom: '7px'
    },
    icons: {
        position: 'absolute',
        right: 0,
        bottom: 0,
    },
    gaugeContainer: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '400px',
        paddingTop: '15px',
        paddingBottom: '10px'
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

    const {
        state: { permissions, searchQuery }
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
        <div className='card-view'>
            {loading ? (
                <Box p={2} height={500} bgcolor="white">
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            ) :
                <Box mt={3} >
                    {jobs?.length > 0 ?
                        <Grid container spacing={2}>
                            {jobs.map((job, index) => {
                                return (
                                    <Grid item lg={4} md={4} sm={6} xs={12} key={index}>
                                        <Box className={`${classes.cardBox}`} onClick={(e) => {
                                            history.push(`${routes.jobDetail.path}/${job?._id}`);
                                        }}>
                                            <Typography className={classes.text}><strong>Job Number :</strong> {job?.jobNumber}</Typography>
                                            <Typography className={classes.text}><strong>Customer Account :</strong> {job?.customerAccount}</Typography>
                                            <Box className={classes.gaugeContainer}>
                                                <Gauges
                                                    className={classes.singleGauge}
                                                    max={1000}
                                                    colors={["#39EA75"]}
                                                    value={parseInt((Math.random() * 1000)?.toFixed(0))}
                                                    lebel="JOB TOTAL" suffix={<> MMcf</>} />
                                                <Gauges
                                                    className={classes.singleGauge}
                                                    max={100}
                                                    colors={["#2AC656"]}
                                                    value={parseInt((Math.random() * 10)?.toFixed(0))}
                                                    lebel="TOTAL FLEET" suffix={<></>} />
                                            </Box>
                                            {parseInt((Math.random() * 10)?.toFixed(0)) % 2 === 0 ? <Chip color="primary" label="Fleet Required" /> : null}
                                            <Box className={classes.icons}>
                                                {permissions?.job?.isCreate ? (
                                                    <Tooltip title="Clone">
                                                        <IconButton
                                                            size="small"
                                                            aria-label="Clone"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setShowManageJobDialog({ open: true, isClone: true, idToClone: job._id });
                                                            }}
                                                        >
                                                            <FileCopyIcon fontSize="small" color="primary" />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip className="cursor-stop" title="You do not have permission to clone/create">
                                                        <IconButton aria-label="Clone" size="small">
                                                            <FileCopyIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {job?.canDelete ? (
                                                    <Tooltip title="Delete">
                                                        <IconButton
                                                            aria-label="Delete"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSingleJobDelete({
                                                                    show: true,
                                                                    id: job._id,
                                                                    jobNumber: `${job.jobNumber}`
                                                                });
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" color="error" />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip className="cursor-stop" title="You do not have permission to delete">
                                                        <IconButton aria-label="Delete" size="small">
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </Box>
                                    </Grid>
                                )
                            })
                            }
                        </Grid>
                        : <Box my={5}>
                            <Typography align="center">No Data To Show</Typography>
                        </Box>
                    }
                </Box>}


        </div>
    );
};

export default CardView;
