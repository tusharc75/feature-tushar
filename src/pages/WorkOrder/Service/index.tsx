import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Formik, Form } from "formik";
import { CustomDialogTransition, dateTimeFormat, getObjKeys, getObjKeysWithValues, workOrder } from 'src/constants/helpers';
import { Box, Dialog, Divider, Grid, IconButton, Menu, MenuItem, Paper, TextField } from '@material-ui/core';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import moment from 'moment';
import routes from 'src/components/Helpers/Routes';
import Steps from './Steps';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import Autocomplete from '@material-ui/lab/Autocomplete/Autocomplete';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';


const Service = ({ workOrderId }) => {
  // hi there

    const toastConfig = useContext(CustomToastContext);
    const [serviceSteps, setServiceSteps] = useState([]);
    const [serviceId, setServiceId] = useState(null);
    const [serviceData, setServiceData] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [userDialog, setUserDialog] = useState(false);
    const [userList, setUserList] = useState([]);
    const [selectedUserList, setSelectedUserList] = useState([]);

    useEffect(() => {
        fetchWorkOrderService();
        getServiceData();
        fetchUserList();
    }, []);

    useEffect(() => {
        let tempService = serviceSteps.find(d => d._id === serviceId)
        if (tempService?.assignedUsers?.length > 0) {
            let xxx = userList.filter(d => tempService?.assignedUsers.map(obj => obj?.optionValue).includes(d?.optionValue))
            setSelectedUserList(userList.filter(d => tempService?.assignedUsers.map(obj => obj?.optionValue).includes(d?.optionValue)))
        }
        else {
            setSelectedUserList([])
        }
    }, [serviceId, serviceSteps]);

    const fetchWorkOrderService = () => {
        axiosInstance().get(`${routes.workOrder.path}/service/${workOrderId}`).then(({ data: { data } }) => {
            setServiceSteps(data)
            if (!serviceId && data?.length) {
                setServiceId(data[0]._id)
            }
        }).catch((err) => {
            toastConfig.setToastConfig(err);
        });
    };

    const getServiceData = () => {
        axiosInstance()
            .get(`${workOrder.api}/${workOrderId}/steps-data`)
            .then(({ data: { data } }) => {
                setServiceData(data);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    }

    const handleAssignUser = () => {
        let tempUniqueId = serviceSteps.find(d => d._id === serviceId)
        if (tempUniqueId?.uniqueId) {
            axiosInstance()
                .put(`${workOrder.api}/service/${workOrderId}/assign-user`, {
                    "users": selectedUserList.map(d => d.optionValue),
                    "uniqueIds": [tempUniqueId.uniqueId]
                })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: data?.message,
                    });
                    setUserDialog(false);
                    fetchWorkOrderService();
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                });
        }
    }

    const fetchUserList = () => {
        axiosInstance()
            .get(`sa-formbuilder/lookup?lookupResource=User`)
            .then(({ data: { data } }) => {
                setUserList(data['User']);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    }

    const handleOpenMenu = (event, _id) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
    };

    return (<Box p={2}>
        <Grid container>
            <Grid item xs={3}>
                <Box>
                    {serviceSteps?.map((data) => (
                        <Box
                            style={serviceId == data?._id ? { backgroundColor: "#329592", color: "white", cursor: "pointer" } : { cursor: "pointer" }}
                            border={1}
                            p={2} mb={2}
                            borderColor="grey.300"
                            onClick={() => { setServiceId(data?._id) }}>
                            <Grid container>
                                <Grid item xs={10} className="d-flex align-items-center gap-1 ">
                                    <Typography>{data?.serviceName}</Typography>
                                </Grid>
                                <Grid item xs={2} container justify="flex-end">
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        aria-label="delete"
                                        onClick={(event) => {
                                            setServiceId(data?._id)
                                            handleOpenMenu(event, data?._id)
                                        }}>
                                        <MoreHorizIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Box>
                    ))}
                    <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                        <MenuItem
                            onClick={() => {
                                setUserDialog(true)
                                setAnchorEl(null);
                            }}>
                            Assign Users
                        </MenuItem>
                    </Menu>
                </Box>
            </Grid>
            <Grid item xs={9}>
                <Box border={1} ml={2} borderColor="grey.300">
                    {serviceId &&
                        <Steps
                            workOrderId={workOrderId}
                            serviceId={serviceId}
                            getServiceData={getServiceData}
                            serviceData={serviceData}
                            serviceSteps={serviceSteps}
                            setServiceId={setServiceId}
                        />}
                </Box>
            </Grid>
        </Grid>
        {userDialog &&
            <Dialog
                maxWidth="sm"
                fullScreen={isMobile || isTablet}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                open={true}
                fullWidth
                onClose={() => setUserDialog(false)}
            >
                <CustomDialogHeader
                    onClose={() => setUserDialog(false)}
                    title={`Assign Users`}
                    showRequiredLabel={false}
                    showManimizeMaximize={false}
                />
                <CustomDialogContent>
                    <Box m={1}>
                        <Autocomplete
                            size="small"
                            options={userList}
                            multiple
                            value={selectedUserList}
                            onChange={(_, val) => {
                                setSelectedUserList(val);
                            }}
                            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                            getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                            renderInput={(props) => (
                                <TextField
                                    {...props}
                                    placeholder={''}
                                    variant="outlined"
                                    name="userList"
                                    label={'Select Users'}
                                />
                            )}
                        />
                    </Box>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => setUserDialog(false)}
                    >
                        Cancel
                    </Button>
                    <CustomButton
                        variant="contained"
                        color="primary"
                        type="submit"
                        disabled={selectedUserList.length === 0}
                        onClick={(e) => {
                            e.preventDefault();
                            handleAssignUser()
                        }}
                    > Save</CustomButton>
                </CustomDialogFooter>
            </Dialog>
        }
    </Box >);
}
export default Service;