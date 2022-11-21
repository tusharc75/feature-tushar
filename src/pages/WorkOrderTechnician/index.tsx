import { Box, Chip, Dialog, Grid, IconButton, makeStyles, Paper, Tooltip, Typography } from "@material-ui/core";
import { Fragment, useEffect, useState } from "react";
import CustomBreadCrumbs from "src/components/CustomBreadCrumbs";
import CustomContainer from "src/components/CustomContainer";
import routes from "src/components/Helpers/Routes";
import axiosInstance from "src/axios/axiosInstance";
import { CustomDialogTransition, WORKORDER_SERVICE_STATUS } from "src/constants/helpers";
import Steps from "../WorkOrder/Service/Steps";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";

const useStyles = makeStyles(() => ({
    activityContainer: {
        padding: "20px 20px 10px 10px",
    },
    activityMainBlock: {
        height: 'calc(100vh - 32vh)',
        overflow: 'auto'
    },
    '.MuiGrid-spacing-xs-1': {
        width: 'calc(100vw + 14px)'
    },
    block: {
        background: '#f0f0f0',
        borderRadius: '4px',
        minHeight: 'calc(100vh - 33.5vh)',
        height: '100%'
    },
    activitybox: {
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        margin: '0px 6px 14px',
        borderRadius: '4px',
        // boxShadow: 'rgb(23 43 77 / 20%) 0px 1px 1px, rgb(23 43 77 / 20%) 0px 0px 1px',
        backgroundColor: 'rgb(255, 255, 255)',
        color: 'rgb(23, 43, 77)',
        padding: '14px 15px',
        transition: 'transform .2s, background .3s',
        '&:hover': {
            transform: 'scale(1.02)',
            zIndex: '1'
            // backgroundColor: 'var(--hover_bg)'
        }
    },
    mediumDevice: {
        ['@media (min-width:600px)']: {
            flexGrow: '0',
            maxWidth: '50%',
            flexBasis: '50%'
        },
        ['@media (min-width:768px)']: {
            flexGrow: '0',
            maxWidth: '33.333333%',
            flexBasis: '33.333333%'
        },
        ['@media (min-width:1100px)']: {
            flexGrow: '0',
            maxWidth: '25%',
            flexBasis: '25%'
        }
    }
}));

const WorkOrderTechnician = () => {

    const classes = useStyles();
    const [workOrderId, setWorkOrderId] = useState(null);
    const [service, setService] = useState(null);
    const [serviceData, setServiceData] = useState([]);
    const [serviceDetailsShow, setServiceDetailsShow] = useState(false);

    useEffect(() => {
        fetchWorkOrderTechnician()
    }, []);

    const fetchWorkOrderTechnician = () => {
        axiosInstance()
            .get(`/work-order-technician`)
            .then(({ data: { data } }) => {
                setServiceData(data)
            })
    }

    return (
        <Fragment>
            <Grid container className="headerbox">
                <Grid item xs={12}>
                    <CustomBreadCrumbs routes={[{ title: routes.workOrderTechnician.title }]} />
                </Grid>
            </Grid>
            <CustomContainer >
                <Fragment>
                    <Box className={classes.activityContainer}>
                        <Grid container spacing={2} className={` ${classes.activityMainBlock}`}>
                            {Object.keys(WORKORDER_SERVICE_STATUS).map((key, i) => {
                                return (
                                    <Grid item md={3} xs={12} sm={4} style={{ paddingTop: '0px' }} key={i} className={classes.mediumDevice}>
                                        <div className={classes.block}>
                                            <Box p={1} className="fixedBoardHeader">
                                                <Typography variant="subtitle2" style={{ width: '50%' }}>
                                                    {WORKORDER_SERVICE_STATUS[key]}
                                                    {' (' + serviceData?.filter(d => d.status === WORKORDER_SERVICE_STATUS[key]).length + ')'}
                                                </Typography>
                                            </Box>
                                            {serviceData?.filter(d => d.status === WORKORDER_SERVICE_STATUS[key]).map((data, index) => {
                                                return (
                                                    <Box key={index}
                                                        onClick={() => {
                                                            let tempServiceData = data?.service
                                                            tempServiceData["uniqueId"] = data?.service?._id
                                                            setService(tempServiceData)
                                                            setWorkOrderId(data?.workOrderDetail?._id)
                                                            setServiceDetailsShow(true)
                                                        }}
                                                        className={` ${classes.activitybox}`} >
                                                        <Box>
                                                            <Grid container>
                                                                <Grid item xs={11}>
                                                                    <Box display="flex" mr="10px">
                                                                        <Typography
                                                                            style={{
                                                                                textOverflow: 'ellipsis',
                                                                                overflow: 'hidden',
                                                                                whiteSpace: 'nowrap',
                                                                                marginRight: '5px'
                                                                            }}
                                                                            variant="subtitle2"
                                                                        >
                                                                            {data?.service?.serviceName}
                                                                        </Typography>
                                                                        <Chip size="small" label={data?.workOrderDetail?.workOrderNumber} />
                                                                    </Box>
                                                                </Grid>
                                                                <Grid item xs={1}>
                                                                </Grid>
                                                            </Grid>
                                                        </Box>
                                                        <Box pt={2}>
                                                        </Box>
                                                    </Box>)
                                            })}
                                        </div>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </Box>
                </Fragment>
            </CustomContainer>
            {serviceDetailsShow &&
                <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={serviceDetailsShow}>
                    <CustomDialogHeader title={`${service?.serviceName} Steps`} onClose={() => { setServiceDetailsShow(false) }}></CustomDialogHeader>
                    <Steps
                        workOrderId={workOrderId}
                        selectedService={service}
                        serviceSteps={[]}
                        allowedToEdit={true}
                        setDisableCompleteFail={() => { }}
                        fetchService={fetchWorkOrderTechnician}
                        referencType={"workOrderTechnician"}
                    />
                </Dialog>
            }
        </Fragment>
    );
};

export default WorkOrderTechnician;