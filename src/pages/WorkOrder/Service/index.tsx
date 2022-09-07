import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { workOrder, WORKORDER_SERVICE_COLOR } from 'src/constants/helpers';
import { Badge, Box, Chip, Dialog, Divider, Grid, IconButton, Menu, MenuItem, Paper, TextField } from '@material-ui/core';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import Steps from './Steps';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import { findLastIndex } from 'lodash';
import Quotation from '../Quotation';
import AssignUserDialog from './AssignUserDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import { GrDrag } from 'react-icons/gr';
import RestoreIcon from '@material-ui/icons/Restore';
import UpdateIcon from '@material-ui/icons/Update';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import PeopleIcon from '@material-ui/icons/People';

const Service = ({ workOrderId }) => {

    const toastConfig = useContext(CustomToastContext);
    const [serviceSteps, setServiceSteps] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [serviceData, setServiceData] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [userAssignDialog, setUserAssignDialog] = useState(false);
    const [serviceDialog, setServiceDialog] = useState({ open: false, preWork: false });
    const [arrangeView, setArrangeView] = useState(false);

    useEffect(() => {
        fetchService();
        getServiceData();
    }, []);

    const fetchService = () => {
        axiosInstance().get(`${routes.workOrder.path}/service/${workOrderId}`).then(({ data: { data } }) => {
            if (data?.length) {
                data?.forEach((e) => {
                    e.type = "service";
                })
                let tempArrayServiceIndex = findLastIndex([...data], d => d.preWork === true)
                data.splice(tempArrayServiceIndex + 1, 0, { _id: "quotation", uniqueId: "quotation", type: "quotation", serviceName: "Quote" })
                setServiceSteps(data)
                if (data?.length && selectedService === null) {
                    setSelectedService(data[0])
                }
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

    const handleOpenMenu = (event, _id) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
    };

    const handleRemoveService = (id) => {
        axiosInstance()
            .put(`${workOrder.api}/service/${workOrderId}/remove`, {
                "uniqueIds": [id]
            })
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data?.message,
                });
                fetchService();
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    }

    const handleArrangeUpdate = (rows: any[]) => {
        rows?.forEach((e: any) => {
            delete e.name;
            delete e.preWork;
        });
        axiosInstance()
            .put(`${workOrder.api}/service/${workOrderId}/order`, { data: rows || [] })
            .then(({ data }) => {
                fetchService();
                setArrangeView(false)
                toastConfig.setToastConfig({
                    open: true,
                    message: data.message,
                    severity: 'success'
                });
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const updateServiceStatus = (uniqueId, status) => {
        axiosInstance().put(`${workOrder.api}/service/${workOrderId}/${uniqueId}/status`, { status })
            .then(({ data: { data } }) => {
                fetchService()
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    }

    return (<Box p={2}>
        {serviceSteps ?
            <Grid container>
                <Grid item xs={3}>
                    <Box mb={1} display="flex">
                        <Box flexGrow={1}>
                            {serviceSteps?.length === 0 &&
                                <Button
                                    variant="text"
                                    color="primary"
                                    size="small"
                                    onClick={() => setServiceDialog({ open: true, preWork: false })}
                                >
                                    Add Services
                                </Button>}
                        </Box>
                        <Box>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={() => setArrangeView(true)}>
                                <GrDrag fontSize="small" color="primary" className="mr-1" />
                                Arrange
                            </Button>
                        </Box>
                    </Box>
                    <Box>
                        {serviceSteps?.map((data) => (
                            <Box
                                style={selectedService?._id == data?._id ? {
                                    borderColor: "#329592",
                                    borderWidth: "1px",
                                    borderStyle: 'solid',
                                    backgroundColor: data?.status === "Complete" ? "#E9FFE8" :
                                        data?.status === "Fail" ? "#FFE9EA" : "white",
                                    cursor: "pointer"
                                } : {
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    backgroundColor: data?.status === "Complete" ? "#E9FFE8" :
                                        data?.status === "Fail" ? "#FFE9EA" : "white",
                                    borderColor: "rgb(224, 224, 224)",
                                    cursor: "pointer"
                                }}
                                p={2}
                                mb={2}
                                onClick={() => {
                                    setSelectedService(data)
                                }}>
                                <Grid container>
                                    <Grid item xs={10} >
                                        <Box display="flex">
                                            <Box pt={0.5}>
                                                <Badge badgeContent={data?.order} color="primary"></Badge>
                                            </Box>
                                            <Box ml={3}>
                                                <Typography>{data?.serviceName}</Typography>
                                            </Box>
                                            {data?.type === "service" &&
                                                <Box ml={1}>
                                                    {data?.preWork ?
                                                        <HtmlTooltip title="Pre Work Service">
                                                            <RestoreIcon fontSize="small" />
                                                        </HtmlTooltip>
                                                        :
                                                        <HtmlTooltip title="Post Work Service">
                                                            <UpdateIcon fontSize="small" />
                                                        </HtmlTooltip>
                                                    }
                                                </Box>}
                                            {data?.type === "service" &&
                                                <Box ml={1}>
                                                    <Chip
                                                        label={data?.status}
                                                        variant="outlined"
                                                        color="primary"
                                                    />
                                                </Box>}
                                            {(data?.type === "service" && data?.assignedUsers?.length > 0) &&
                                                <Box ml={1}>
                                                    <HtmlTooltip title={(data?.assignedUsers?.map((e) => e?.optionLabel))?.toString()}>
                                                        <PeopleIcon />
                                                    </HtmlTooltip>
                                                </Box>}
                                        </Box>
                                    </Grid>
                                    {data?.type === "service" &&
                                        <Grid item xs={2} container justify="flex-end">
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                aria-label="delete"
                                                onClick={(event) => {
                                                    handleOpenMenu(event, data?._id)
                                                    setSelectedService(data)
                                                }}>
                                                <MoreHorizIcon />
                                            </IconButton>
                                        </Grid>}
                                </Grid>
                            </Box>
                        ))}
                        <Menu
                            id="simple-menu"
                            anchorEl={anchorEl}
                            keepMounted
                            open={Boolean(anchorEl)}
                            onClose={handleCloseMenu}>
                            <MenuItem
                                onClick={() => {
                                    setUserAssignDialog(true);
                                    setAnchorEl(null);
                                }}>
                                Assign Users
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    setServiceDialog({ open: true, preWork: selectedService.preWork });
                                    setAnchorEl(null);
                                }}>
                                Add Services
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    updateServiceStatus(selectedService?.uniqueId, "Complete")
                                    setAnchorEl(null);
                                }}>
                                Complete
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    updateServiceStatus(selectedService?.uniqueId, "Fail")
                                    setAnchorEl(null);
                                }}>
                                Fail
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    handleRemoveService(selectedService?.uniqueId)
                                    setAnchorEl(null);
                                }}>
                                Remove
                            </MenuItem>
                        </Menu>
                    </Box>
                </Grid>
                <Grid item xs={9}>
                    {selectedService &&
                        <Box border={1} ml={2} borderColor="grey.300">
                            {selectedService?.type === "service" ?
                                <Steps
                                    workOrderId={workOrderId}
                                    serviceId={selectedService?._id}
                                    uniqueId={selectedService?.uniqueId}
                                    getServiceData={getServiceData}
                                    serviceData={serviceData}
                                    serviceSteps={serviceSteps}
                                    setSelectedService={setSelectedService}
                                />
                                : <Quotation />}
                        </Box>
                    }
                </Grid>
            </Grid>
            :
            <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
        }
        {userAssignDialog &&
            <AssignUserDialog
                workOrderId={workOrderId}
                serviceId={selectedService?._id}
                uniqueId={selectedService?.uniqueId}
                assignedUsers={selectedService?.assignedUsers}
                handleClose={() => {
                    setUserAssignDialog(false)
                }}
                handleSucess={() => {
                    setUserAssignDialog(false)
                    fetchService();
                }}
            />
        }
        {serviceDialog.open &&
            <AssignServiceDialog
                reference="workorder"
                referenceId={workOrderId}
                handleClose={() => setServiceDialog({ open: false, preWork: false })}
                ids={[workOrderId]}
                onSuccess={() => {
                    fetchService();
                    setServiceDialog({ open: false, preWork: false });
                }}
                extraStaticFilter={[{ field: 'preWork', term: serviceDialog.preWork }]}
            />
        }
        {arrangeView && (
            <ArrangeView
                data={serviceSteps?.filter((e) => e.type === "service")?.map((d) => {
                    return { _id: d?.uniqueId, name: d?.serviceName, order: d?.order, preWork: d?.preWork };
                }) || []}
                title={'Arrange'}
                handleClose={() => setArrangeView(false)}
                handleSubmit={handleArrangeUpdate}
                loading={false}
            />
        )}
    </Box >);
}
export default Service;