import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { AiOutlinePlus } from 'react-icons/ai';
import Button from '@material-ui/core/Button';
import {
  convertMsToTime,
  getObjKeys,
  getObjKeysWithValues,
  setFieldsInAscendingOrder,
  workOrder,
  WORKORDER_SERVICE_STATUS,
  WORKORDER_SERVICE_STEP_STATUS
} from 'src/constants/helpers';
import {
  Box,
  IconButton,
  Grid,
  Typography,
  Chip,
  Menu,
  MenuItem,
  ClickAwayListener,
  useMediaQuery,
  Checkbox,
  CircularProgress
} from '@material-ui/core';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isEmpty, isEqual, set } from 'lodash';
import StepFieldsDialog from './StepFieldsDialog';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import CompleteDialog from './CompleteDialog';
import { useData } from 'src/StateProvider/Provider';
import StepDialog from 'src/pages/ServiceMaster/Steps/StepDialog';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import AttachmentDialog from './AttachmentDialog';
import InfoIcon from '@material-ui/icons/Info';
import { GrDrag } from 'react-icons/gr';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import ConsumablesDialog from '../Consumables/ConsumablesDialog';
import Comments from './Comments';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import AssignUserDialog from './AssignUserDialog';
import PeopleIcon from '@material-ui/icons/People';

interface StepInterface {
  _id: string;
  stepName: string;
  order: number;
  leadDay: number;
  costPrice: number;
  listPrice: number;
  isPassFail: boolean;
  isPassAddon: boolean;
  passAddon: any[];
  isFailAddon: boolean;
  failAddon: any[];
  isJumpStepPass: boolean;
  jumpStepsPass: any[];
  isJumpStepFail: boolean;
  jumpStepsFail: any[];
  isQuoteRevisionOnFail: boolean;
  returnToServiceOnFail: string;
  isReturnToServiceOnFail: boolean;
  isReturnToStepOnFail: boolean;
  returnToStepOnFail: string;
  customStep: boolean;
  isAllowToPerform: boolean;
}

export interface StepDataInterface {
  _id: string;
  uniqueId: string;
  serviceId: string;
  stepId: string;
  status: string;
  startDate: Date;
  startedBy: EdBy;
  duration: number;
  endDate: Date;
  endedBy: EdBy;
  passFailStatus: string;
}

export interface EdBy {
  optionValue: string;
  optionLabel: string;
}

const TimerComponent = ({ stepData, updateTime = true }) => {
  const [time, setTime] = useState(null);
  useEffect(() => {
    if (!updateTime) {
      setTime(convertMsToTime(stepData?.duration || 0));
    } else {
      setTime(convertMsToTime(stepData?.duration || 0));
    }
    const interval = setInterval(() => {
      if (updateTime)
        setTime(convertMsToTime((stepData?.duration || 0) + (new Date().getTime() - new Date(stepData?.pauseDate || stepData?.startDate).getTime())));
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [stepData]);

  return (
    <Box
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        fontWeight: 500,
        fontSize: '14px',
        lineHeight: '10px',
        color: '#8B8B8B'
      }}
    >
      <AccessTimeIcon style={{ marginRight: '3px', color: 'gray', fontSize: '1rem' }} />({time})
    </Box>
  );
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      height: 'calc(100vh - 265px)',
      overflowY: 'auto',
      ['@media (max-width:767px)']: {
        height: 'calc(100vh - 364px)'
      },
      ['@media (max-width: 600px)']: {
        height: 'calc(100vh - 368px)'
      }
    },
    backButton: {
      marginRight: theme.spacing(1)
    },
    heading: {
      fontSize: theme.typography.pxToRem(16)
    },
    accordion: {
      border: '1px solid var(--common-border-color)',
      '&::before': {
        content: 'unset !important',
        display: 'none'
      },
      '&.Mui-expanded': {
        margin: '15px 0'
      },
      marginBottom: '15px',
      '&:last-child': {
        marginBottom: '1px'
      },
      boxShadow: 'none !important'
    },
    accordionHeading: {
      padding: '16px 16px 16px 16px',
      ['@media (min-width:768px)']: {
        padding: '16px 20px 16px 16px'
      },
      ['@media (min-width:1024px)']: {
        padding: '16px 40px 16px 16px'
      },

      '& > div': {
        alignItems: 'center',
        justifyContent: 'space-between'
      }
      // '&:first-of-type': {
      //   borderRadius: '8px 8px 0 0'
      // }
      // '&:last-of-type': {
      //   borderRadius: '0 0 8px 8px'
      // }
    },
    badge: {
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
      fontSize: '10px'
    },
    green: {
      backgroundColor: 'rgba(0,255,0,.1)'
    },
    red: {
      backgroundColor: 'rgba(255,0,0,.1)'
    },
    white: {
      backgroundColor: 'var(--dark-secondary, white)'
    },
    checkbox: {
      padding: '0',
      color: '#000000',
      '&.Mui-checked': {
        color: '#000000'
      }
    },
    stepButtons: {
      borderRadius: '14px !important',
      padding: '2px 14px'
    },
    passButton: {
      border: '1px solid #4bae4f !important'
    },
    failButton: {
      border: '1px solid #FF8F87 !important'
    },
    stepTags: {
      minHeight: '26px',
      paddingInline: '5px',
      fontWeight: 500
    },
    mainContainer: {
      ['@media (max-width:768px)']: {
        marginBottom: '70px'
      }
    }
  })
);

