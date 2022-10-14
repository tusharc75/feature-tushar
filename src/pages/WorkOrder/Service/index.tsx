import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { QUOTATION_STATUS, repairOrder, workOrder, WORKORDER_SERVICE_STATUS, WORKORDER_SERVICE_STEP_STATUS } from 'src/constants/helpers';
import { Badge, Box, Chip, Dialog, Divider, Grid, IconButton, Menu, MenuItem, Paper, TextField, useMediaQuery } from '@material-ui/core';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import Steps from './Steps';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import Quotation from '../Quotation';
import AssignUserDialog from './AssignUserDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import { GrDrag } from 'react-icons/gr';
import RestoreIcon from '@material-ui/icons/Restore';
import UpdateIcon from '@material-ui/icons/Update';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import PeopleIcon from '@material-ui/icons/People';
import ConsumablesDialog from '../Consumables/ConsumablesDialog';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import { useData } from 'src/StateProvider/Provider';
import Logs from './Logs';
import CompleteDialog from './CompleteDialog';

const Service = ({ workOrderId, allowedToEdit }) => {

  const toastConfig = useContext(CustomToastContext);
  const { state: { user: { user } } } = useData()
  const [serviceSteps, setServiceSteps] = useState(null);
  const [disabledServicesOrder, setDisabledServicesOrder] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceData, setServiceData] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userAssignDialog, setUserAssignDialog] = useState(false);
  const [serviceDialog, setServiceDialog] = useState({ open: false, uniqueId: null, preWork: null });
  const [arrangeView, setArrangeView] = useState(false);
  const [consumablesDialog, setConsumablesDialog] = useState(false);
  const [logsDialog, setLogsDialog] = useState(false);
  const [isColapsed, setIsColapsed] = useState(false);
  const mobScreen = useMediaQuery('(max-width:768px)');
  const [quotationData, setQuotationData] = useState(null);
  const [disableCompleteFail, setDisableCompleteFail] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [comment, setComment] = useState('')

  useEffect(() => {
    fetchService();
    getServiceData();
    fetchQuotationData();
  }, []);

  const fetchService = () => {
    axiosInstance()
      .get(`${routes.workOrder.path}/service/${workOrderId}`)
      .then(({ data: { data } }) => {
        if (data?.length) {
          data?.forEach((e) => {
            e.type = 'service';
          });
          const preWorkService = data?.filter((e) => e.preWork);
          const postWorkService = data?.filter((e) => !e.preWork);
          const quote = [{ _id: 'quotation', uniqueId: 'quotation', order: 9999, type: 'quotation', serviceName: 'Quote' }];
          const services = [...preWorkService, ...quote, ...postWorkService];
          setServiceSteps(services);
          if (services?.length) {
            let pendingServiceIndex = services.findIndex(d => d.status === WORKORDER_SERVICE_STATUS.inProgress)
            if (pendingServiceIndex === -1) {
              pendingServiceIndex = services.findIndex(d => d.status === WORKORDER_SERVICE_STATUS.pending)
            }
            setSelectedService(services[pendingServiceIndex > -1 ? pendingServiceIndex : 0]);
          }

          let tempServiceSortedArray = [...services].sort((a, b) => (a.order > b.order ? -1 : 1));
          let tempServiceIndex = tempServiceSortedArray.findIndex((d) =>
            [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed].includes(d.status)
          );
          if (tempServiceIndex > -1) {
            tempServiceSortedArray[tempServiceIndex - 1]
              ? setDisabledServicesOrder(tempServiceSortedArray[tempServiceIndex - 1]?.order)
              : setDisabledServicesOrder(tempServiceSortedArray[tempServiceIndex]?.order);
          } else {
            setDisabledServicesOrder(tempServiceSortedArray[tempServiceSortedArray.length - 1]?.order);
          }


          if (preWorkService?.filter((d: any) => [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed].includes(d.status))?.length === preWorkService?.length
            && postWorkService?.filter((d: any) => [WORKORDER_SERVICE_STATUS.pending].includes(d.status))?.length === postWorkService?.length) {
            if (services.findIndex(d => d.type === 'quotation') > -1) {
              setSelectedService(services[services.findIndex(d => d.type === 'quotation')])
            }
          }

        } else {
          setServiceSteps([]);
        }
      })
      .catch((err) => {
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
  };

  const fetchQuotationData = () => {
    axiosInstance().get(`${routes.workOrder.path}/${workOrderId}`).then(({ data: { data } }) => {
      axiosInstance().get(`${repairOrder.api}/${data?.repairOrder?.optionValue}/workorder/quotation`)
        .then(({ data: { data } }) => {
          if (data) {
            let keys = Object.keys(data?.versions);
            if (keys?.length) {
              const status = data.versions[parseInt(keys[keys.length - 1])]?.status;
              setQuotationData({ quotationNumber: data?.quotationNumber, status: status })
            }
          }
        })
    })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
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
        uniqueIds: [id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        fetchService();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleArrangeUpdate = (rows: any[]) => {
    rows?.forEach((e: any) => {
      delete e.name;
      delete e.preWork;
    });
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/order`, { data: rows || [] })
      .then(({ data }) => {
        fetchService();
        setArrangeView(false);
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
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${uniqueId}/status`, { status, comment })
      .then(({ data: { data } }) => {
        fetchService();
        if (openCompleteDialog) {
          setOpenCompleteDialog(false)
        }
        setComment("")
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        if (openCompleteDialog) {
          setOpenCompleteDialog(false)
        }
      });
  };

  const handleAddService = (ids, uniqueId) => {
    const data: any = {};
    data.serviceIds = ids;
    if (uniqueId) {
      data.aboveServiceUniqueId = uniqueId;
    }
    axiosInstance()
      .post(`${workOrder.api}/service/${workOrderId}`, data)
      .then(() => {
        fetchService();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleColapse = () => {
    setIsColapsed((prev) => !prev);
  };

  useEffect(() => {
    if (mobScreen) {
      setIsColapsed(false);
    }
  }, [mobScreen]);

  const isAllowedToServiceEdit = (allowedToEdit || selectedService?.assignedUsers?.some((u: any) => u?._id === user?._id))

  const stylesForEveryTab = (selectedService, data) => {
    if (data?.type === 'quotation' && selectedService?.type !== "quotation") {
      return {
        borderColor: 'rgb(224, 224, 224)',
        borderWidth: '1px',
        borderStyle: 'solid',
        backgroundColor: quotationData?.status === QUOTATION_STATUS.acceptByCustomer ? '#E9FFE8' : quotationData?.status === QUOTATION_STATUS.rejectByCustomer ? '#FFE9EA' : 'white',
        cursor: 'pointer',
        borderRadius: '3px'
      };
    }
    else if (data?.type === 'quotation' && selectedService?.type === "quotation") {
      return {
        borderColor: '#329592',
        borderWidth: '1px',
        borderStyle: 'solid',
        backgroundColor: quotationData?.status === QUOTATION_STATUS.acceptByCustomer ? '#E9FFE8' : quotationData?.status === QUOTATION_STATUS.rejectByCustomer ? '#FFE9EA' : 'white',
        cursor: 'pointer',
        boxShadow: 'rgb(0 0 0 / 21%) 0px 25px 20px -20px',
        borderRadius: '3px'
      };
    }
    else if (data?.order > disabledServicesOrder || (data?.preWork === false && quotationData?.status !== QUOTATION_STATUS.acceptByCustomer)) {
      return {
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'rgb(224, 224, 224)',
        cursor: 'not-allowed',
        PointerEvent: 'none',
        opacity: '.5'
      };
    }
    if (selectedService?._id == data?._id) {
      return {
        borderColor: '#329592',
        borderWidth: '1px',
        borderStyle: 'solid',
        backgroundColor: data?.status === WORKORDER_SERVICE_STEP_STATUS.completed ? '#E9FFE8' : data?.status === WORKORDER_SERVICE_STEP_STATUS.failed ? '#FFE9EA' : 'white',
        cursor: 'pointer',
        boxShadow: 'rgb(0 0 0 / 21%) 0px 25px 20px -20px',
        borderRadius: '3px'
      };
    } else {
      return {
        borderWidth: '1px',
        borderStyle: 'solid',
        backgroundColor: data?.status === WORKORDER_SERVICE_STEP_STATUS.completed ? '#E9FFE8' : data?.status === WORKORDER_SERVICE_STEP_STATUS.failed ? '#FFE9EA' : 'white',
        borderColor: 'rgb(224, 224, 224)',
        cursor: 'pointer'
      };
    }
  };

  return (
    <Box p={2}>
      {serviceSteps ? (
        <Grid container spacing={2}>
          <Grid
            item
            xs={12}
            sm={5}
            md={4}
            lg={3}
            style={{ maxWidth: isColapsed ? '76px' : mobScreen ? '100%' : '', flexBasis: isColapsed ? '76px' : mobScreen ? '100%' : '' }}
          >
            <Box mb={1} display="flex" style={{ flexWrap: 'wrap', justifyContent: isColapsed ? 'space-around' : 'flex-end' }}>
              {!isColapsed && (
                <>
                  <Box>
                    {serviceSteps.filter((d) => d.type === 'service')?.length === 0 && (
                      <Button
                        variant="text"
                        color="primary"
                        size="small"
                        onClick={() => setServiceDialog({ open: true, uniqueId: null, preWork: null })}
                      >
                        Add Services
                      </Button>
                    )}
                  </Box>
                  {serviceSteps?.length > 0 && (
                    <Box marginX={2}>
                      <Button disabled={!allowedToEdit} variant="outlined" color="primary" size="small" onClick={() => setArrangeView(true)}>
                        <GrDrag fontSize="small" color="primary" className="mr-1" />
                        Arrange
                      </Button>
                    </Box>
                  )}
                </>
              )}
              {mobScreen || (
                <IconButton size={'small'} onClick={handleColapse}>
                  {isColapsed ? <ArrowForwardIosIcon /> : <ArrowBackIosIcon />}
                </IconButton>
              )}
            </Box>
            <Box
              sx={{ height: mobScreen ? 'unset' : 'calc(100vh - 300px)', display: { xs: 'flex', sm: 'block' } }}
              style={{ overflowX: mobScreen ? 'auto' : 'hidden', overflowY: mobScreen ? 'hidden' : 'auto', marginBottom: mobScreen ? '20px' : '0px' }}
            >
              <Grid
                container
                spacing={2}
                style={{
                  flexDirection: mobScreen ? 'column' : 'row',
                  maxHeight: mobScreen ? '197px' : 'unset',
                  paddingBottom: mobScreen ? '15px' : '0px'
                }}
              >
                {serviceSteps?.map((data, index) => {
                  const style = stylesForEveryTab(selectedService, data);
                  return (
                    <Grid item xs={12} key={index}>
                      <Box
                        style={{
                          ...style,
                          transition: '.3s'
                        }}
                        p={2}
                        onClick={() => {
                          if (!(data?.type !== 'service' ||
                            (data?.order > disabledServicesOrder || (data?.preWork === false && quotationData?.status !== QUOTATION_STATUS.acceptByCustomer)))) {
                            setSelectedService(data);
                          }
                        }}
                      >
                        <Grid container>
                          <Grid item xs={10}>
                            <Box display="flex" sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                              {data?.type === 'service' && (
                                <Box
                                  style={{
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    lineHeight: '20px',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    flexShrink: 0
                                  }}
                                >
                                  {data?.order}
                                </Box>
                              )}
                              {!isColapsed && (
                                <>
                                  <Box ml={'10px'}>
                                    <Typography>{data?.serviceName}</Typography>
                                  </Box>
                                  {data?.type === 'service' && (
                                    <Box ml={1}>
                                      {data?.preWork ? (
                                        <HtmlTooltip title="Pre Work Service">
                                          <RestoreIcon fontSize="small" />
                                        </HtmlTooltip>
                                      ) : (
                                        <HtmlTooltip title="Post Work Service">
                                          <UpdateIcon fontSize="small" />
                                        </HtmlTooltip>
                                      )}
                                    </Box>
                                  )}
                                  {data?.type === 'service' && (
                                    <Box ml={1}>
                                      <Chip label={data?.status} variant="outlined" color="primary" />
                                    </Box>
                                  )}
                                  {data?.type === 'service' && data?.assignedUsers?.length > 0 && (
                                    <Box ml={1}>
                                      <HtmlTooltip title={data?.assignedUsers?.map((e) => e?.optionLabel)?.toString()}>
                                        <PeopleIcon />
                                      </HtmlTooltip>
                                    </Box>
                                  )}
                                  {(data?.type === 'quotation' && quotationData) &&
                                    <Box ml={1}>
                                      <Chip label={`Status : ${quotationData?.status}`} variant="outlined" color="primary" />
                                    </Box>
                                  }
                                </>
                              )}
                            </Box>
                          </Grid>
                          {!isColapsed && (
                            <>
                              {!(data?.type !== 'service' || (data?.order > disabledServicesOrder || (data?.preWork === false && quotationData?.status !== QUOTATION_STATUS.acceptByCustomer))) && (
                                <Grid item xs={2} container justify="flex-end">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    aria-label="delete"
                                    disabled={!isAllowedToServiceEdit}
                                    onClick={(event) => {
                                      handleOpenMenu(event);
                                      setSelectedService(data);
                                    }}
                                  >
                                    <MoreHorizIcon />
                                  </IconButton>
                                </Grid>
                              )}
                            </>
                          )}
                        </Grid>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Grid>
          {
            anchorEl && (
              <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
              >
                <MenuItem
                  disabled={!allowedToEdit}
                  onClick={() => {
                    setUserAssignDialog(true);
                    setAnchorEl(null);
                  }}
                >
                  Assign Users
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setServiceDialog({ open: true, uniqueId: selectedService.uniqueId, preWork: selectedService.preWork });
                    setAnchorEl(null);
                  }}
                >
                  Add Services
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setConsumablesDialog(true);
                    setAnchorEl(null);
                  }}
                >
                  Consume
                </MenuItem>
                <MenuItem
                  disabled={disableCompleteFail || [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed].includes(selectedService?.status)}
                  onClick={() => {
                    updateServiceStatus(selectedService?.uniqueId, WORKORDER_SERVICE_STATUS.completed);
                    setAnchorEl(null);
                  }}
                >
                  Complete
                </MenuItem>
                <MenuItem
                  disabled={disableCompleteFail || [WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed].includes(selectedService?.status)}
                  onClick={() => {
                    updateServiceStatus(selectedService?.uniqueId, WORKORDER_SERVICE_STATUS.failed);
                    setAnchorEl(null);
                  }}
                >
                  Fail
                </MenuItem>
                <MenuItem
                  disabled={!allowedToEdit}
                  onClick={() => {
                    handleRemoveService(selectedService?.uniqueId);
                    setAnchorEl(null);
                  }}
                >
                  Remove
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setLogsDialog(true);
                    setAnchorEl(null);
                  }}
                >
                  Logs
                </MenuItem>
              </Menu>
            )
          }
          <Grid
            item
            xs={12}
            sm={7}
            md={8}
            lg={9}
            style={{
              maxWidth: isColapsed ? 'calc(100% - 76px)' : mobScreen ? '100%' : '',
              flexBasis: isColapsed ? 'calc(100% - 76px)' : mobScreen ? '100%' : ''
            }}
          >
            {selectedService && (
              <Box>
                {selectedService?.type === 'service' ? (
                  <Steps
                    workOrderId={workOrderId}
                    serviceId={selectedService?._id}
                    uniqueId={selectedService?.uniqueId}
                    getServiceData={getServiceData}
                    serviceData={serviceData}
                    serviceSteps={serviceSteps}
                    selectedServiceStatus={selectedService.status}
                    updateServiceStatus={updateServiceStatus}
                    handleAddService={handleAddService}
                    allowedToEdit={isAllowedToServiceEdit}
                    setDisableCompleteFail={setDisableCompleteFail}
                    setOpenCompleteDialog={setOpenCompleteDialog}
                  />
                ) : (
                  <Quotation />
                )}
              </Box>
            )}
          </Grid>
        </Grid >
      ) : (
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {
        userAssignDialog && (
          <AssignUserDialog
            workOrderData={[{
              "uniqueId": selectedService?.uniqueId,
              "workOrderId": workOrderId
            }]}
            assignedUsers={selectedService?.assignedUsers}
            handleClose={() => {
              setUserAssignDialog(false);
            }}
            handleSucess={() => {
              setUserAssignDialog(false);
              fetchService();
            }}
          />
        )
      }
      {
        serviceDialog.open && (
          <AssignServiceDialog
            reference="workorder"
            referenceId={workOrderId}
            handleClose={() => setServiceDialog({ open: false, uniqueId: null, preWork: null })}
            ids={serviceSteps?.filter((e) => e.type === 'service')?.map((e) => e._id)}
            onSuccess={(data) => {
              handleAddService(
                data?.map((e) => e.service),
                serviceDialog.uniqueId
              );
              setServiceDialog({ open: false, uniqueId: null, preWork: null });
            }}
            extraStaticFilter={serviceDialog.preWork === null ? [] : [{ field: 'preWork', term: serviceDialog.preWork }]}
          />
        )
      }
      {
        arrangeView && (
          <ArrangeView
            data={
              serviceSteps
                ?.filter((e) => e.type === 'service')
                ?.map((d) => {
                  return { _id: d?.uniqueId, name: d?.serviceName, order: d?.order, preWork: d?.preWork };
                }) || []
            }
            title={'Arrange'}
            handleClose={() => setArrangeView(false)}
            handleSubmit={handleArrangeUpdate}
            loading={false}
          />
        )
      }
      {
        consumablesDialog && (
          <ConsumablesDialog
            onSuccess={() => {
              setConsumablesDialog(false);
            }}
            handleClose={() => {
              setConsumablesDialog(false);
            }}
            workOrderId={workOrderId}
            from={'service'}
          />
        )
      }
      {logsDialog &&
        <Logs
          workOrderId={workOrderId}
          handleClose={() => {
            setLogsDialog(false);
          }} />
      }
      {openCompleteDialog && (
        <CompleteDialog
          serviceName={selectedService?.serviceName}
          comment={comment}
          setComment={setComment}
          updateStatus={() =>
            updateServiceStatus(selectedService?.uniqueId, WORKORDER_SERVICE_STATUS.completed)
          }
          handleClose={() => {
            setComment("");
            setOpenCompleteDialog(false)
          }}
        />
      )}
    </Box >
  );
};
export default Service;
