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
import BoxWithBorder from 'src/components/BoxWithBorder';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import { findLastIndex } from 'lodash';
import Quotation from '../Quotation';


const Service = ({ workOrderId }) => {
    // hi there

    const toastConfig = useContext(CustomToastContext);
    const [serviceSteps, setServiceSteps] = useState([]);
    const [selectedService, setSelectedService] = useState({ serviceId: null, uniqueId: null, type: null });
    const [serviceData, setServiceData] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [userDialog, setUserDialog] = useState(false);
    const [userList, setUserList] = useState([]);
    const [selectedUserList, setSelectedUserList] = useState([]);
    const [serviceDialog, setServiceDialog] = useState(false);

    useEffect(() => {
        fetchWorkOrderService();
        getServiceData();
        fetchUserList();
    }, []);

    useEffect(() => {
        let tempService = serviceSteps.find(d => d._id === selectedService.serviceId)
        if (tempService?.assignedUsers?.length > 0) {
            setSelectedUserList(userList.filter(d => tempService?.assignedUsers.map(obj => obj?.optionValue).includes(d?.optionValue)))
        }
        else {
            setSelectedUserList([])
        }
    }, [selectedService, serviceSteps]);

    const fetchWorkOrderService = () => {
        axiosInstance().get(`${routes.workOrder.path}/service/${workOrderId}`).then(({ data: { data } }) => {
            if (data?.length && !(selectedService?.serviceId && data?.some(d => d._id === selectedService?.serviceId))) {
                setSelectedService({ serviceId: data[0]._id, uniqueId: data[0].uniqueId, type: "service" })
            }
            let tempArrayService = data.map(element => {
                element["type"] = "service"
                return element
            });
            let tempArrayServiceIndex = findLastIndex([...tempArrayService], d => d.preWork === true)
            tempArrayService.splice(tempArrayServiceIndex + 1, 0, { _id: "quotation", uniqueId: "quotation", type: "quotation", name: "Quote" })
            setServiceSteps(tempArrayService)
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
        let tempUniqueId = serviceSteps.find(d => d._id === selectedService.serviceId)
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
                <Box mb={2} display="flex" justifyContent="flex-end">
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => setServiceDialog(true)}
                    >
                        Add Services
                    </Button>
                </Box>
                <Box>
                    {serviceSteps?.map((data) => (
                        <Box
                            style={selectedService.serviceId == data?._id ? { backgroundColor: "#329592", color: "white", cursor: "pointer" } : { cursor: "pointer" }}
                            border={1}
                            p={2} mb={2}
                            borderColor="grey.300"
                            onClick={() => {
                                setSelectedService({ serviceId: data?._id, uniqueId: data?.uniqueId, type: data?.type })
                            }}>
                            <Grid container>
                                <Grid item xs={10} className="d-flex align-items-center gap-1 ">
                                    <Typography>{data?.serviceName ?? data?.name}</Typography>
                                </Grid>
                                {data?.type === "service" && <Grid item xs={2} container justify="flex-end">
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        aria-label="delete"
                                        onClick={(event) => {
                                            handleOpenMenu(event, data?._id)
                                            setSelectedService({ serviceId: data?._id, uniqueId: data?.uniqueId, type: data?.type })
                                        }}>
                                        <MoreHorizIcon />
                                    </IconButton>
                                </Grid>}
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
                        <MenuItem
                            onClick={() => {
                                let tempUniqueId = serviceSteps.find(d => d._id === selectedService.serviceId)
                                if (tempUniqueId?.uniqueId) {
                                    axiosInstance()
                                        .put(`${workOrder.api}/service/${workOrderId}/remove`, {
                                            "uniqueIds": [tempUniqueId.uniqueId]
                                        })
                                        .then(({ data }) => {
                                            toastConfig.setToastConfig({
                                                open: true,
                                                type: "success",
                                                message: data?.message,
                                            });
                                            fetchWorkOrderService();
                                        })
                                        .catch((err) => {
                                            toastConfig.setToastConfig(err);
                                        });
                                }
                                setAnchorEl(null);
                            }}>
                            Remove
                        </MenuItem>
                    </Menu>
                </Box>
            </Grid>
            <Grid item xs={9}>
                <Box border={1} ml={2} borderColor="grey.300">
                    {selectedService.serviceId && selectedService.type === "service" ?
                        <Steps
                            workOrderId={workOrderId}
                            serviceId={selectedService.serviceId}
                            uniqueId={selectedService.uniqueId}
                            getServiceData={getServiceData}
                            serviceData={serviceData}
                            serviceSteps={serviceSteps}
                            setSelectedService={setSelectedService}
                        />
                        : <Quotation />}
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
        {serviceDialog &&
            <AssignServiceDialog
                reference="workorder"
                referenceId={workOrderId}
                handleClose={() => setServiceDialog(false)}
                ids={[workOrderId]}
                onSuccess={() => {
                    fetchWorkOrderService();
                    setServiceDialog(false);
                }}
            />
        }
    </Box >);
}
export default Service;