const Steps = ({
  workOrderId,
  warehouse,
  selectedService,
  allowedToEdit,
  setDisableCompleteFail,
  fetchService,
  referencType,
  stepSubmitedData,
  handelClose = null
}) => {
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);

  const [serviceDetails, setServiceDetails] = useState(null);
  const [addServiceConfirmation, setAddServiceConfirmation] = useState({ open: false, status: '', services: [], step: null, type: '' });
  const [stepState, setStepState] = useState(null);
  const [arrangeView, setArrangeView] = useState(false);
  const [comment, setComment] = useState('');
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [assignSteps, setAssignSteps] = useState(false);
  const [commentsDialog, setCommentsDialog] = useState(false);
  const [userAssignDialog, setUserAssignDialog] = useState(false);
  const mobScreen = useMediaQuery('(max-width:768px)');

  const {
    state: {
      user: { user }
    }
  } = useData();
  const [viewStep, setViewStep] = React.useState({ open: false, step: null });
  const [isAllStepDone, setIsAllStepDone] = React.useState(false);
  const [attchmentsDialog, setAttchmentsDialog] = useState({ open: false, uniqueServiceId: null, stepId: null, serviceName: null, stepName: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [fieldDialog, setFieldDialog] = useState(false);
  const [isFieldDialogEditable, setIsFieldDialogEditable] = useState(true);
  const [consumablesDialog, setConsumablesDialog] = useState({ open: false, uniqueId: null, service: null, stepId: null, serviceName: null });
  const selectedServiceRef = React.useRef(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState({ open: false, loading: false, steps: [] });
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [isCompleteAllLoading, setIsCompleteAllLoading] = useState(false);

  useEffect(() => {
    if ((!selectedServiceRef.current || selectedServiceRef.current !== selectedService._id) && selectedService._id) {
      selectedServiceRef.current = selectedService._id;
      setServiceDetails(null);
      setSelectedSteps([]);
    }
    fetchServiceData();
  }, [selectedService]);

  const fetchServiceData = async () => {
    setSelectedSteps([]);

    const serviceDetailResponse = await axiosInstance().get(`${workOrder.api}/service/detail/${selectedService._id}/${workOrderId}`);
    var serviceDetail = serviceDetailResponse?.data?.data;
    serviceDetail.steps = serviceDetail?.steps?.sort((a, b) => a?.order - b?.order);

    if (user?.brandPolicy?.workOrderStepSequence) {
      serviceDetail.steps?.forEach((ele, index) => {
        ele.isAllowToPerform = false;
        if (index === 0) {
          ele.isAllowToPerform = true;
        } else if (index > 0) {
          const prevStep = serviceDetail?.steps[index - 1];
          const prevStepData = stepSubmitedData?.find(
            (d) => d.uniqueId === selectedService?.uniqueId && d.serviceId === selectedService._id && d.stepId === prevStep?._id
          );
          const currStepData = stepSubmitedData?.find(
            (d) => d.uniqueId === selectedService?.uniqueId && d.serviceId === selectedService._id && d.stepId === ele?._id
          );
          if (prevStepData?.passFailStatus || currStepData?.passFailStatus) {
            ele.isAllowToPerform = true;
          }
          if (prevStep?.order === ele?.order) {
            const stepOfFirstOrder = serviceDetail?.steps?.find((e) => e.order === ele?.order);
            if (stepOfFirstOrder?.isAllowToPerform) {
              ele.isAllowToPerform = true;
            }
          }
        }
      });
    } else {
      serviceDetail.steps?.forEach((ele) => {
        ele.isAllowToPerform = true;
        ele.isAllowToCheck = stepSubmitedData?.find(
          (d) => d.uniqueId === selectedService?.uniqueId && d.serviceId === selectedService._id && d.stepId === ele?._id
        ) ? false : true;
      });
    }

    setServiceDetails(serviceDetail);

    if (serviceDetail?.steps?.length) {
      const completedSteps = stepSubmitedData.filter(
        (d) =>
          d.uniqueId === selectedService?.uniqueId &&
          d.serviceId === selectedService._id &&
          [
            WORKORDER_SERVICE_STEP_STATUS.passed,
            WORKORDER_SERVICE_STEP_STATUS.completed,
            WORKORDER_SERVICE_STEP_STATUS.failed,
            WORKORDER_SERVICE_STEP_STATUS.skipped,
            WORKORDER_SERVICE_STEP_STATUS.end
          ].includes(d?.passFailStatus)
      );

      const allStepsDone = isEqual(completedSteps.map((d) => d.stepId).sort(), serviceDetail?.steps?.map((d) => d._id).sort());

      setDisableCompleteFail(!allStepsDone);
      setIsAllStepDone(allStepsDone);

      if (allStepsDone && [WORKORDER_SERVICE_STATUS.inProgress, WORKORDER_SERVICE_STATUS.pending].includes(selectedService.status)) {
        setOpenCompleteDialog(true);
      }
    }
  };

  const updateServiceStatus = (uniqueId, status, handelClose = null) => {
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${uniqueId}/status`, { status, comment })
      .then(({ data: { data } }) => {
        fetchService();
        if (openCompleteDialog) {
          setOpenCompleteDialog(false);
        }
        setComment('');
        if (handelClose) {
          handelClose();
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        if (openCompleteDialog) {
          setOpenCompleteDialog(false);
        }
      });
  };

  const handleAddStep = (values: any) => {
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/add-step`, values)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        setAssignSteps(false);
        fetchService();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddService = (ids, step) => {
    const data: any = {};
    data.serviceIds = ids;
    if (selectedService?.uniqueId) {
      data.aboveServiceUniqueId = selectedService?.uniqueId;
      data.createdFromStep = step?._id;
    }
    axiosInstance()
      .post(`${workOrder.api}/service/${workOrderId}`, data)
      .then(() => {
        setAddServiceConfirmation({ open: false, services: [], status: '', step: null, type: '' });
        fetchService();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleStepUpdate = (rows: any[]) => {
    axiosInstance()
      .put(`${workOrder.api}/steps-order/${workOrderId}/${selectedService._id}`, { data: rows || [] })
      .then(({ data }) => {
        fetchServiceData();
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

  const getFields = (step) => {
    let stepData = null;
    let fieldData = { fields: [], formsData: [], values: {} };
    let fieldsDataForCreate = step?.fields ? step?.fields : [];
    let tempServiceData = stepSubmitedData?.find((d) => d.uniqueId === selectedService?.uniqueId && d.stepId === step?._id);

    if (tempServiceData) {
      stepData = tempServiceData;
      if (step?.fields?.length) {
        fieldData = {
          fields: fieldsDataForCreate,
          formsData: setFieldsInAscendingOrder(fieldsDataForCreate),
          values: getObjKeysWithValues(tempServiceData, fieldsDataForCreate)
        };
      }
    } else {
      if (step?.fields?.length) {
        fieldData = {
          fields: fieldsDataForCreate,
          formsData: setFieldsInAscendingOrder(fieldsDataForCreate),
          values: getObjKeys('', fieldsDataForCreate)
        };
      }
    }

    let isStepValid = true;
    let givenValues = {};
    const requiredFields = fieldsDataForCreate.filter((f) => f.required);

    requiredFields.forEach((f) => {
      if (fieldData.values[f.fieldName]) {
        givenValues[f.fieldName] = fieldData.values[f.fieldName];
      } else {
        if (givenValues[f.fieldName]) delete givenValues[f.fieldName];
      }
    });

    if (requiredFields.length === Object.keys(givenValues).length) {
      isStepValid = true;
    } else {
      isStepValid = false;
    }

    return { fieldData, stepData, isStepValid };
  };

  const handleSubmit = async (values, step) => {
    let tempData = {
      uniqueId: selectedService?.uniqueId,
      serviceId: selectedService._id,
      stepId: step?._id
    };
    axiosInstance()
      .put(`${workOrder.api}/update-steps-data/${workOrderId}`, { ...tempData, ...values })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setSelectedStep(null);
        setFieldDialog(false);
        fetchService();
        if (step?.isPassFail) {
          const type = automatePassFail(values, step);
          handlePassFail(type, step);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const automatePassFail = (values: any, step: any): string => {
    const fields = getFields(step).fieldData?.fields.filter((field) => field.type === 'decimal');
    let invalidValues: any = {};
    const keys = Object.keys(values);
    keys.forEach((k) => {
      const field = fields.find((f: any) => f?.fieldName === k);
      if (field && field.fieldName === k) {
        if (parseFloat(values[k]) > field?.maxValue || parseFloat(values[k]) < field?.minValue) {
          invalidValues[k] = 'Invalid value';
        } else if (invalidValues[k]) {
          delete invalidValues[k];
        }
      }
    });
    return Object.keys(invalidValues).length > 0 ? WORKORDER_SERVICE_STEP_STATUS.failed : WORKORDER_SERVICE_STEP_STATUS.passed;
  };

  const handleStartEnd = (type, stepId) => {
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/step/${type}`, {
        uniqueId: selectedService?.uniqueId,
        serviceId: selectedService._id,
        stepId: stepId
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchService();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handlePassFail = (type, step) => {
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/step/pass-fail`, {
        uniqueId: selectedService?.uniqueId,
        serviceId: selectedService._id,
        stepId: step._id,
        passFailStatus: type
      })
      .then(({ data }) => {
        const result = data?.data;
        if (type === WORKORDER_SERVICE_STEP_STATUS.passed && result?.isPassAddon && result?.passAddon?.length) {
          if (referencType === 'workOrderTechnician') {
            handleAddService(
              result?.passAddon?.map((e) => e._id),
              step
            );
          } else {
            setAddServiceConfirmation({
              open: true,
              status: WORKORDER_SERVICE_STEP_STATUS.passed,
              services: result?.passAddon,
              step: step,
              type: ''
            });
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isFailAddon && result?.failAddon?.length) {
          if (referencType === 'workOrderTechnician') {
            handleAddService(
              result?.failAddon?.map((e) => e._id),
              step
            );
          } else {
            setAddServiceConfirmation({
              open: true,
              status: WORKORDER_SERVICE_STEP_STATUS.failed,
              services: result?.failAddon,
              step: step,
              type: ''
            });
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.passed && result?.isJumpStepPass && result?.jumpStepsPass?.length) {
          if (referencType !== 'workOrderTechnician') {
            setAddServiceConfirmation((s) => ({ ...s, status: WORKORDER_SERVICE_STEP_STATUS.passed, open: true, type: 'jumpStep' }));
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isJumpStepFail && result?.jumpStepsFail?.length) {
          if (referencType !== 'workOrderTechnician') {
            setAddServiceConfirmation((s) => ({ ...s, status: WORKORDER_SERVICE_STEP_STATUS.failed, open: true, type: 'jumpStep' }));
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isQuoteRevisionOnFail) {
          if (referencType !== 'workOrderTechnician') {
            setAddServiceConfirmation((s) => ({ ...s, status: WORKORDER_SERVICE_STEP_STATUS.failed, open: true, type: 'isQuoteRevisionOnFail' }));
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isReturnToStepOnFail && result?.returnToStepOnFail) {
          if (referencType !== 'workOrderTechnician') {
            const returnStep = serviceDetails?.steps?.find((e) => e._id === result?.returnToStepOnFail) || {};
            setAddServiceConfirmation((s) => ({
              ...s,
              status: WORKORDER_SERVICE_STEP_STATUS.failed,
              open: true,
              type: 'returnToStepOnFail',
              step: returnStep
            }));
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.passed && result?.isSkipServiceOnPass && !isEmpty(result?.skipServiceOnPass)) {
          setAddServiceConfirmation((s) => ({
            ...s,
            status: WORKORDER_SERVICE_STEP_STATUS.passed,
            open: true,
            type: 'skipServices',
            services: result?.skipServiceOnPass
          }));
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isSkipServiceOnFail && !isEmpty(result?.skipServiceOnFail)) {
          setAddServiceConfirmation((s) => ({
            ...s,
            status: WORKORDER_SERVICE_STEP_STATUS.failed,
            open: true,
            type: 'skipServices',
            services: result?.skipServiceOnFail
          }));
        }
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchService();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handlePauseResume = (statusType, stepData) => {
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/step/pause-resume`, {
        uniqueId: stepData?.uniqueId,
        id: stepData?._id,
        serviceId: stepData?.serviceId,
        stepId: stepData?.stepId,
        status: statusType
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchService();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleUpdateStep = (values: any) => {
    values.order = viewStep?.step?.order;
    axiosInstance()
      .put(`${workOrder.api}/service/${workOrderId}/${selectedService?.uniqueId}/update-step`, values)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setViewStep({ open: false, step: null });
        fetchService();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    setSelectedStep(null);
  };

  const isAllChecked = (): boolean => {
    return selectedSteps.length === serviceDetails?.steps?.filter((e) => e?.isAllowToCheck).length
      && selectedSteps.length > 0 ? true : false;
  };

  const checkAll = (): void => {
    if (isAllChecked()) {
      setSelectedSteps([]);
    } else {
      const stepsToSelect = serviceDetails?.steps?.filter((e) => e?.isAllowToCheck).map((i) => i._id);
      setSelectedSteps(stepsToSelect);
    }
  };


  const completeAllSteps = async () => {
    setIsCompleteAllLoading(true);
    const payload = {
      stepids: selectedSteps,
      uniqueId: selectedService?.uniqueId,
      serviceId: selectedService?._id
    };
    axiosInstance().put(`${workOrder.api}/${workOrderId}/multiple-step-complete`, payload)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchService();
        fetchServiceData();
        setSelectedSteps([]);
        setIsCompleteAllLoading(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const deleteSteps = () => {
    setShowDeleteConfirmBox((prev) => ({ ...prev, loading: true }));
    const payload = {
      serviceUniqueId: selectedService?.uniqueId,
      steps: showDeleteConfirmBox.steps.map((item) => item._id)
    };
    axiosInstance().put(`${workOrder.api}/${workOrderId}/step/remove`, payload)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowDeleteConfirmBox({ open: false, loading: false, steps: [] });
        fetchServiceData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };


  return serviceDetails ? (
    serviceDetails?.steps?.length ? (
      <Box className={classes.mainContainer} sx={{ position: 'relative', overflow: 'hidden' }}>
        <div className="flex justify-between items-center gap-[8px] p-[8px] flex-wrap">
          <div className="flex items-center gap-[15px] flex-wrap pl-2">
            {allowedToEdit && serviceDetails?.steps?.some((e) => e?.isAllowToCheck) &&
              <>
                <label htmlFor="select-all" className={`cursor-pointer`}>
                  <Checkbox
                    id="select-all"
                    color="primary"
                    checked={isAllChecked()}
                    onChange={() => checkAll()} />
                  <span className="font-medium select-none">Select All</span>
                </label>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  disabled={selectedSteps.length ? false : true}
                  onClick={completeAllSteps}
                >
                  Complete
                  {isCompleteAllLoading ?
                    <CircularProgress size={20} className="ml-[8px]" /> : `(${isAllChecked() ? 'All' : selectedSteps.length})`}
                </Button>
              </>
            }
          </div>
          <div className={`d-flex flex-wrap align-center justify-end gap-[8px] ml-auto ${serviceDetails?.steps?.length ? 'h-auto' : 'h-[500]'}`}>
            {referencType !== 'workOrderTechnician' && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                disabled={[WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed, WORKORDER_SERVICE_STATUS.skipped].includes(
                  selectedService?.status
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setAssignSteps(true);
                }}
                startIcon={<AiOutlinePlus />}
              >
                Add Steps
              </Button>
            )}
            {serviceDetails?.steps?.length > 0 && referencType !== 'workOrderTechnician' && (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                disabled={[WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed, WORKORDER_SERVICE_STATUS.skipped].includes(
                  selectedService?.status
                )}
                onClick={() => setArrangeView(true)}
              >
                <GrDrag fontSize="small" color="primary" className="mr-1" />
                Arrange
              </Button>
            )}
          </div>
        </div>
        <div className={classes.root}>
          {serviceDetails?.steps?.map((step, index) => {
            const { stepData, isStepValid } = getFields(step);
            if (referencType === 'workOrderTechnician' && stepData?.passFailStatus === WORKORDER_SERVICE_STEP_STATUS.skipped) {
              return '';
            }
            let isAnyTechnician = selectedService?.assignedUsers?.length ? true : false;
            let isMeTechnician = selectedService?.assignedUsers?.find((u) => u?.optionValue === user?._id) || false;
            if (referencType === 'workOrderTechnician') {
              isMeTechnician = true;
            }
            return (
              <Box
                key={`${step._id}_${selectedService?.uniqueId}}`}
                border={1}
                borderColor={'var(--common-border-color)'}
                style={{
                  cursor: !stepData?.status ? 'default' : 'pointer',
                  transition: 'all .5s ease',
                  backgroundColor: selectedStep?._id === step._id && fieldDialog ? '#ecfdf7' : ''
                }}
                className={`${classes.accordionHeading}  ${classes.white}`}
              >
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }} gridGap={'8px'}>
                  {allowedToEdit && serviceDetails?.steps?.some((e) => e?.isAllowToCheck) &&
                    <Checkbox
                      name={`checkbox_${step._id}`}
                      color={"primary"}
                      disabled={step?.isAllowToCheck ? false : true}
                      className={`${!step?.isAllowToCheck ? 'opacity-0' : ''}`}
                      checked={selectedSteps.find((e) => e === step._id) ? true : false}
                      onChange={() => {
                        if (selectedSteps.find((e) => e === step._id)) {
                          setSelectedSteps(selectedSteps.filter((e) => e !== step._id));
                        } else {
                          setSelectedSteps([...selectedSteps, step._id]);
                        }
                      }}
                    />
                  }
                  <Box
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      flexBasis: 'calc(100% - 155px)'
                    }}
                    className="mr-auto"
                    gridGap={'8px'}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }} gridGap={'8px'}>
                      <Box>
                        <Chip
                          color="primary"
                          label={referencType === 'workOrderTechnician' ? step?.order : `${selectedService?.order}.${step?.order || index + 1}`}
                        />
                      </Box>
                      <Box>
                        <Typography className={classes.heading} style={{ fontWeight: '600' }}>
                          {step.stepName}
                        </Typography>
                      </Box>
                      {step?.assignedUsers?.length > 0 && (
                        <Box ml={1}>
                          <HtmlTooltip title={step?.assignedUsers?.map((e) => e?.optionLabel)?.toString()}>
                            <PeopleIcon style={{ color: 'var(--primary)', maxWidth: '22px' }} />
                          </HtmlTooltip>
                        </Box>
                      )}
                    </Box>
                    <Box style={{ display: 'flex', alignItems: 'center', flexBasis: mobScreen ? '100%' : 'unset', flexWrap: 'wrap' }}>
                      {step?.isAllowToPerform && (
                        <Box
                          sx={{
                            justifyContent: mobScreen ? 'flex-start' : 'flex-end',
                            marginLeft: mobScreen ? '0' : 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                          }}
                          gridGap={'8px'}
                        >
                          {stepData?.startDate && user?.brandPolicy?.workOrderTimer && (
                            <TimerComponent
                              stepData={stepData}
                              updateTime={stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start ? true : false}
                            />
                          )}
                          {[
                            WORKORDER_SERVICE_STEP_STATUS.start,
                            WORKORDER_SERVICE_STEP_STATUS.pause,
                            WORKORDER_SERVICE_STEP_STATUS.needReperform
                          ].includes(stepData?.status) &&
                            (isMeTechnician || !isAnyTechnician) &&
                            (stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start && !user?.brandPolicy?.workOrderTimer ? null : (
                              <Button
                                variant="outlined"
                                className={classes.stepButtons}
                                color="secondary"
                                size="small"
                                disabled={!allowedToEdit}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if ([WORKORDER_SERVICE_STEP_STATUS.pause, WORKORDER_SERVICE_STEP_STATUS.needReperform].includes(stepData?.status)) {
                                    handlePauseResume(WORKORDER_SERVICE_STEP_STATUS.start, stepData);
                                  } else if (stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start) {
                                    handlePauseResume(WORKORDER_SERVICE_STEP_STATUS.pause, stepData);
                                  }
                                }}
                              >
                                {stepData?.status === WORKORDER_SERVICE_STEP_STATUS.pause
                                  ? 'Resume'
                                  : stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start
                                    ? 'Pause'
                                    : 'Restart'}
                              </Button>
                            ))}
                          {!stepData?.startDate && (isMeTechnician || !isAnyTechnician) ? (
                            <Button
                              variant="outlined"
                              color="secondary"
                              className={classes.stepButtons}
                              size="small"
                              disabled={!allowedToEdit}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (selectedService.status === WORKORDER_SERVICE_STATUS.pending) {
                                  updateServiceStatus(selectedService?.uniqueId, WORKORDER_SERVICE_STATUS.inProgress);
                                }
                                handleStartEnd(WORKORDER_SERVICE_STEP_STATUS.start, step._id);
                              }}
                            >
                              Start
                            </Button>
                          ) : stepData?.passFailStatus ? (
                            <RenderPassFailChip status={stepData?.passFailStatus} className={classes.stepTags} />
                          ) : stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start && isStepValid && (isMeTechnician || !isAnyTechnician) ? (
                            step?.isPassFail ? (
                              <>
                                <Button
                                  variant="outlined"
                                  disabled={!allowedToEdit}
                                  size="small"
                                  className={`${classes.stepButtons} ${classes.passButton}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePassFail(WORKORDER_SERVICE_STEP_STATUS.passed, step);
                                  }}
                                >
                                  Pass
                                </Button>
                                <Button
                                  variant="outlined"
                                  className={`${classes.stepButtons} ${classes.failButton}`}
                                  disabled={!allowedToEdit}
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePassFail(WORKORDER_SERVICE_STEP_STATUS.failed, step);
                                  }}
                                >
                                  Fail
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="outlined"
                                  color="secondary"
                                  size="small"
                                  disabled={!allowedToEdit}
                                  className={classes.stepButtons}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePassFail(WORKORDER_SERVICE_STEP_STATUS.completed, step);
                                  }}
                                >
                                  Complete
                                </Button>
                              </>
                            )
                          ) : null}
                          {stepData?.status &&
                            ![WORKORDER_SERVICE_STEP_STATUS.pause, WORKORDER_SERVICE_STEP_STATUS.needReperform].includes(stepData?.status) &&
                            ![WORKORDER_SERVICE_STEP_STATUS.skipped].includes(stepData?.passFailStatus) &&
                            (isMeTechnician || !isAnyTechnician) ? (
                            [
                              WORKORDER_SERVICE_STEP_STATUS.passed,
                              WORKORDER_SERVICE_STEP_STATUS.failed,
                              WORKORDER_SERVICE_STEP_STATUS.completed
                            ]?.includes(stepData?.passFailStatus) ? (
                              <>
                                <Button
                                  variant="outlined"
                                  color="inherit"
                                  size="small"
                                  disabled={!allowedToEdit}
                                  className={classes.stepButtons}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEnd('reopen', step._id);
                                  }}
                                >
                                  Re-Open/Test
                                </Button>
                              </>
                            ) : step?.fields?.length ? (
                              <>
                                <Button
                                  variant="outlined"
                                  color="inherit"
                                  size="small"
                                  className={classes.stepButtons}
                                  disabled={!allowedToEdit}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedStep(step);
                                    setFieldDialog(true);
                                    setIsFieldDialogEditable(true);
                                    setStepState(stepData);
                                  }}
                                >
                                  Enter Value
                                </Button>
                              </>
                            ) : null
                          ) : null}
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Box display={'flex'} alignItems={'center'} gridGap={8}>
                    {stepData?.status && (
                      <IconButton
                        aria-label="info"
                        size="small"
                        color="primary"
                        disabled={stepData?.status ? false : true}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStep(step);
                          setFieldDialog(true);
                          setStepState(stepData);
                          setIsFieldDialogEditable(false);
                        }}
                      >
                        <InfoIcon fontSize="inherit" />
                      </IconButton>
                    )}

                    <IconButton
                      size="small"
                      color="primary"
                      aria-label="delete"
                      disabled={!allowedToEdit}
                      onClick={(event) => {
                        handleOpenMenu(event);
                        setSelectedStep(step);
                      }}
                    >
                      <MoreHorizIcon />
                    </IconButton>
                    <HtmlTooltip title="Delete" placement="top" arrow>
                      <IconButton
                        size="small"
                        color="inherit"
                        style={{ color: 'red' }}
                        aria-label="delete"
                        disabled={
                          !allowedToEdit ||
                          [
                            WORKORDER_SERVICE_STEP_STATUS.passed,
                            WORKORDER_SERVICE_STEP_STATUS.failed,
                            WORKORDER_SERVICE_STEP_STATUS.completed
                          ].includes(stepData?.passFailStatus)
                        }
                        onClick={() => setShowDeleteConfirmBox((prev) => ({ ...prev, open: true, steps: [step] }))}
                      >
                        <DeleteOutlineIcon style={{ fontSize: '20px' }} />
                      </IconButton>
                    </HtmlTooltip>
                  </Box>
                </Box>
              </Box>
            );
          })}
          {anchorEl && (
            <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setAttchmentsDialog({
                    open: true,
                    uniqueServiceId: selectedService.uniqueId,
                    stepId: selectedStep?._id,
                    serviceName: selectedService.serviceName,
                    stepName: selectedStep.stepName
                  });
                  setAnchorEl(null);
                }}
              >
                Upload Documents
              </MenuItem>
              {(referencType === 'workOrder' || (referencType === 'workOrderTechnician' && user?.brandPolicy?.workOrderTechnicianConsumable)) && (
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setConsumablesDialog({
                      open: true,
                      uniqueId: selectedService.uniqueId,
                      service: selectedService._id,
                      stepId: selectedStep?._id,
                      serviceName: `${selectedService.serviceName} - ${selectedStep.stepName}`
                    });
                    setAnchorEl(null);
                  }}
                >
                  Add/Consume Products
                </MenuItem>
              )}
              {referencType !== 'workOrderTechnician' && (
                <MenuItem
                  disabled={Boolean(getFields(selectedStep)?.stepData?.startDate)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserAssignDialog(true);
                    setAnchorEl(null);
                  }}
                >
                  Assign Technicians
                </MenuItem>
              )}
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setCommentsDialog(true);
                  setAnchorEl(null);
                }}
              >
                Comments
              </MenuItem>
              {referencType !== 'workOrderTechnician' && (
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnchorEl(null);
                    setViewStep({ open: true, step: selectedStep });
                  }}
                >
                  Properties
                </MenuItem>
              )}
            </Menu>
          )}
          {isAllStepDone && [WORKORDER_SERVICE_STATUS.inProgress, WORKORDER_SERVICE_STATUS.pending].includes(selectedService.status) && (
            <Box pt={2}>
              <Grid container justify="flex-end">
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenCompleteDialog(true);
                  }}
                >
                  Complete
                </Button>
              </Grid>
            </Box>
          )}
        </div>

        {fieldDialog && (
          <StepFieldsDialog
            workOrderId={workOrderId}
            fieldData={getFields(selectedStep)?.fieldData}
            handleClose={() => {
              setSelectedStep(null);
              setFieldDialog(false);
              fetchServiceData();
            }}
            referencType={referencType}
            handleSubmit={handleSubmit}
            selectedService={selectedService}
            allowedToEdit={allowedToEdit}
            step={selectedStep}
            stepData={stepState}
            eidtable={isFieldDialogEditable}
          />
        )}
        {commentsDialog && (
          <Comments
            workOrderId={workOrderId}
            uniqueId={selectedService?.uniqueId}
            serviceName={selectedService?.serviceName}
            stepId={selectedStep?._id}
            handleClose={() => {
              setCommentsDialog(false);
            }}
          />
        )}
        {openCompleteDialog && (
          <CompleteDialog
            serviceName={selectedService?.serviceName}
            comment={comment}
            setComment={setComment}
            updateStatus={() => {
              updateServiceStatus(selectedService?.uniqueId, WORKORDER_SERVICE_STATUS.completed, handelClose);
            }}
            handleClose={() => {
              setComment('');
              setOpenCompleteDialog(false);
            }}
          />
        )}
        {arrangeView && (
          <ArrangeView
            data={
              serviceDetails?.steps?.map((d) => {
                return { _id: d?._id, name: d?.stepName, order: d?.order };
              }) || []
            }
            title={'Arrange'}
            handleClose={() => setArrangeView(false)}
            handleSubmit={handleStepUpdate}
            loading={false}
          />
        )}
        {addServiceConfirmation.open && (
          <ConfirmationDialog
            open={true}
            message={
              addServiceConfirmation.type === 'skipServices'
                ? `As per the logic applied on this step, service${addServiceConfirmation?.services?.length > 1 ? 's' : ''
                }  ${addServiceConfirmation?.services?.map((e) => e?.serviceName || '')?.toString()} has been skipped. Do you want to Skip ? `
                : addServiceConfirmation.type === 'returnToStepOnFail'
                  ? `As per the logic applied on this step, we need to return to step ${addServiceConfirmation.step?.stepName || ''
                  }. Do you want to continue ?`
                  : addServiceConfirmation.type === 'isQuoteRevisionOnFail'
                    ? ` Step fail requires Quote Revision. Do you confirm on this?`
                    : addServiceConfirmation.type === 'jumpStep'
                      ? ` As per the logic applied on this step, we will skip few steps in this service. Do you want to continue?`
                      : `As per the logic applied on this step, a new service  ${addServiceConfirmation.services
                        ?.map((e) => e.serviceName)
                        ?.toString()} has been added. Do you want to Add ? `
            }
            onClose={() => {
              setAddServiceConfirmation({ open: false, services: [], status: '', step: null, type: '' });
            }}
            onOk={() => {
              if (addServiceConfirmation.type === '') {
                handleAddService(
                  addServiceConfirmation.services?.map((e) => e._id),
                  addServiceConfirmation.step
                );
              }
              setAddServiceConfirmation({ open: false, services: [], status: '', step: null, type: '' });
            }}
          />
        )}
        {viewStep.open && (
          <StepDialog
            handleClose={() => {
              setViewStep({ open: false, step: null });
            }}
            handleSucess={(data) => {
              handleUpdateStep(data);
            }}
            stepId={viewStep.step?._id}
            stepData={viewStep.step}
            notEditable={viewStep.step?.customStep === true ? false : true}
            steps={serviceDetails?.steps}
            reference={'workOrder'}
            workOrderId={workOrderId}
            serviceId={selectedService?._id}
            uniqueId={selectedService?.uniqueId}
          />
        )}
        {attchmentsDialog.open && (
          <AttachmentDialog
            workOrderId={workOrderId}
            uniqueServiceId={attchmentsDialog.uniqueServiceId}
            stepId={attchmentsDialog.stepId}
            serviceName={attchmentsDialog.serviceName}
            stepName={attchmentsDialog.stepName}
            handleClose={() => {
              setAttchmentsDialog({ open: false, uniqueServiceId: null, stepId: null, serviceName: null, stepName: null });
            }}
            handleSuccess={() => { }}
          />
        )}
        {consumablesDialog.open && (
          <ConsumablesDialog
            onSuccess={() => {
              setConsumablesDialog({ open: false, uniqueId: null, service: null, stepId: null, serviceName: null });
            }}
            handleClose={() => {
              setConsumablesDialog({ open: false, uniqueId: null, service: null, stepId: null, serviceName: null });
            }}
            workOrderId={workOrderId}
            service={consumablesDialog.service}
            uniqueId={consumablesDialog.uniqueId}
            stepId={consumablesDialog.stepId}
            serviceName={consumablesDialog.serviceName}
            warehouse={warehouse}
          />
        )}
        {userAssignDialog && (
          <AssignUserDialog
            workOrderData={{
              workOrderId: workOrderId
            }}
            assignedUsers={selectedStep?.assignedUsers}
            reference={"steps"}
            referenceData={{
              stepId: selectedStep?._id,
              serviceUniqueId: selectedService?.uniqueId,
            }}
            handleClose={() => {
              setUserAssignDialog(false);
            }}
            handleSucess={() => {
              setUserAssignDialog(false);
              fetchService()
            }}
          />
        )}
        {assignSteps && (
          <StepDialog
            handleClose={() => {
              setAssignSteps(false);
            }}
            handleSucess={(data) => {
              handleAddStep(data);
            }}
            stepId={''}
            steps={serviceDetails?.steps}
            reference={'workOrder'}
            workOrderId={workOrderId}
            serviceId={selectedService?._id}
            uniqueId={selectedService?.uniqueId}
          />
        )}
        {showDeleteConfirmBox.open && (
          <ConfirmationDialog
            open={showDeleteConfirmBox.open}
            message={`Are you sure you want to delete ${showDeleteConfirmBox.steps.map((item) => item.stepName).join(', ')}?`}
            onClose={() => {
              setShowDeleteConfirmBox({ open: false, loading: false, steps: [] });
            }}
            okBtnLoading={showDeleteConfirmBox.loading}
            onOk={() => {
              deleteSteps();
            }}
          />
        )}
      </Box>
    ) : (
      <>
        <Box textAlign="center" p={2}>
          {referencType !== 'workOrderTechnician' && (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              disabled={[WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed, WORKORDER_SERVICE_STATUS.skipped].includes(
                selectedService?.status
              )}
              onClick={(e) => {
                e.stopPropagation();
                setAssignSteps(true);
              }}
              startIcon={<AiOutlinePlus />}
            >
              Add Steps
            </Button>
          )}
        </Box>
        {assignSteps && (
          <StepDialog
            handleClose={() => {
              setAssignSteps(false);
            }}
            handleSucess={(data) => {
              handleAddStep(data);
            }}
            stepId={''}
            steps={serviceDetails?.steps}
            reference={'workOrder'}
            workOrderId={workOrderId}
            serviceId={selectedService?._id}
            uniqueId={selectedService?.uniqueId}
          />
        )}
      </>
    )
  ) : (
    <Box m={2} height={500}>
      <CommonSkeleton lenArray={[...Array(10).keys()]} />
    </Box>
  );
};

export default Steps;

export const RenderPassFailChip = ({ status, className = '', ...others }) => {
  return (
    <Chip
      className={className}
      label={status}
      variant="outlined"
      {...others}
      style={{
        border: 0,
        background: [WORKORDER_SERVICE_STEP_STATUS.passed, WORKORDER_SERVICE_STEP_STATUS.completed].includes(status)
          ? '#e1fce3'
          : WORKORDER_SERVICE_STEP_STATUS.skipped === status
            ? '#D3D3D3'
            : '#FAD9D4',
        color: [WORKORDER_SERVICE_STEP_STATUS.passed, WORKORDER_SERVICE_STEP_STATUS.completed].includes(status)
          ? '#048e0a'
          : WORKORDER_SERVICE_STEP_STATUS.skipped === status
            ? 'inherit'
            : '#D13925'
      }}
    />
  );
};
