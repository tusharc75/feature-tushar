import React, { useContext, useEffect, useMemo, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { AiOutlinePlus } from 'react-icons/ai';
import Button from '@material-ui/core/Button';
import { AccessTime, Info, DragIndicator, MoreHoriz, DeleteOutline, People, FileCopyOutlined, LowPriority } from '@material-ui/icons';
import {
  convertMsToTime,
  getChipColor,
  getObjKeys,
  getObjKeysWithValues,
  repairJob,
  setFieldsInAscendingOrder,
  sidebarResource,
  WORK_ORDER_STATUS,
  WORK_ORDER_TYPE,
  workOrder,
  WORKORDER_SERVICE_STATUS,
  WORKORDER_SERVICE_STEP_STATUS
} from 'src/constants/helpers';
import { Box, IconButton, Grid, Typography, Chip, Menu, MenuItem, useMediaQuery, Checkbox } from '@material-ui/core';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isArray, isEmpty, isEqual } from 'lodash';
import StepFieldsDialog from './StepFieldsDialog';
import CompleteDialog from './CompleteDialog';
import { useData } from 'src/StateProvider/Provider';
import StepDialog from 'src/pages/ServiceMaster/Steps/StepDialog';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import AttachmentDialog from './AttachmentDialog';
import ConsumablesDialog from '../Consumables/ConsumablesDialog';
import Comments from './Comments';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import AssignUserDialog from './AssignUserDialog';
import AssignWorkStationDialog from './AssignWorkStationDialog';
import { WorkStations } from 'src/assets/svg/svgIcons';
import DiagramDialog from '../Diagram/DiagramDialog';
import ServiceFieldValueDialog from './ServiceFieldValueDialog';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import routes from 'src/components/Helpers/Routes';
import ManageRepairJob from 'src/pages/RepairJob/ManageRepairJob';

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
      <AccessTime style={{ marginRight: '3px', color: 'gray', fontSize: '1rem' }} />({time})
    </Box>
  );
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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
    }
  })
);

const Steps = ({
  workOrderData,
  selectedService,
  allowedToEdit,
  fetchService,
  resource,
  stepSubmitedData,
  handelClose = null,
  minHeightClass = null,
  isMobile,
  fetchWorkOrderData = null
}) => {
  const workOrderId = workOrderData?._id;
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);

  const [serviceDetails, setServiceDetails] = useState(null);
  const [addServiceConfirmation, setAddServiceConfirmation] = useState({ open: false, status: '', services: [], step: null, type: '' });
  const [stepState, setStepState] = useState(null);
  const [arrangeView, setArrangeView] = useState(false);
  const [comment, setComment] = useState('');
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [commentsDialog, setCommentsDialog] = useState(false);
  const [userAssignDialog, setUserAssignDialog] = useState(false);
  const [workStationAssignDialog, setWorkStationAssignDialog] = useState(false);
  const mobScreen = useMediaQuery('(max-width:768px)');

  const [addNewStep, setAddNewStep] = useState({ open: false, clone: false, cloneStepData: null });

  const [showDrawing, setShowDrawing] = useState(false);
  const [openServiceFieldValueDialig, setOpenServiceFieldValueDialig] = useState(false);
  const [isEditableServiceFieldValueDialog, setIsEditableServiceFieldValueDialog] = useState(false);

  const {
    state: {
      user: { user },
      permissions,
      resources
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
  const [reOpenServiceDialog, setReOpenServiceDialog] = useState({ open: false, type: null, step: null });
  const [loadingStep, setLoadingStep] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showManageRepairJobDialog, setShowManageRepairJobDialog] = useState(false);
  const [repairJobReceiveConfirmation, setRepairJobReceiveConfirmation] = useState(false);
  const [isSubmittingReceavingAsset, setIsSubmittingReceavingAsset] = useState(false);

  useEffect(() => {
    if ((!selectedServiceRef.current || selectedServiceRef.current !== selectedService.uniqueId) && selectedService.uniqueId) {
      selectedServiceRef.current = selectedService.uniqueId;
      setServiceDetails(null);
      setSelectedSteps([]);
    }
    fetchServiceData();
  }, [selectedService]);

  const fetchServiceData = async () => {
    setSelectedSteps([]);

    const serviceDetailResponse = await axiosInstance().get(
      `${workOrder.api}/service/detail/${workOrderId}/${selectedService._id}/${selectedService.uniqueId}`
    );
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
        if (ele?.assignedUsers?.length) {
          if (ele?.assignedUsers?.map((e) => e.optionValue)?.includes(user?._id)) {
            ele.isAllowToPerform = true;
          } else {
            ele.isAllowToPerform = false;
          }
        } else {
          ele.isAllowToPerform = true;
        }
        ele.isAllowToCheck = stepSubmitedData?.find(
          (d) => d.uniqueId === selectedService?.uniqueId && d.serviceId === selectedService._id && d.stepId === ele?._id
        )
          ? stepSubmitedData?.find((s) => s.stepId === ele?._id)?.status !== WORKORDER_SERVICE_STEP_STATUS.start
            ? false
            : ele?.fields?.some((_f) => _f?.required)
              ? ele?.fields
                  ?.filter((_f) => _f?.required)
                  ?.map((f) => f?.fieldName)
                  ?.every((_fieldName) => stepSubmitedData?.find((s) => s.stepId === ele?._id)[_fieldName])
                ? true
                : false
              : true
          : ele.isAllowToPerform;
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
      setIsAllStepDone(allStepsDone);

      if (
        allStepsDone &&
        [WORKORDER_SERVICE_STATUS.inProgress, WORKORDER_SERVICE_STATUS.pending].includes(selectedService.status) &&
        addNewStep.open === false
      ) {
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
        setAddNewStep({ open: false, clone: false, cloneStepData: null });
        fetchService();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddService = (ids, step) => {
    const data: any = {};
    data.serviceIds = ids?.map((e) => {
      return { _id: e, qty: 1 };
    });
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
    let fieldData = { fields: [], formsData: [], values: {}, orignalValues: {} };
    let fieldsDataForCreate = step?.fields ? step?.fields : [];
    let tempServiceData = stepSubmitedData?.find((d) => d.uniqueId === selectedService?.uniqueId && d.stepId === step?._id);

    if (tempServiceData) {
      stepData = tempServiceData;
      if (step?.fields?.length) {
        let isDataAlreadyAdded = false;
        const fieldNames = step?.fields?.map((e) => e.fieldName);
        for (var key in tempServiceData) {
          if (fieldNames?.includes(key)) {
            isDataAlreadyAdded = true;
          }
        }
        fieldData = {
          fields: fieldsDataForCreate,
          formsData: setFieldsInAscendingOrder(fieldsDataForCreate),
          orignalValues: tempServiceData,
          values: isDataAlreadyAdded ? getObjKeysWithValues(tempServiceData, fieldsDataForCreate, true) : getObjKeys('', fieldsDataForCreate)
        };
      }
    } else {
      if (step?.fields?.length) {
        fieldData = {
          fields: fieldsDataForCreate,
          formsData: setFieldsInAscendingOrder(fieldsDataForCreate),
          orignalValues: {},
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

    const fields = fieldData.fields;
    let canSkip = true;

    for (const field of fields) {
      if (field.required === true) {
        canSkip = false;
        break;
      }
    }

    return { fieldData, stepData, isStepValid, canSkip };
  };

  const getNextStep = (currentStep: any): any | null => {
    const allSteps = serviceDetails?.steps;
    const currentStepIndex = allSteps?.findIndex((step) => step?._id === currentStep?._id);
    if (currentStepIndex === -1 || currentStepIndex === allSteps?.length - 1) return null;
    const nextStep = allSteps[currentStepIndex + 1];
    const { stepData } = getFields(nextStep);
    return (nextStep?.assignedUsers?.length && !nextStep?.assignedUsers?.map((u) => u?.optionValue).includes(user?._id)) ||
      nextStep?.isPassFail ||
      stepData?.status === WORKORDER_SERVICE_STEP_STATUS.end
      ? null
      : { step: nextStep, stepData: stepData };
  };

  const handleSubmit = async (values, step, autoComplete = false, nextStep = false) => {
    setIsSubmitting(true);
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
        if (step?.isPassFail) {
          const type = automatePassFail(values, step);
          if (type !== '') {
            handlePassFail(type, step);
          }
        }
        if (autoComplete && !nextStep) {
          handlePassFail(WORKORDER_SERVICE_STEP_STATUS.completed, step);
          setSelectedStep(null);
          setFieldDialog(false);
        } else if (autoComplete && nextStep) {
          if (autoComplete) {
            handlePassFail(WORKORDER_SERVICE_STEP_STATUS.completed, step);
          }
          const nextStepData = getNextStep(step);
          if (!nextStepData?.stepData) {
            handleStartEnd(WORKORDER_SERVICE_STEP_STATUS.start, nextStepData?.step, nextStepData?.stepData);
          } else if (nextStepData?.stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start) {
            setSelectedStep(nextStepData?.step);
            setFieldDialog(true);
            setIsFieldDialogEditable(true);
            setStepState(nextStepData?.stepData);
          }
        } else {
          setSelectedStep(null);
          setFieldDialog(false);
        }
        setIsSubmitting(false);
        fetchService();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const automatePassFail = (values: any, step: any): string => {
    const fields = getFields(step).fieldData?.fields.filter((field) => field.type === 'decimal');
    if (!fields?.find((e) => e?.isMinMaxValue)) {
      return '';
    }
    let invalidValues: any = {};
    const keys = Object.keys(values);
    keys.forEach((k) => {
      const field = fields.find((f: any) => f?.fieldName === k);
      if (field && field.fieldName === k && field?.isMinMaxValue) {
        if (parseFloat(values[k]) > field?.maxValue || parseFloat(values[k]) < field?.minValue) {
          invalidValues[k] = 'Invalid value';
        } else if (invalidValues[k]) {
          delete invalidValues[k];
        }
      }
    });
    return Object.keys(invalidValues).length > 0 ? WORKORDER_SERVICE_STEP_STATUS.failed : WORKORDER_SERVICE_STEP_STATUS.passed;
  };

  const handleStartEnd = (type, step, stepData = null) => {
    setLoadingStep(true);
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/step/${type}`, {
        uniqueId: selectedService?.uniqueId,
        serviceId: selectedService._id,
        stepId: step._id
      })
      .then(({ data }) => {
        setLoadingStep(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchService();
        setReOpenServiceDialog({ open: false, type: null, step: null });
        if (type === WORKORDER_SERVICE_STEP_STATUS.start && step?.fields?.length) {
          setSelectedStep(step);
          setFieldDialog(true);
          setIsFieldDialogEditable(true);
          setStepState(stepData);
        }
      })
      .catch((error) => {
        setLoadingStep(false);
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
          if (resource === sidebarResource.workOrderTechnician) {
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
          if (resource === sidebarResource.workOrderTechnician) {
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
          if (resource === sidebarResource.workOrder) {
            setAddServiceConfirmation((s) => ({ ...s, status: WORKORDER_SERVICE_STEP_STATUS.passed, open: true, type: 'jumpStep' }));
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isJumpStepFail && result?.jumpStepsFail?.length) {
          if (resource === sidebarResource.workOrder) {
            setAddServiceConfirmation((s) => ({ ...s, status: WORKORDER_SERVICE_STEP_STATUS.failed, open: true, type: 'jumpStep' }));
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isQuoteRevisionOnFail) {
          if (resource === sidebarResource.workOrder) {
            setAddServiceConfirmation((s) => ({ ...s, status: WORKORDER_SERVICE_STEP_STATUS.failed, open: true, type: 'isQuoteRevisionOnFail' }));
          }
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isReturnToStepOnFail && result?.returnToStepOnFail) {
          if (resource === sidebarResource.workOrder) {
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
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.passed && result?.isAddStepsOnPass) {
          setAddNewStep({ open: true, clone: false, cloneStepData: null });
        } else if (type === WORKORDER_SERVICE_STEP_STATUS.failed && result?.isAddStepsOnFail) {
          setAddNewStep({ open: true, clone: false, cloneStepData: null });
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
      });
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, step) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedStep({ ...step, stepData: getFields(step)?.stepData });
  };

  const handleCloseMenu = (event) => {
    event.stopPropagation();
    setAnchorEl(null);
    setSelectedStep(null);
  };

  const isAllChecked = (): boolean => {
    return selectedSteps.length === serviceDetails?.steps?.filter((e) => e?.isAllowToCheck).length && selectedSteps.length > 0 ? true : false;
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
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/multiple-step-complete`, payload)
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
        setIsCompleteAllLoading(false);
      });
  };

  const deleteSteps = () => {
    setShowDeleteConfirmBox((prev) => ({ ...prev, loading: true }));
    const payload = {
      serviceUniqueId: selectedService?.uniqueId,
      steps: showDeleteConfirmBox.steps.map((item) => item._id)
    };
    axiosInstance()
      .put(`${workOrder.api}/${workOrderId}/step/remove`, payload)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowDeleteConfirmBox({ open: false, loading: false, steps: [] });
        fetchService();
        fetchServiceData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const cloneStep = (step) => {
    const payload = {
      workOrderId: workOrderId,
      uniqueId: selectedService?.uniqueId,
      stepId: step?._id
    };
    setLoadingStep(true);
    axiosInstance()
      .put(`${workOrder.api}/step/clone-step`, payload)
      .then(({ data }) => {
        setLoadingStep(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setReOpenServiceDialog({ open: false, type: null, step: null });
        fetchService();
        fetchServiceData();
      })
      .catch((error) => {
        setLoadingStep(false);
        toastConfig.setToastConfig(error);
      });
  };

  let isStepsAllowToPerform = false;
  if (selectedService?.assignedUsers?.length) {
    isStepsAllowToPerform = selectedService?.assignedUsers?.find((u) => u?.optionValue === user?._id) ? true : false;
  } else if (
    isArray(selectedService?.competencies) &&
    isArray(user?.competencies) &&
    selectedService?.competencies?.filter((e) => user?.competencies?.includes(e))?.length
  ) {
    isStepsAllowToPerform = true;
  } else if (allowedToEdit) {
    isStepsAllowToPerform = true;
  }

  const handleAddAssetInRepairJob = (data) => {
    axiosInstance()
      .put(`${repairJob.api}/add-assets-create-ticket`, {
        repairJob: data?._id,
        assets: workOrderData?.serializedAsset ? [workOrderData?.serializedAsset?.optionValue] : []
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowManageRepairJobDialog(false);
        if (fetchWorkOrderData) {
          fetchWorkOrderData();
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleReceiveAssetInRepairJob = () => {
    setIsSubmittingReceavingAsset(true);
    axiosInstance()
      .put(`${repairJob.api}/receive-assets-complete`, { repairJob: workOrderData?.currentRepairJob?.optionValue || workOrderData?.currentRepairJob })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setRepairJobReceiveConfirmation(false);
        setIsSubmittingReceavingAsset(false);
        if (fetchWorkOrderData) {
          fetchWorkOrderData();
        }
      })
      .catch((error) => {
        setIsSubmittingReceavingAsset(false);
        toastConfig.setToastConfig(error);
      });
  };

  const leftSideContents = useMemo(() => {
    return (
      <>
        {permissions?.repairJob?.isCreate &&
          resource === sidebarResource.workOrderTechnician &&
          workOrderData?.status !== WORK_ORDER_STATUS.completed &&
          workOrderData?.type === WORK_ORDER_TYPE.repairOrder &&
          (workOrderData?.currentRepairJob ? (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={(e) => {
                setRepairJobReceiveConfirmation(true);
              }}
            >
              Receive Asset From Supplier
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={(e) => {
                setShowManageRepairJobDialog(true);
              }}
            >
              {`Create ${resources?.repairJob?.titleSingular}`}
            </Button>
          ))}
        {resource === sidebarResource.workOrderTechnician && workOrderData?.type === WORK_ORDER_TYPE.productionOrder && (
          <ThemeButton
            color="primary"
            size="small"
            iconForMobile={false}
            onClick={() => {
              setShowDrawing(true);
            }}
            borderColor="none"
          >
            Drawings
          </ThemeButton>
        )}
      </>
    );
  }, [resource, workOrderData?.type, workOrderData?.currentRepairJob]);

  const rightSideContents = useMemo(() => {
    return (
      <>
        {serviceDetails?.fields?.length > 0 && (
          <>
            {serviceDetails?.serviceFieldsValue ? (
              <IconButton
                aria-label="info"
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenServiceFieldValueDialig(true);
                }}
              >
                <Info fontSize="inherit" />
              </IconButton>
            ) : (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                disabled={
                  allowedToEdit &&
                  ![WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed, WORKORDER_SERVICE_STATUS.skipped].includes(
                    selectedService?.status
                  )
                    ? false
                    : true
                }
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenServiceFieldValueDialig(true);
                  setIsEditableServiceFieldValueDialog(true);
                }}
              >
                Enter Value
              </Button>
            )}
          </>
        )}
        {serviceDetails?.steps?.length > 0 && resource === sidebarResource.workOrder && (
          <ThemeButton
            iconForMobile={<LowPriority />}
            disabled={
              allowedToEdit &&
              ![WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed, WORKORDER_SERVICE_STATUS.skipped].includes(
                selectedService?.status
              )
                ? false
                : true
            }
            onClick={() => setArrangeView(true)}
            tooltip="Arrange"
          >
            <DragIndicator className="mr-1" fontSize="small" />
            Arrange
          </ThemeButton>
        )}
      </>
    );
  }, [
    allowedToEdit,
    resource,
    selectedService?.status,
    serviceDetails?.fields?.length,
    serviceDetails?.serviceFieldsValue,
    serviceDetails?.steps?.length
  ]);

  const actionButtonMenuItems = useMemo(() => {
    return (
      <>
        <MenuItem
          disabled={
            allowedToEdit &&
            serviceDetails?.steps?.filter((d) => selectedSteps?.includes(d?._id))?.every((element) => element?.isAllowToCheck === true)
              ? false
              : true
          }
          onClick={() => {
            setShowDeleteConfirmBox((prev) => ({
              ...prev,
              open: true,
              steps: serviceDetails?.steps?.filter((d) => selectedSteps?.includes(d?._id))
            }));
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  }, [allowedToEdit, selectedSteps, serviceDetails?.steps]);
  return (
    <>
      {serviceDetails ? (
        serviceDetails?.steps?.length ? (
          <Box className={`relative overflow-hidden max-[768px]:mb-[70px]`}>
            <div className={`flex flex-wrap items-center justify-between p-[8px]`}>
              <div className="flex flex-wrap items-center gap-[8px] pl-2">
                {allowedToEdit && serviceDetails?.steps?.some((e) => e?.isAllowToCheck) ? (
                  <>
                    <label htmlFor="select-all" className={`cursor-pointer`}>
                      <Checkbox id="select-all" color="primary" checked={isAllChecked()} onChange={() => checkAll()} />
                      <span className={`select-none font-medium ${isMobile ? 'sr-only' : ''}`}>Select All</span>
                    </label>
                    {isStepsAllowToPerform && (
                      <>
                        <ThemeButton
                          iconForMobile={false}
                          onClick={completeAllSteps}
                          isLoading={isCompleteAllLoading}
                          disabled={selectedSteps.length ? false : true}
                          borderColor="none"
                          color="primary"
                          className={isMobile ? '' : 'ml-2'}
                        >
                          Complete {`(${isAllChecked() ? 'All' : selectedSteps.length})`}
                        </ThemeButton>
                      </>
                    )}
                  </>
                ) : null}
              </div>
              {isMobile ? null : <h6 className="ml-2 mr-auto text-[16px]">Steps</h6>}
              <div className={`d-flex align-center ml-auto flex-wrap justify-end gap-[8px] ${serviceDetails?.steps?.length ? 'h-auto' : 'h-[500]'}`}>
                <DetailsPageHeader
                  isAddButtonVisible={resource === sidebarResource.workOrder}
                  addButtonProps={{
                    onClick: (e) => {
                      e.stopPropagation();
                      setAddNewStep({ open: true, clone: false, cloneStepData: null });
                    },
                    disabled:
                      allowedToEdit &&
                      ![WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed, WORKORDER_SERVICE_STATUS.skipped].includes(
                        selectedService?.status
                      )
                        ? false
                        : true,
                    placement: 'right'
                  }}
                  isActionButtonVisible
                  actionButtonMenuItems={actionButtonMenuItems}
                  actionButtonProps={{ disabled: selectedSteps?.length ? false : true }}
                  leftSideContents={leftSideContents}
                  rightSideContents={rightSideContents}
                  hasXpadding={false}
                />
              </div>
            </div>
            <div
              className={`w-full ${
                minHeightClass ? minHeightClass : 'h-[calc(100vh-265px)] '
              } overflow-y-auto max-[767px]:h-[calc(100vh-364px)] max-[600px]:h-[calc(100vh-368px)]`}
            >
              {serviceDetails?.steps?.map((step, index) => {
                const { stepData, isStepValid } = getFields(step);
                if (resource === sidebarResource.workOrderTechnician && stepData?.passFailStatus === WORKORDER_SERVICE_STEP_STATUS.skipped) {
                  return '';
                }
                step.idx = resource === sidebarResource.workOrderTechnician ? step?.order : `${selectedService?.order}.${step?.order || index + 1}`;
                return (
                  <Box
                    key={step._id}
                    border={1}
                    borderColor={'var(--common-border-color)'}
                    className={`${classes.accordionHeading}  ${classes.white} ${
                      !stepData?.status ? '' : 'cursor-pointer'
                    } transition-all duration-500 ${selectedStep?._id === step._id && fieldDialog ? 'bg[var(--accordion-summary-bg,_#ecfdf7)]' : ''}`}
                  >
                    <Box sx={{ display: 'flex' }} gridGap={'8px'}>
                      {allowedToEdit && serviceDetails?.steps?.some((e) => e?.isAllowToCheck) ? (
                        <Checkbox
                          name={`checkbox_${step._id}`}
                          color={'primary'}
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
                      ) : null}
                      <span className="rounded-full bg-[var(--primary)] px-[12px] py-[1px] text-[13px] text-white dark:bg-[var(--dark-primary)]">
                        {resource === sidebarResource.workOrderTechnician ? step?.order : `${selectedService?.order}.${step?.order || index + 1}`}
                      </span>
                      <Box
                        className={`mr-auto flex basis-[calc(100%-56px)] flex-wrap items-center justify-between gap-[8px] sm:basis-[calc(100%-155px)]`}
                        gridGap={'8px'}
                      >
                        <Box className="flex flex-grow items-center gap-2 text-[var(--primary-text)]">
                          <div className="flex w-full items-start gap-2">
                            <h6
                              title={step.stepName}
                              className={`${classes.heading} flex-grow [word-break:break-all] max-md:line-clamp-[1]`}
                              style={{ fontWeight: '600' }}
                            >
                              {step.stepName}
                            </h6>
                            {mobScreen && (
                              <div className="flex min-w-fit flex-wrap items-center md:gap-2">
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
                                    <Info fontSize="inherit" />
                                  </IconButton>
                                )}
                                <HtmlTooltip title="Actions">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    aria-label="delete"
                                    disabled={!allowedToEdit}
                                    onClick={(event) => {
                                      handleOpenMenu(event, step);
                                    }}
                                  >
                                    <MoreHoriz />
                                  </IconButton>
                                </HtmlTooltip>
                                {allowedToEdit && ![WORKORDER_SERVICE_STATUS.skipped].includes(selectedService?.status) ? (
                                  <HtmlTooltip enterTouchDelay={0} title="Clone" placement="top" arrow>
                                    <IconButton
                                      size="small"
                                      color="inherit"
                                      aria-label="Clone"
                                      onClick={() => {
                                        if (selectedService?.status === WORKORDER_SERVICE_STATUS.completed) {
                                          setReOpenServiceDialog({ open: true, type: 'clone', step: step });
                                        } else {
                                          cloneStep(step);
                                        }
                                      }}
                                    >
                                      <FileCopyOutlined style={{ fontSize: '18px' }} />
                                    </IconButton>
                                  </HtmlTooltip>
                                ) : null}
                                <HtmlTooltip title="Delete" enterTouchDelay={0} placement="top" arrow>
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
                                        WORKORDER_SERVICE_STEP_STATUS.completed,
                                        WORKORDER_SERVICE_STEP_STATUS.skipped
                                      ].includes(stepData?.passFailStatus)
                                    }
                                    onClick={() => setShowDeleteConfirmBox((prev) => ({ ...prev, open: true, steps: [step] }))}
                                  >
                                    <DeleteOutline style={{ fontSize: '20px' }} />
                                  </IconButton>
                                </HtmlTooltip>
                              </div>
                            )}
                          </div>
                          {step?.assignedUsers?.length > 0 && (
                            <HtmlTooltip enterTouchDelay={0} arrow title={step?.assignedUsers?.map((e) => e?.optionLabel)?.toString()}>
                              <People style={{ color: 'var(--primary-text)', maxWidth: '22px' }} />
                            </HtmlTooltip>
                          )}
                          {step?.assignedWorkStations?.length > 0 && (
                            <HtmlTooltip
                              enterTouchDelay={0}
                              title={`Work Stations-${step?.assignedWorkStations?.map((e) => e?.optionLabel)?.toString()}`}
                              arrow
                            >
                              <span>
                                <WorkStations className=" align-text-top" />
                              </span>
                            </HtmlTooltip>
                          )}
                        </Box>
                        <Box style={{ display: 'flex', alignItems: 'center', flexBasis: mobScreen ? '100%' : 'unset', flexWrap: 'wrap' }}>
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
                              isStepsAllowToPerform &&
                              step?.isAllowToPerform &&
                              (stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start && !user?.brandPolicy?.workOrderTimer ? null : (
                                <Button
                                  variant="outlined"
                                  className={classes.stepButtons}
                                  color="secondary"
                                  size="small"
                                  disabled={!allowedToEdit}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      [WORKORDER_SERVICE_STEP_STATUS.pause, WORKORDER_SERVICE_STEP_STATUS.needReperform].includes(stepData?.status)
                                    ) {
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
                            {stepData?.passFailStatus ? <RenderPassFailChip status={stepData?.passFailStatus} className={classes.stepTags} /> : null}
                            {step?.isAllowToPerform && isStepsAllowToPerform ? (
                              !stepData?.startDate ? (
                                <Button
                                  variant="outlined"
                                  color="secondary"
                                  className={classes.stepButtons}
                                  size="small"
                                  disabled={!allowedToEdit}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      selectedService.status === WORKORDER_SERVICE_STATUS.pending ||
                                      selectedService.status === WORKORDER_SERVICE_STATUS.completed
                                    ) {
                                      updateServiceStatus(selectedService?.uniqueId, WORKORDER_SERVICE_STATUS.inProgress);
                                    }
                                    handleStartEnd(WORKORDER_SERVICE_STEP_STATUS.start, step, stepData);
                                  }}
                                >
                                  Start
                                </Button>
                              ) : stepData?.status === WORKORDER_SERVICE_STEP_STATUS.start && isStepValid ? (
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
                              ) : null
                            ) : null}
                            {stepData?.status &&
                            step?.isAllowToPerform &&
                            ![WORKORDER_SERVICE_STEP_STATUS.pause, WORKORDER_SERVICE_STEP_STATUS.needReperform].includes(stepData?.status) &&
                            // ![WORKORDER_SERVICE_STEP_STATUS.skipped].includes(stepData?.passFailStatus) &&
                            isStepsAllowToPerform ? (
                              [
                                WORKORDER_SERVICE_STEP_STATUS.passed,
                                WORKORDER_SERVICE_STEP_STATUS.failed,
                                WORKORDER_SERVICE_STEP_STATUS.completed,
                                WORKORDER_SERVICE_STEP_STATUS.skipped
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
                                      if (selectedService?.status === WORKORDER_SERVICE_STATUS.completed) {
                                        setReOpenServiceDialog({ open: true, type: null, step: step });
                                      } else if (WORKORDER_SERVICE_STEP_STATUS.skipped === stepData?.passFailStatus) {
                                        handleStartEnd('unSkipped', step);
                                      } else {
                                        handleStartEnd('reopen', step);
                                      }
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
                        </Box>
                      </Box>
                      {!mobScreen && (
                        <div className="flex  items-center md:gap-1">
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
                              <Info fontSize="inherit" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label="delete"
                            disabled={!allowedToEdit}
                            onClick={(event) => {
                              handleOpenMenu(event, step);
                            }}
                          >
                            <MoreHoriz />
                          </IconButton>
                          {allowedToEdit && ![WORKORDER_SERVICE_STATUS.skipped].includes(selectedService?.status) ? (
                            <HtmlTooltip enterTouchDelay={0} title="Clone" placement="top" arrow>
                              <IconButton
                                size="small"
                                color="inherit"
                                aria-label="Clone"
                                onClick={() => {
                                  if (selectedService?.status === WORKORDER_SERVICE_STATUS.completed) {
                                    setReOpenServiceDialog({ open: true, type: 'clone', step: step });
                                  } else {
                                    cloneStep(step);
                                  }
                                }}
                              >
                                <FileCopyOutlined style={{ fontSize: '18px' }} />
                              </IconButton>
                            </HtmlTooltip>
                          ) : null}
                          <HtmlTooltip enterTouchDelay={0} title="Delete" placement="top" arrow>
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
                                  WORKORDER_SERVICE_STEP_STATUS.completed,
                                  WORKORDER_SERVICE_STEP_STATUS.skipped
                                ].includes(stepData?.passFailStatus)
                              }
                              onClick={() => setShowDeleteConfirmBox((prev) => ({ ...prev, open: true, steps: [step] }))}
                            >
                              <DeleteOutline style={{ fontSize: '20px' }} />
                            </IconButton>
                          </HtmlTooltip>
                        </div>
                      )}
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
                  {(resource === sidebarResource.workOrder ||
                    (resource === sidebarResource.workOrderTechnician && user?.brandPolicy?.workOrderTechnicianConsumable)) &&
                    !user?.brandPolicy?.workOrderConsumableHide && (
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
                  {resource === sidebarResource.workOrder && (
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
                  {resource === sidebarResource.workOrder && permissions?.workStations?.isRead && (
                    <MenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setWorkStationAssignDialog(true);
                        setAnchorEl(null);
                      }}
                    >
                      Assign Work Stations
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
                  <MenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEnd(WORKORDER_SERVICE_STEP_STATUS.skipped?.toLowerCase(), selectedStep);
                      setAnchorEl(null);
                    }}
                    disabled={
                      getFields(selectedStep).canSkip &&
                      isStepsAllowToPerform &&
                      ![WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed, WORKORDER_SERVICE_STATUS.skipped].includes(
                        selectedService?.status
                      ) &&
                      ![
                        WORKORDER_SERVICE_STEP_STATUS.skipped,
                        WORKORDER_SERVICE_STEP_STATUS.completed,
                        WORKORDER_SERVICE_STEP_STATUS.end,
                        WORKORDER_SERVICE_STEP_STATUS.passed
                      ]?.includes(getFields(selectedStep)?.stepData?.status)
                        ? false
                        : true
                    }
                  >
                    Skip Step
                  </MenuItem>
                  {resource === sidebarResource.workOrder && (
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
                <Box m={2}>
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
                resource={resource}
                handleSubmit={handleSubmit}
                selectedService={selectedService}
                allowedToEdit={
                  allowedToEdit && [WORKORDER_SERVICE_STEP_STATUS.start]?.includes(getFields(selectedStep)?.stepData?.status) ? true : false
                }
                step={selectedStep}
                stepData={stepState}
                isSubmitting={isSubmitting}
                editable={isFieldDialogEditable}
                nextStep={getNextStep(selectedStep) ? true : false}
              />
            )}
            {commentsDialog && (
              <Comments
                userId={user._id}
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
                    ? `As per the logic applied on this step, service${
                        addServiceConfirmation?.services?.length > 1 ? 's' : ''
                      }  ${addServiceConfirmation?.services?.map((e) => e?.serviceName || '')?.toString()} has been skipped. Do you want to Skip ? `
                    : addServiceConfirmation.type === 'returnToStepOnFail'
                      ? `As per the logic applied on this step, we need to return to step ${
                          addServiceConfirmation.step?.stepName || ''
                        }. Do you want to continue ?`
                      : addServiceConfirmation.type === 'isQuoteRevisionOnFail'
                        ? ` Step fail requires Quotation Revision. Do you confirm on this?`
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
                handleSuccess={() => {
                  setAttchmentsDialog({ open: false, uniqueServiceId: null, stepId: null, serviceName: null, stepName: null });
                }}
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
                service={consumablesDialog.service}
                uniqueId={consumablesDialog.uniqueId}
                stepId={consumablesDialog.stepId}
                serviceName={consumablesDialog.serviceName}
                workOrderData={workOrderData}
              />
            )}
            {userAssignDialog && (
              <AssignUserDialog
                warehouse={workOrderData?.warehouse?.optionValue}
                workOrderData={{
                  workOrderId: workOrderId
                }}
                assignedUsers={selectedStep?.assignedUsers}
                reference={'steps'}
                referenceData={{
                  stepId: selectedStep?._id,
                  serviceUniqueId: selectedService?.uniqueId
                }}
                handleClose={() => {
                  setUserAssignDialog(false);
                }}
                handleSucess={() => {
                  setUserAssignDialog(false);
                  fetchService();
                }}
                competencies={selectedService?.competencies}
              />
            )}
            {workStationAssignDialog && (
              <AssignWorkStationDialog
                warehouse={workOrderData?.warehouse?.optionValue}
                workOrderData={[
                  {
                    uniqueId: selectedService?.uniqueId,
                    workOrderId: workOrderId,
                    stepId: selectedStep?._id
                  }
                ]}
                workStations={selectedStep?.assignedWorkStations}
                handleClose={() => {
                  setWorkStationAssignDialog(false);
                }}
                handleSucess={() => {
                  setWorkStationAssignDialog(false);
                  fetchService();
                }}
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
            {reOpenServiceDialog.open && (
              <ConfirmationDialog
                open={reOpenServiceDialog.open}
                message={`By performing this action, the service status will change from ${WORKORDER_SERVICE_STATUS.completed} to ${WORKORDER_SERVICE_STATUS.inProgress}. Do you wish to continue?`}
                onClose={() => {
                  setReOpenServiceDialog({ open: false, type: null, step: null });
                }}
                forwardText={'Continue'}
                okBtnLoading={loadingStep}
                onOk={() => {
                  setLoadingStep(true);
                  if (reOpenServiceDialog.type === 'clone') {
                    cloneStep({
                      workOrderId: workOrderId,
                      _id: reOpenServiceDialog.step._id
                    });
                  } else {
                    handleStartEnd('reopen', reOpenServiceDialog.step);
                  }
                }}
              />
            )}
            {openServiceFieldValueDialig && (
              <ServiceFieldValueDialog
                workOrderId={workOrderId}
                fields={serviceDetails?.fields || []}
                fieldsValue={serviceDetails?.serviceFieldsValue || {}}
                service={selectedService}
                handleClose={() => {
                  setOpenServiceFieldValueDialig(false);
                  setIsEditableServiceFieldValueDialog(false);
                }}
                handleSuccess={() => {
                  fetchServiceData();
                  setOpenServiceFieldValueDialig(false);
                  setIsEditableServiceFieldValueDialog(false);
                }}
                editable={isEditableServiceFieldValueDialog}
              />
            )}
          </Box>
        ) : (
          <>
            <Box textAlign="center" p={2}>
              {resource === sidebarResource.workOrder && (
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={
                    allowedToEdit &&
                    ![WORKORDER_SERVICE_STATUS.completed, WORKORDER_SERVICE_STATUS.failed, WORKORDER_SERVICE_STATUS.skipped].includes(
                      selectedService?.status
                    )
                      ? false
                      : true
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddNewStep({ open: true, clone: false, cloneStepData: null });
                  }}
                  startIcon={<AiOutlinePlus />}
                >
                  Add Steps
                </Button>
              )}
            </Box>
          </>
        )
      ) : (
        <Box m={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {addNewStep.open && (
        <StepDialog
          handleClose={() => {
            setAddNewStep({ open: false, clone: false, cloneStepData: null });
          }}
          handleSucess={(data) => {
            if (addNewStep.clone) {
              delete data?.stepId;
            }
            handleAddStep(data);
          }}
          stepId={addNewStep.clone ? addNewStep.cloneStepData?._id : ''}
          stepData={addNewStep.clone ? addNewStep.cloneStepData : null}
          steps={serviceDetails?.steps}
          reference={'workOrder'}
          workOrderId={workOrderId}
          serviceId={selectedService?._id}
          uniqueId={selectedService?.uniqueId}
          isClone={addNewStep.clone}
        />
      )}
      {showDrawing && (
        <DiagramDialog
          referenceId={workOrderData?._id}
          handleClose={() => {
            setShowDrawing(false);
          }}
        />
      )}
      {showManageRepairJobDialog && (
        <ManageRepairJob
          onClose={() => setShowManageRepairJobDialog(false)}
          onSuccess={(data) => {
            handleAddAssetInRepairJob(data);
          }}
          referenceType={sidebarResource.workOrderTechnician}
          referenceData={{
            warehouse: workOrderData?.warehouse?.optionValue,
            workOrder: workOrderData?._id
          }}
        />
      )}
      {repairJobReceiveConfirmation && (
        <ConfirmationDialog
          open={repairJobReceiveConfirmation}
          message={`Are you sure you want to receive asset?`}
          onClose={() => {
            setRepairJobReceiveConfirmation(false);
          }}
          onOk={handleReceiveAssetInRepairJob}
          okBtnLoading={isSubmittingReceavingAsset}
        />
      )}
    </>
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
        ...getChipColor(status)
      }}
    />
  );
};
