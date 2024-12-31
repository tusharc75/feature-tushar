import { Dialog, IconButton, Menu, MenuItem, TextField, Theme } from '@mui/material';
import Box from '@mui/material/Box/Box';
import Grid from '@mui/material/Grid2';
import { makeStyles } from '@mui/styles';
import { ExpandMore } from '@mui/icons-material';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import Edit from '@mui/icons-material/Edit';
import HelpIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { groupBy, isArray, isEmpty, isObject, map, startCase, uniq, uniqBy } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { MdHandyman, MdHomeRepairService } from 'react-icons/md';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CustomMessageDialog from 'src/components/MessageDialog';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import ReplaceAssetReason from 'src/components/RentalManagment/ReplaceAssetReason';
import { actionDisable, rentalManagementActions, rentalManagementMessage } from 'src/constants/messageHelpers';
import ManageRepairOrder from 'src/pages/RepairOrder/ManageRepairOrder';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import ConsumeProduct from '../../../components/RentalManagment/ConsumeProduct';
import {
  ASSET_STATUS,
  COLOUR_MASTER,
  CustomDialogTransition,
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  MATERIAL_TYPE,
  RENTAL_INTERNAL_ASSET_STATUS,
  RENTAL_STEPS,
  REPAIR_JOB_STATUS,
  deliveryTicket,
  displayDate,
  findSimilarRecords,
  gridLoadingTimeout,
  serializedAsset as productInventoryHelperObject,
  rentalManagement,
  repairJob,
  repairOrder,
  sidebarResource
} from '../../../constants/helpers';
import { findOne, objectStore } from '../../../constants/indexdbhelper';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import MultipleTicket from '../../DeliveryTicket/MultipleTicket';
import ManageRepairJob from '../../RepairJob/ManageRepairJob';
import DateDialog from '../LoadingTicket/DateDialog';
import AddSerializedAsset from '../SerializedAsset/AddSerializedAsset';
import ShowNonSerializeAssets from '../SerializedAsset/ShowNonSerializeAssets';
import { getNestedQty, getRentalDeliveryTicket, getRentalProductAssets, uniqueProduct } from './../rentalOfflineHelper';
import ChangeActualDateDialog from './ChangeActualDateDialog';
import ExistingRentalJob from './ExistingRentalJob';
import ReturnTicketDialog from './ReturnTicketDialog';
import AssetDetailsChangeDialog from './AssetDetailsChangeDialog';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import { FiExternalLink } from 'react-icons/fi';
import { getParentWellNumber, getUniqueWellNumber } from 'src/components/RentalManagment/helper';
import TransferToAnotherPackageDialog from 'src/pages/RentalManagement/ReceivingTicket/TransferToAnotherPackageDialog';
import PreviewDownloadMultiple from '../../../components/DeliveryTicket/PreviewDownloadMultiple';
import ReceivingServices from './ReceivingServices';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { useGetWalkmeInstance, useSetWalkmeData, WalkmeData } from 'src/components/CustomIntro';
import { generateCreateReceivingTicket, generateReceiveItem, nextButtonStep } from 'src/pages/RentalManagement/walkmeSteps';
import ChangePreviousAssetDataDialog from 'src/pages/RentalManagement/LoadingTicket/ChangePreviousAssetDataDialog';
import GpsLocationCell from 'src/components/CustomReactTable/Cells/GpsLocationCell';
import WarningIcon from '@mui/icons-material/Warning';
import FreeStyleMultiSelect from 'src/components/CustomReactTable/Cells/FreeStyleMultiSelect';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper
  },
  paper: {
    width: '80%',
    maxHeight: 435
  }
}));

const globalStepDataAdded = { createReceivingTicket: false, receivedItems: false };

const ReceivingTicket = ({
  currentStep,
  rentalManagementData,
  fetchRentalData,
  setNextStep,
  setNextStepToolTip,
  renderedFrom,
  allowedToEdit,
  isProcessor,
  allowUpdateStatus,
  stepFullScreen,
  rentalPolicyData,
  hideDeliveryTicketDelivered
}) => {
  const walkmeInstance = useGetWalkmeInstance();
  const { setWalkmeData } = useSetWalkmeData();

  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords, dataRows } = state;

  const [showRemoveAssetFromReceivingTicketDialog, setShowRemoveAssetFromReceivingTicketDialog] = useState(false);
  const [showConformationConsume, setShowConformationConsume] = useState({ open: false, type: 'add' });
  const [showConformationConsumeMultiple, setShowConformationConsumeMultiple] = useState(false);
  const [showConformationRevertTicket, setShowConformationRevertTicket] = useState(false);
  const [showConformationCancleTicket, setShowConformationCancleTicket] = useState({ open: false });
  const [okBtnLoading, setOkBtnLoading] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: '', message: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [showQtyDialog, setShowQtyDialog] = useState({ open: false, data: null });
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, ticketType: '', data: {} });
  const { isOffline } = useContext(CustomOfflineContext);
  const [openDeliveryTicketDialog, setOpenDeliveryTicketDialog] = useState(false);
  const [showProcessDeliveryTicket, setShowProcessDeliveryTicket] = useState(false);
  const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);
  const [showRepairOrderDialog, setShowRepairOrderDialog] = useState({ open: false, inUseAsset: false });
  const [isExistingRentalJob, setIsExistingRentalJob] = useState(false);
  const [uniqueReceivingTicket, setUniqueReceivingTicket] = useState([]);
  const [showInfo, setShowInfo] = useState({ open: false, data: {}, type: null });
  const [invoiceData, setInvoiceData] = useState(null);
  const [openChangeActualDateDialog, setOpenChangeActualDateDialog] = useState({ open: false, data: null, records: null, isBulkUpdate: false });
  const [anchorLinkActionEl, setAnchorLinkActionEl] = useState(null);
  const [repairJobCount, setRepairJobCount] = useState(0);
  const [repairOrderCount, setRepairOrderCount] = useState(0);
  const [openMessageDialog, setOpenMessageDialog] = useState({ open: false, errorMessages: [] });
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false, products: [], type: '' });
  const [showReplaceReason, setShowReplaceReason] = useState({ open: false, data: {} });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDateDialog, setOpenDateDialog] = useState({ open: false, type: null, status: null, prevStatus: null, assets: [], loading: false });

  const [columns, setColumns] = useState(null);
  const [assetPolicyData, setAssetPolicyData] = useState(null);
  const [openAssetDetailDialog, setOpenAssetDetailDialog] = useState({
    open: false,
    statusPolicy: null,
    _ids: null,
    referenceData: {},
    ticketType: null
  });
  const [assetsData, setAssetsData] = useState([]);
  const [transferAnotherPackageDialog, setTransferAnotherPackageialog] = useState(false);
  const [serviceData, setServiceData] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [openAssetDataDialog, setOpenAssetDataDialog] = useState(false);

  const [allMaterial, setAllMaterial] = useState(false);

  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const openLinkActions = (event) => {
    setAnchorLinkActionEl(event.currentTarget);
  };

  const closeLinkActions = () => {
    setAnchorLinkActionEl(null);
  };

  useEffect(() => {
    getColumn();
    fetchRecords();
    fetchPolicy();
  }, [currentStep, rentalPolicyData]);

  useEffect(() => {
    if (dataRows.length) {
      addWalkmeData(dataRows);
    }
  }, [assetPolicyData, dataRows]);

  const OpenInNewWindow = (url) => {
    window.open(`${url}?referenceType=${rentalManagementData?.rentalJobName}&referenceId=${rentalManagementData?._id}`, '_blank');
  };

  const addWalkmeData = (data: any[]) => {
    if (data?.length === 0) return;
    const stepData: WalkmeData[] = [];
    const canAddCreateReceivingTicketStep = validateAction(rentalManagementActions.createReceivingTicket, data, true);
    if (currentStep === RENTAL_STEPS.receiving && !user?.user?.brandPolicy?.rentalOnFieldStep && canAddCreateReceivingTicketStep) {
      const statusPolicy = assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === ASSET_STATUS.underReview);
      let walkmeData: WalkmeData;
      if (statusPolicy && data?.[0]?.type === 'Asset') {
        walkmeData = generateCreateReceivingTicket(renderedFrom);
      } else {
        walkmeData = generateCreateReceivingTicket(renderedFrom, false);
      }
      stepData.push(walkmeData);
      if (walkmeInstance && walkmeInstance.type === 'flow' && !globalStepDataAdded.createReceivingTicket) {
        globalStepDataAdded.createReceivingTicket = true;
        walkmeInstance.instance.push([...walkmeData.steps, { ...walkmeData.steps[walkmeData.steps.length - 1], waitForStepInsertion: true }]);
        walkmeInstance.handleNext();
      }
    }

    if (currentStep === RENTAL_STEPS.receiving && !hideDeliveryTicketDelivered && permissions?.deliveryTicket?.isUpdate) {
      const isValid = validateAction(rentalManagementActions.receiveItems, data, true);
      if (isValid) stepData.push(generateReceiveItem(renderedFrom));
      if (walkmeInstance && walkmeInstance.type === 'flow' && !globalStepDataAdded.receivedItems) {
        globalStepDataAdded.receivedItems = true;
        walkmeInstance.instance.push([...generateReceiveItem(renderedFrom).steps, { ...nextButtonStep }]);
        walkmeInstance.handleNext();
      }
    }

    setWalkmeData(stepData);
  };

  const validateAction = (action: string, records = selectedRecords, returnBoolean = false) => {
    const errorMessages = [];
    if (action === rentalManagementActions.cancelReceivingReturnTicket) {
      const receivingTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e?.receivingTicketId),
          'receivingTicketId'
        )
      );
      const returnTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e?.returnTicketId),
          'returnTicketId'
        )
      );
      records = [
        ...selectedRecords?.filter((e) => !e?.receivingTicketId && !e?.returnTicketId),
        ...dataRows?.filter((e) => receivingTicketIds?.includes(e?.receivingTicketId)),
        ...dataRows?.filter((e) => returnTicketIds?.includes(e?.returnTicketId))
      ];

      const similarRecords = findSimilarRecords(
        records?.filter((e) => e.type === 'Asset'),
        '_id'
      );
      if (similarRecords?.length) {
        similarRecords?.forEach((ele: any) => {
          ele?.forEach((e: any) => {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.sameAssetsSelected });
          });
        });
      }
    }
    records.forEach((e) => {
      if (action === rentalManagementActions.deliveredToCustomer) {
        if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingAlreadyDelivered });
        }
      } else if (action === rentalManagementActions.replaceAsset) {
        if (e?.type !== 'Asset') {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.productsCanNotReplace });
        } else if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingDeliveredForReplace });
        } else if (e?.status !== ASSET_STATUS.inUse || e?.rentalAssetStatus !== ASSET_STATUS.inUse) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.onlyReplaceInUse });
        }
      } else if (action === rentalManagementActions.createReceivingTicket) {
        if (e?.type !== 'Asset' && e?.type === 'Product' && !e?.serialized) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingNotProduct });
        } else if (!e?.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotDelivered });
        } else if (e?.hasOwnProperty('receivingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingAlreadyCreated });
        } else if (e?.hasOwnProperty('returnTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.returnAlreadyCreated });
        } else if ([ASSET_STATUS.lost]?.includes(e?.status)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.ticketNotForLost });
        } else if (
          ![
            ASSET_STATUS.inUse,
            ASSET_STATUS.standBy,
            ASSET_STATUS.standByNotChargeable,
            ASSET_STATUS.scrap,
            ASSET_STATUS.needRepair,
            ASSET_STATUS.needRecert,
            ASSET_STATUS.notApplied
          ]?.includes(e?.status)
        ) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingNotValidStatus });
        }
      } else if (action === rentalManagementActions.createReturnTicket) {
        if (!e?.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotDelivered });
        } else if (e?.hasOwnProperty('receivingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingAlreadyCreated });
        } else if (e?.hasOwnProperty('returnTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.returnAlreadyCreated });
        } else if ([ASSET_STATUS.lost]?.includes(e?.status)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.ticketNotForLost });
        } else if (
          ![
            ASSET_STATUS.inUse,
            ASSET_STATUS.standBy,
            ASSET_STATUS.standByNotChargeable,
            ASSET_STATUS.scrap,
            ASSET_STATUS.needRepair,
            ASSET_STATUS.needRecert,
            ASSET_STATUS.notApplied
          ]?.includes(e?.status) &&
          !e?.isReplaced
        ) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingNotValidStatus });
        }
      } else if (action === rentalManagementActions.receiveItems) {
        if (!e?.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotDelivered });
        } else if (!e?.hasOwnProperty('receivingTicketId') && !e?.hasOwnProperty('returnTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingOrReturnNotCreated });
        } else if ([e?.receivingTicketStatus].includes(DELIVERY_TICKET_STATUS.delivered)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingAlreadyDelivered });
        } else if ([e?.returnTicketStatus].includes(DELIVERY_TICKET_STATUS.delivered)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.returnAlreadyDelivered });
        }
      } else if (action === rentalManagementActions.createSupplierDeliveryTicket) {
        if (!e?.subleaseAsset) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.onlySubleaseAsset });
        } else if (!e?.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotDelivered });
        } else if (e?.hasOwnProperty('receivingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingAlreadyCreated });
        } else if (e?.hasOwnProperty('returnTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.returnAlreadyCreated });
        } else if ([ASSET_STATUS.lost]?.includes(e?.status)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.ticketNotForLost });
        }
      } else if (action === rentalManagementActions.cancelInTransitTicket) {
        if (!e.hasOwnProperty('receivingTicketId') && !e.hasOwnProperty('returnTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingReturnNotCreated });
        } else if (e?.receivingTicketStatus !== DELIVERY_TICKET_STATUS.inTransit && e?.returnTicketStatus !== DELIVERY_TICKET_STATUS.inTransit) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.cancelInTransitLineItems });
        }
      } else if (action === rentalManagementActions.cancelReceivingReturnTicket) {
        if (!e.hasOwnProperty('receivingTicketId') && !e.hasOwnProperty('returnTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingReturnNotCreated });
        } else if (
          ![DELIVERY_TICKET_STATUS.inTransit, DELIVERY_TICKET_STATUS.delivered]?.includes(e?.receivingTicketStatus) &&
          ![DELIVERY_TICKET_STATUS.inTransit, DELIVERY_TICKET_STATUS.delivered]?.includes(e?.returnTicketStatus)
        ) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.inTransitDeliveredLoadingTicket });
        } else if (e?.receivingTicketStatus === DELIVERY_TICKET_STATUS.delivered || e?.returnTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
          if (e?.isReplaced && e?.type === 'Asset') {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.ticketCanNotCancelledForReplaceedAssets });
          } else if (![ASSET_STATUS.underReview, ASSET_STATUS.available]?.includes(e?.status) && e?.type === 'Asset') {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.statusURForCancelReceiving });
          } else if (![RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.return, 'Returned']?.includes(e?.rentalAssetStatus)) {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.rentalStatusCompleteCancelReceiving });
          }
        }
      } else if (action === rentalManagementActions.createRepairJob || action === rentalManagementActions.createRepairOrder) {
        if (e.type !== 'Asset') {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.onlyAssetsCanBeRepaired });
        } else if (e?.receivingTicketStatus !== DELIVERY_TICKET_STATUS.delivered && e?.returnTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.receivingOrReturnNotDelivered });
        } else if (action === rentalManagementActions.createRepairJob && e.subleaseAsset) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.notSubleaseAsset });
        } else if (![ASSET_STATUS.underReview, ASSET_STATUS.scrap, ASSET_STATUS.needRecert, ASSET_STATUS.needRepair].includes(e.status)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.repairCanForThisAsset });
        } else if (uniq(map(records, 'warehouseId')).length !== 1) {
          errorMessages.push({
            index: e.index,
            message: rentalManagementMessage.repairSameWarehouse?.replace(sidebarResource?.warehouse, resources?.warehouse?.titleSingular)
          });
        }
      } else if (action === rentalManagementActions.transferToAnotherRental) {
        if ([ASSET_STATUS.lost]?.includes(e?.status)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.ticketNotForLost });
        } else if (!e?.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotDelivered });
        } else if (
          ([ASSET_STATUS.inUse].includes(e.status) && [RENTAL_INTERNAL_ASSET_STATUS.inUse].includes(e.rentalAssetStatus)) ||
          ([ASSET_STATUS.available, ASSET_STATUS.underReview].includes(e.status) &&
            [RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.return].includes(e.rentalAssetStatus))
        ) {
        } else {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.transferRentalForAsset });
        }
      } else if (action === rentalManagementActions.swapInUseAssets) {
        if (e.type !== 'Asset') {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.onlySwapAssets });
        } else if ([ASSET_STATUS.inUse].includes(e.status) && [RENTAL_INTERNAL_ASSET_STATUS.inUse].includes(e.rentalAssetStatus)) {
        } else {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.onlySwapInUseAssets });
        }
      } else if (action === rentalManagementActions.updateStartDateEndDate) {
        if (!e.isAllowedStartDate && !e.isAllowedEndDate) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.canNotChangeStartDateEndDate });
        }
      }
    });
    if (action === rentalManagementActions.transferToAnotherRental && errorMessages?.length === 0) {
      const similarRecords = findSimilarRecords(
        records?.filter((e) => e.type === 'Asset'),
        '_id'
      );

      if (similarRecords?.length) {
        similarRecords?.forEach((ele: any) => {
          ele?.forEach((e: any) => {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.sameAssetsSelected });
          });
        });
      } else {
        if (records?.find((e) => [RENTAL_INTERNAL_ASSET_STATUS.inUse]?.includes(e.rentalAssetStatus))) {
          if (
            records?.filter((e) => [ASSET_STATUS.inUse]?.includes(e.status) && [RENTAL_INTERNAL_ASSET_STATUS.inUse]?.includes(e.rentalAssetStatus))
              ?.length !== records?.length
          ) {
            records?.forEach((e) => {
              errorMessages.push({ index: e.index, message: rentalManagementMessage.transferRentalForAssetSame });
            });
          }
        } else {
          if (
            records?.filter(
              (e) =>
                [ASSET_STATUS.available, ASSET_STATUS.underReview]?.includes(e.status) &&
                [RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.return]?.includes(e.rentalAssetStatus)
            )?.length !== records?.length
          ) {
            records?.forEach((e) => {
              errorMessages.push({ index: e.index, message: rentalManagementMessage.transferRentalForAssetSame });
            });
          }
        }
      }
    }
    if (action === rentalManagementActions.updateStartDateEndDate) {
      if (selectedRecords?.find((e) => e?.isAllowedStartDate)) {
        selectedRecords
          ?.filter((e) => !e?.isAllowedStartDate)
          ?.forEach((e) => {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.canNotChangeStartDate });
          });
      }
      if (selectedRecords?.find((e) => e?.isAllowedEndDate)) {
        selectedRecords
          ?.filter((e) => !e?.isAllowedEndDate)
          ?.forEach((e) => {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.canNotChangeEndDate });
          });
      }
    }
    if (errorMessages?.length) {
      if (!returnBoolean) setOpenMessageDialog({ open: true, errorMessages: errorMessages });
      return false;
    }
    return true;
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.serializedAsset}`);
      if (data) {
        setAssetPolicyData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchRecords = async () => {
    try {
      setNextStep(false);
      setNextStepToolTip(null);
      setAssetsData([]);
      dispatch({ type: 'selection', selectedRecords: [] });
      dispatch({ type: 'loading', loading: true });

      var productAssets: any = [];
      var deliveryTicketList: any = [];
      var material: any = [];
      var products: any = [];
      var nonSerializeAsset: any = [];
      var productSerialNumbers: any = [];
      var consumeProducts: any = [];
      var transactionData: any = [];
      var nonSerializedInventory: any = [];

      var invoiceData: any = [];

      if (isOffline) {
        productAssets = await getRentalProductAssets(rentalManagementData._id);
        productAssets = productAssets?.map((u) => ({
          ...u,
          type: 'Asset',
          displayType: 'Asset',
          qty: 1,
          productName: u?.product?.optionLabel,
          warehouse: u?.warehouse?.optionLabel,
          warehouseId: u?.warehouse?.optionValue,
          currentOwner: u?.currentOwner,
          currentLocation: u?.currentLocation?.optionValue,
          rentalAssetStatus: u?.status,
          startDate: u?.actualStartDate,
          endDate: u?.actualEndDate,
          manualStartDate: u?.manualStartDate,
          manualEndDate: u?.manualEndDate
        }));

        deliveryTicketList = await getRentalDeliveryTicket(rentalManagementData._id);

        const productResponse = await findOne(objectStore.rentalManagement, rentalManagementData._id);
        material = productResponse.material;
      } else {
        const response = await axiosInstance().get(`${rentalManagement.api}/${rentalManagementData._id}/inventory`);
        productAssets = response?.data?.data;
        productAssets = productAssets
          .map((d) => {
            return {
              ...d.inventory,
              uniqueId: d._id,
              rentalAssetStatus: d.status,
              startDate: d.actualStartDate || d.startDate,
              endDate: d.actualEndDate || d.endDate,
              manualStartDate: d.manualStartDate,
              manualEndDate: d.manualEndDate,
              isReplaced: d?.isReplaced,
              replaceReason: d?.replaceReason,
              replaceAsset: d?.replaceAsset?.optionLabel,
              description: d?.product?.productDescription,
              wellNumber: d?.inventory?.wellNumber,
              position: d?.inventory?.position,
              currentGpsLocation: d?.inventory?.currentGpsLocation,
              currentGpsWellNames: d?.inventory?.currentGpsWellNames?.toString(),
              currentLocationNotMatchWithGps: d?.inventory?.currentLocationNotMatchWithGps
            };
          })
          .map((u) => ({
            ...u,
            type: 'Asset',
            displayType: 'Asset',
            qty: 1,
            productName: u?.product?.optionLabel,
            productId: u?.product?.optionValue,
            warehouse: u?.warehouse?.optionLabel,
            warehouseId: u?.warehouse?.optionValue,
            currentOwner: u?.currentOwner,
            currentLocation: u?.currentLocation?.optionValue,
            startDate: u?.startDate,
            endDate: u?.endDate,
            manualStartDate: u?.manualStartDate,
            manualEndDate: u?.manualEndDate
          }));

        const transactionResult = await axiosInstance().get(`${rentalManagement.api}/rental-related-transaction/${rentalManagementData._id}`);
        transactionData = transactionResult?.data?.data;

        const result = await axiosInstance().get(
          `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}&referenceId=${rentalManagementData._id}`
        );
        deliveryTicketList = result?.data?.data;

        const productResponse = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
        material = productResponse?.data?.data?.material;
        nonSerializeAsset = productResponse?.data?.data?.nonSerializeAsset;
        consumeProducts = productResponse?.data?.data?.consumeProducts;
        productSerialNumbers = productResponse?.data?.data?.productSerialNumbers;
        nonSerializedInventory = productResponse?.data?.data?.nonSerializedInventory;

        const invoiceResponse = await axiosInstance().get(`/rental-management/${rentalManagementData._id}/invoice/material-end-date-qty`);
        invoiceData = invoiceResponse?.data?.data?.material || [];

        setInvoiceData(invoiceData);
      }

      setAllMaterial(material);

      if (permissions?.repairJob?.isRead && transactionData?.repairJob?.length) {
        setRepairJobCount(transactionData?.repairJob?.length);
      }
      if (permissions?.repairOrder?.isRead && transactionData?.repairOrder?.length) {
        setRepairOrderCount(transactionData?.repairOrder?.length);
      }

      if (transactionData?.repairJob?.length || transactionData?.repairOrder?.length) {
        productAssets?.forEach((element) => {
          const repairJob = transactionData?.repairJob?.find((e) => e?.assetId === element?._id);
          if (repairJob) {
            element.isRepairJob = true;
            element.repairJob = repairJob?._id;
          }
          const repairOrder = transactionData?.repairOrder?.find((e) => e?.assetId === element?._id);
          if (repairOrder) {
            element.isRepairOrder = true;
            element.repairOrder = repairOrder?._id;
          }
        });
      }

      const loadingTicketProducts = [];
      const returnTicketProducts = [];
      const receiveTicketProducts = [];

      deliveryTicketList?.forEach((element) => {
        if (element.ticketType === DELIVERY_TICKET_TYPE.loading && element?.products && element?.products?.length) {
          element?.products?.forEach((ele) => {
            loadingTicketProducts.push({
              ...ele,
              loadingTicketId: element._id,
              loadingTicket: element?.ticketName,
              loadingTicketStatus: element?.status,
              warehouse: element?.pickupFrom
            });
          });
        }
        if (element.ticketType === DELIVERY_TICKET_TYPE.return && element?.products && element?.products?.length) {
          element?.products?.forEach((ele) => {
            returnTicketProducts.push({
              ...ele,
              returnTicketId: element._id,
              returnTicket: element?.ticketName,
              returnTicketStatus: element?.status,
              warehouse: element?.deliveryTo
            });
          });
        }
        if (element.ticketType === DELIVERY_TICKET_TYPE.receiving && element?.products && element?.products?.length) {
          element?.products?.forEach((ele) => {
            receiveTicketProducts.push({
              ...ele,
              receivingTicketId: element._id,
              receivingTicket: element?.ticketName,
              receivingTicketStatus: element?.status
            });
          });
        }
      });

      products = uniqueProduct(
        material?.filter((e) => e.consumableType !== 'Internal'),
        nonSerializedInventory
      );

      products?.forEach((element) => {
        var qty = element.qty;

        var ticketProduct: any = [];
        if (element?.warehouse) {
          ticketProduct = loadingTicketProducts?.filter(
            (e) => e.uniqueId === element._id && e.product === element.materialId && e?.warehouse?.optionValue === element?.warehouse?.optionValue
          );
        } else {
          ticketProduct = loadingTicketProducts?.filter((e) => e.uniqueId === element._id && e.product === element.materialId);
        }

        ticketProduct?.forEach((ele) => {
          var returnTicket: any = [];
          if (ele?.warehouse && productSerialNumbers?.length) {
            returnTicket = returnTicketProducts?.find(
              (e) =>
                e.qty <= ele.qty &&
                e.uniqueId === element._id &&
                e.product === element.materialId &&
                !e.isCount &&
                e?.warehouse?.optionValue === ele?.warehouse?.optionValue
            );
          } else {
            returnTicket = returnTicketProducts?.find(
              (e) => e.qty <= ele.qty && e.uniqueId === element._id && e.product === element.materialId && !e.isCount
            );
          }

          var consumeQty = 0;

          consumeProducts
            ?.filter((e) => e.product === element.materialId && e.loadingTicketId === ele.loadingTicketId)
            ?.forEach((e) => {
              consumeQty = consumeQty + e.qty;
            });

          const obj: any = {};
          obj._id = element?._id + '_' + ele.loadingTicketId;
          obj.materialId = element?.materialId;
          obj.uniqueId = element._id;
          obj.serialized = element?.productDetail?.serializedProduct;
          obj.type = 'Product';
          obj.displayType = element?.productDetail?.serializedProduct ? 'Product (Serialized)' : 'Product (Non-Serialized)';
          obj.description =
            element.type === MATERIAL_TYPE.product
              ? element?.productDetail?.productDescription || ''
              : element.type === MATERIAL_TYPE.package
                ? element?.packageDetail?.packageDescription || ''
                : '';
          obj.qty = ele.qty;
          obj.consumeQty = consumeQty;
          obj.returnQty = !element?.productDetail?.serializedProduct ? returnTicket?.qty || 0 : 0;
          obj.assetNumber = element?.productDetail?.productName;
          obj.productName = element?.productDetail?.productName;
          obj.productId = element?.productDetail?._id;
          obj.warehouse = element?.warehouse ? element?.warehouse?.optionLabel : rentalManagementData?.warehouse?.optionLabel;
          obj.warehouseId = element?.warehouse ? element?.warehouse?.optionValue : rentalManagementData?.warehouse?.optionValue;
          obj.status = element?.productDetail?.serializedProduct === true ? element?.status : 'N/A';
          obj.parentId = element?.parentId;
          obj.rentalAssetStatus = !element?.productDetail?.serializedProduct
            ? ele.qty === consumeQty
              ? RENTAL_INTERNAL_ASSET_STATUS.consumed
              : consumeQty < ele.qty && consumeQty > 0
                ? RENTAL_INTERNAL_ASSET_STATUS.partiallyConsumed
                : ele.qty === (returnTicket?.qty || 0)
                  ? 'Returned'
                  : element?.status
            : element?.status;
          obj.startDate = element?.actualStartDate;
          obj.endDate = element?.actualEndDate;
          obj.manualStartDate = element?.manualStartDate;
          obj.manualEndDate = element?.manualEndDate;
          obj.nonSerializeAsset = nonSerializeAsset?.filter((e) => e.product === obj.productId && e._id === element._id);
          obj.loadingTicket = ele?.loadingTicket;
          obj.loadingTicketId = ele?.loadingTicketId;
          obj.loadingTicketStatus = ele?.loadingTicketStatus;
          obj.currentLocation =
            element?.currentLocation?.optionValue ||
            rentalManagementData?.shippingAddress?.optionValue ||
            rentalManagementData?.billingAddress?.optionValue;

          if (returnTicket) {
            returnTicket.isCount = true;
            obj.returnTicket = returnTicket?.returnTicket;
            obj.returnTicketId = returnTicket?.returnTicketId;
            obj.returnTicketStatus = returnTicket?.returnTicketStatus;
          }

          obj.wellNumber = getParentWellNumber(material, element?._id);

          productAssets.push(obj);
          qty = qty - ele.qty;
        });

        if (qty > 0) {
          const obj: any = {};
          obj._id = `${element._id}_${productAssets?.length + 1}`;
          obj.uniqueId = element?._id;
          obj.materialId = element?.materialId;
          obj.type = 'Product';
          obj.displayType = element?.productDetail?.serializedProduct ? 'Product (Serialized)' : 'Product (Non-Serialized)';
          obj.description =
            element.type === MATERIAL_TYPE.product
              ? element?.productDetail?.productDescription || ''
              : element.type === MATERIAL_TYPE.package
                ? element?.packageDetail?.packageDescription || ''
                : '';
          obj.qty = qty;
          obj.parentId = element?.parentId;
          obj.consumeQty = 0;
          obj.returnQty = 0;
          obj.assetNumber = element?.productDetail?.productName;
          obj.productName = element?.productDetail?.productName;
          obj.productId = element?.productDetail?._id;
          obj.warehouse = element?.warehouse ? element?.warehouse?.optionLabel : rentalManagementData?.warehouse?.optionLabel;
          obj.warehouseId = element?.warehouse ? element?.warehouse?.optionValue : rentalManagementData?.warehouse?.optionValue;
          obj.nonSerializeAsset = nonSerializeAsset?.filter((e) => e.product === obj.productId && e._id === element._id);
          obj.status = element?.productDetail?.serializedProduct === true ? element?.status : 'N/A';
          obj.rentalAssetStatus = element?.productDetail?.serializedProduct ? element?.status : '';
          obj.currentLocation =
            element?.currentLocation?.optionValue ||
            rentalManagementData?.shippingAddress?.optionValue ||
            rentalManagementData?.billingAddress?.optionValue;
          obj.wellNumber = getParentWellNumber(material, element?._id);

          productAssets.push(obj);
        }
      });

      if (productSerialNumbers?.length) {
        material
          ?.filter((e) => e?.productDetail?.serializedProduct && e.type === MATERIAL_TYPE.product)
          .forEach((element) => {
            var qty = productSerialNumbers?.filter((e) => e?._id === element?._id)?.length;

            if (qty) {
              const ticketProduct = loadingTicketProducts?.filter((e) => e.product === element.materialId && e.uniqueId === element._id);
              let ticketProductSerialNumbers: any = [];

              ticketProduct?.forEach((ele) => {
                const returnTicket = returnTicketProducts?.find(
                  (e) => e.qty <= ele.qty && e.uniqueId === element._id && e.product === element.materialId && !e.isCount
                );
                const receiveTicket = receiveTicketProducts?.find(
                  (e) => e.qty <= ele.qty && e.uniqueId === element._id && e.product === element.materialId && !e.isCount
                );

                var consumeQty = 0;
                consumeProducts
                  ?.filter((e) => e.product === element.materialId && e.loadingTicketId === ele.loadingTicketId)
                  ?.forEach((e) => {
                    consumeQty = consumeQty + e.qty;
                  });

                const obj: any = {};
                obj._id = element._id + '_' + ele.loadingTicketId;
                obj.uniqueId = element._id;
                obj.serialized = element?.productDetail?.serializedProduct;
                obj.materialId = element?.productDetail?._id;
                obj.type = 'Product';
                obj.displayType = element?.productDetail?.serializedProduct ? 'Product (Serialized)' : 'Product (Non-Serialized)';
                obj.description =
                  element.type === MATERIAL_TYPE.product
                    ? element?.productDetail?.productDescription || ''
                    : element.type === MATERIAL_TYPE.package
                      ? element?.packageDetail?.packageDescription || ''
                      : '';
                obj.qty = ele.qty;
                obj.consumeQty = consumeQty;
                obj.returnQty = !element?.productDetail?.serializedProduct ? returnTicket?.qty || 0 : 0;
                obj.assetNumber = element?.productDetail?.productName;
                obj.productName = element?.productDetail?.productName;
                obj.productId = element?.productDetail?._id;
                obj.warehouse = rentalManagementData?.warehouse?.optionLabel;
                obj.warehouseId = rentalManagementData?.warehouse?.optionValue;
                obj.parentId = element?.parentId;
                obj.status = ASSET_STATUS.notApplied;
                obj.rentalAssetStatus =
                  ele.qty === consumeQty
                    ? RENTAL_INTERNAL_ASSET_STATUS.consumed
                    : consumeQty < ele.qty && consumeQty > 0
                      ? RENTAL_INTERNAL_ASSET_STATUS.partiallyConsumed
                      : ele.qty === (returnTicket?.qty || 0)
                        ? 'Returned'
                        : element?.status;
                obj.startDate = element?.actualStartDate;
                obj.endDate = element?.actualEndDate;
                obj.manualStartDate = element?.manualStartDate;
                obj.manualEndDate = element?.manualEndDate;
                obj.productSerialNumbers = productSerialNumbers
                  ?.filter((e) => e?._id === element?._id && ele?.serialNumber?.includes(e?.productSerialNumberDetail?._id))
                  ?.map((e) => ({ ...e, assetNumber: e?.productSerialNumberDetail?.serialNumber }));
                obj.loadingTicket = ele?.loadingTicket;
                obj.loadingTicketId = ele?.loadingTicketId;
                obj.loadingTicketStatus = ele?.loadingTicketStatus;
                obj.currentLocation =
                  element?.currentLocation?.optionValue ||
                  rentalManagementData?.shippingAddress?.optionValue ||
                  rentalManagementData?.billingAddress?.optionValue;

                if (returnTicket) {
                  returnTicket.isCount = true;
                  obj.returnTicket = returnTicket?.returnTicket;
                  obj.returnTicketId = returnTicket?.returnTicketId;
                  obj.returnTicketStatus = returnTicket?.returnTicketStatus;
                }
                if (receiveTicket) {
                  receiveTicket.isCount = true;
                  obj.receivingTicketId = receiveTicket?.receivingTicketId;
                  obj.receivingTicket = receiveTicket?.receivingTicket;
                  obj.receivingTicketStatus = receiveTicket?.receivingTicketStatus;
                }
                obj.wellNumber = getParentWellNumber(material, element?._id);

                productAssets.push(obj);
                ticketProductSerialNumbers = [...ticketProductSerialNumbers, ...(ele?.serialNumber || [])];
                qty = qty - ele.qty;
              });

              if (qty > 0) {
                productAssets.push({
                  _id: element?._id,
                  materialId: element?.materialId,
                  uniqueId: element?._id,
                  type: 'Product',
                  displayType: 'Product (Serialized)',
                  qty: qty,
                  description: element?.productDetail?.productDescription || '',
                  parentId: element?.parentId,
                  consumeQty: 0,
                  returnQty: 0,
                  assetNumber: element?.productDetail?.productName,
                  productName: element?.productDetail?.productName,
                  productId: element?.productDetail?._id,
                  warehouse: rentalManagementData?.warehouse?.optionLabel,
                  warehouseId: rentalManagementData?.warehouse?.optionValue,
                  productSerialNumbers: productSerialNumbers
                    ?.filter((e) => e?._id === element?._id && !ticketProductSerialNumbers?.includes(e?.productSerialNumberDetail?._id))
                    ?.map((e) => ({ ...e, assetNumber: e?.productSerialNumberDetail?.serialNumber })),
                  status: ASSET_STATUS.notApplied,
                  currentLocation:
                    element?.currentLocation?.optionValue ||
                    rentalManagementData?.shippingAddress?.optionValue ||
                    rentalManagementData?.billingAddress?.optionValue,
                  wellNumber: getParentWellNumber(material, element?._id)
                });
              }
            }
          });
      }

      deliveryTicketList?.map((obj) => {
        productAssets?.map((d, index) => {
          if (obj?.assets?.some((p) => p?.asset === d?._id && p?.uniqueId === d?.uniqueId)) {
            if (obj.ticketType === DELIVERY_TICKET_TYPE.loading) {
              productAssets[index]['loadingTicket'] = obj?.ticketName;
              productAssets[index]['loadingTicketId'] = obj?._id;
              productAssets[index]['loadingTicketStatus'] = obj?.status;
            }
            if (obj.ticketType === DELIVERY_TICKET_TYPE.receiving) {
              productAssets[index]['receivingTicket'] = obj?.ticketName;
              productAssets[index]['receivingTicketId'] = obj?._id;
              productAssets[index]['receivingTicketStatus'] = obj?.status;
            }
            if (obj.ticketType === DELIVERY_TICKET_TYPE.return) {
              productAssets[index]['returnTicket'] = obj?.ticketName;
              productAssets[index]['returnTicketId'] = obj?._id;
              productAssets[index]['returnTicketStatus'] = obj?.status;
            }
          }
        });
      });

      productAssets.forEach((d) => {
        if (d.type === 'Asset') {
          const parentId = material?.find((e) => e._id === d.uniqueId)?.parentId;
          if (parentId) {
            const parent = material?.find((e) => e._id === parentId);
            if (parent) {
              d['parentId'] = parentId;
              d['parentName'] = parent?.packageDetail?.packageName || parent?.productDetail?.productName || parent?.serviceDetail?.serviceName;
            }
          }
        } else if (d?.parentId) {
          const parent = material?.find((e) => e._id === d?.parentId);
          if (parent) {
            d['parentName'] = parent?.packageDetail?.packageName || parent?.productDetail?.productName || parent?.serviceDetail?.serviceName;
          }
        }
        d['isChecked'] = false;
        d['hideSelection'] = [ASSET_STATUS.lost].includes(d.status) || d?.manualStatus === ASSET_STATUS.reserved ? true : false;

        const invoiceMaterial = invoiceData?.find((obj) => obj?._id === d?._id || obj?._id === d?.uniqueId);
        d['isInvoiceCreated'] = invoiceMaterial ? true : false;
        d['isAllowedStartDate'] = d?.manualStartDate && !invoiceMaterial ? true : false;
        d['isAllowedEndDate'] = d?.manualEndDate ? true : false;
        if (d['isAllowedEndDate'] && invoiceMaterial) {
          d['minEndDate'] = new Date(invoiceMaterial?.endDate);
        }
      });

      if (productAssets?.length) {
        if (user?.user?.brandPolicy?.rentalOnFieldStep && currentStep === RENTAL_STEPS.onField) {
          if (productAssets.filter((e) => e?.receivingTicketId || e?.returnTicketId).length) {
            setNextStep(true);
          } else {
            setNextStepToolTip(rentalManagementMessage.receivingCreateToProceed);
          }
        } else {
          if (
            productAssets?.every((e) =>
              [
                RENTAL_INTERNAL_ASSET_STATUS.consumed,
                RENTAL_INTERNAL_ASSET_STATUS.complete,
                RENTAL_INTERNAL_ASSET_STATUS.return,
                'Returned',
                RENTAL_INTERNAL_ASSET_STATUS.partiallyConsumed
              ].includes(e.rentalAssetStatus)
            )
          ) {
            setNextStep(true);
          } else {
            setNextStepToolTip(rentalManagementMessage.receivingCreatedAndDelivered);
          }
        }
      } else {
        setNextStep(true);
      }

      setUniqueReceivingTicket([...new Set(productAssets.filter((d) => d.receivingTicketId !== undefined).map((d) => d.receivingTicketId))]);

      productAssets = [...productAssets?.filter((e) => !e.isReplaced), ...productAssets?.filter((e) => e.isReplaced)];

      productAssets?.forEach((e, index) => {
        e.index = index + 1;
      });

      const services: any = [];
      if (rentalPolicyData?.showServiceOnFieldStep) {
        material
          ?.filter((m) => m.type === MATERIAL_TYPE.service)
          ?.forEach((s: any, index: any) => {
            s.index = index + 1;
            s.uniqueId = s._id;
            s.materialId = s?.materialId;
            s.description = s?.serviceDetail?.serviceDescription || '';
            s.displayType = startCase(MATERIAL_TYPE.service);
            s.serviceName = s?.serviceDetail?.serviceName;
            s.startDate = s?.actualStartDate;
            s.endDate = s?.actualEndDate;
            s.maxInvoiceDate = invoiceData?.find((ele) => ele._id === s.uniqueId)?.endDate;
            const parent = material?.find((e) => e._id === s?.parentId);
            if (parent) {
              s['parentName'] = parent?.packageDetail?.packageName || parent?.productDetail?.productName || parent?.serviceDetail?.serviceName;
            }
            s.qty = getNestedQty(material, s);
            services.push(s);
          });
      }
      setServiceData(services);

      dispatch({ type: 'initialize', data: productAssets, count: productAssets?.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const getColumn = async () => {
    setColumns(null);
    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: sidebarResource.product,
          fieldNames: ['productName']
        },
        {
          resource: sidebarResource.serializedAsset,
          fieldNames: ['serialNumber', 'position', 'wellNumber', 'warehouse', 'jobCount', 'currentGpsLocation', 'currentGpsWellNames']
        }
      ]
    });
    const productFields = data?.find((d) => d.resource === sidebarResource.product)?.fieldNames || [];
    const assetFields = data?.find((d) => d.resource === sidebarResource.serializedAsset)?.fieldNames || [];
    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        minWidth: 100,
        width: 100,
        disabled: true,
        Cell: ({ row }) => (
          <div
            className="d-flex align-items-center gap-2"
            style={{
              backgroundColor: [ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert]?.includes(
                row?.original?.status
              )
                ? COLOUR_MASTER.lostAssets.background
                : ''
            }}
          >
            <h5 className="text-truncate">{row?.original?.index}</h5>
            {row?.original?.loadingTicketId && !row?.original?.receivingTicketId && !row?.original?.returnTicketId && (
              <HtmlTooltip title={`Loading Ticket ${row?.original?.loadingTicketStatus}`}>
                <LocalShippingIcon fontSize="small" color={'primary'} />
              </HtmlTooltip>
            )}
            {row?.original?.receivingTicketId && (
              <HtmlTooltip title={`Receiving Ticket ${row?.original?.receivingTicketStatus}`}>
                <LocalShippingIcon fontSize="small" color={'primary'} className="[transform:scaleX(-1)_!important]" />
              </HtmlTooltip>
            )}
            {row?.original?.returnTicketId && (
              <HtmlTooltip title={`Return Ticket ${row?.original?.returnTicketStatus}`}>
                <LocalShippingIcon fontSize="small" color={'primary'} className="[transform:scaleX(-1)_!important]" />
              </HtmlTooltip>
            )}
            {row?.original?.warehouseId &&
              row?.original?.warehouseId !== rentalManagementData?.warehouse?.optionValue &&
              !row?.original?.returnTicketId &&
              !row?.original?.receivingTicketId && (
                <HtmlTooltip title="Will be returned to different facility">
                  <IconButton size="small">
                    <HelpIcon fontSize="small" color="primary" />
                  </IconButton>
                </HtmlTooltip>
              )}
            {row?.original?.isReplaced && (
              <HtmlTooltip
                title={`This Asset has been Replaced by ${row?.original?.replaceAsset} (Due to following reason-"${row?.original?.replaceReason}")`}
              >
                <InfoIcon fontSize="small" color={'primary'} />
              </HtmlTooltip>
            )}
            {row?.original?.currentLocationNotMatchWithGps && (
              <HtmlTooltip title="Asset location needs to be update in Equipt">
                <WarningIcon style={{ fontSize: '14px' }} fontSize="small" color="error" />
              </HtmlTooltip>
            )}
          </div>
        )
      },
      {
        accessor: 'assetNumber',
        Header: 'Details',
        disabled: true,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p className="text-truncate">{row?.original?.assetNumber}</p>
            <IconButton
              size="small"
              onClick={() => {
                if (row.original.type === 'Asset') {
                  window.open(`${routes.serializedAssetDetail.path}/${row?.original?._id}`);
                } else if (row.original.type === 'Product') {
                  window.open(`${routes.productDetail.path}/${row?.original?.materialId}`);
                }
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
            {((row?.original?.nonSerializeAsset && row?.original?.nonSerializeAsset?.length > 0) ||
              (row?.original?.productSerialNumbers && row?.original?.productSerialNumbers?.length > 0)) && (
                <Box>
                  <HtmlTooltip title={`Serial Numbers`}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setShowInfo({
                          open: true,
                          data: {
                            productName: row?.original?.productName,
                            data: row?.original?.nonSerializeAsset?.length > 0 ? row?.original?.nonSerializeAsset : row?.original?.productSerialNumbers
                          },
                          type: `Serial Numbers`
                        });
                      }}
                    >
                      <InfoIcon fontSize="small" color={'primary'} />
                    </IconButton>
                  </HtmlTooltip>
                </Box>
              )}
            {row?.original?.isRepairJob && (
              <HtmlTooltip title={`${resources?.repairJob?.titleSingular}`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.repairJobDetail.path}/${row?.original?.repairJob}`);
                  }}
                >
                  <MdHomeRepairService fontSize="20" color="#163340" />
                </IconButton>
              </HtmlTooltip>
            )}
            {row?.original?.isRepairOrder && (
              <HtmlTooltip title={`${resources?.repairOrder?.titleSingular}`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes?.repairOrderDetail?.path}/${row?.original?.repairOrder}`);
                  }}
                >
                  <MdHandyman fontSize="20" color="#163340" />
                </IconButton>
              </HtmlTooltip>
            )}
          </div>
        )
      },
      {
        accessor: 'displayType',
        Header: 'Type',
        disabled: true,
        Cell: ({ row }) => (row?.original?.displayType ? <h5 className="text-truncate">{row?.original?.displayType}</h5> : <NoDataCell />)
      },
      {
        accessor: 'parentName',
        Header: 'Parent',
        disabled: true,
        Cell: ({ row }) => (row?.original?.parentName ? <h5 className="text-truncate">{row?.original?.parentName}</h5> : <NoDataCell />)
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        disabled: true,
        Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.qty || <NoDataCell />}</h5>
      },
      ...(assetFields?.find((f) => f.fieldName === 'serialNumber')
        ? [
          {
            accessor: 'serialNumber',
            Header: assetFields?.find((f) => f.fieldName === 'serialNumber')?.fieldLabel || 'Serial Number',
            Cell: ({ row }) => (row?.original?.serialNumber ? <h5 className="text-truncate">{row?.original?.serialNumber}</h5> : <NoDataCell />)
          }
        ]
        : []),
      ...(assetFields?.find((f) => f.fieldName === 'position')
        ? [
          {
            accessor: 'position',
            Header: assetFields?.find((f) => f.fieldName === 'position')?.fieldLabel || 'Position',
            Cell: ({ row }) => (row?.original?.position ? <h5 className="text-truncate">{row?.original?.position}</h5> : <NoDataCell />)
          }
        ]
        : []),
      ...(assetFields?.find((f) => f.fieldName === 'jobCount')
        ? [
          {
            accessor: 'jobCount',
            Header: assetFields?.find((f) => f.fieldName === 'jobCount')?.fieldLabel || 'jobCount',
            Cell: ({ row }) => (row?.original?.jobCount ? <h5 className="text-truncate">{row?.original?.jobCount}</h5> : <NoDataCell />)
          }
        ]
        : []),
      ...(assetFields?.find((f) => f.fieldName === 'currentGpsLocation')
        ? [
          {
            accessor: 'currentGpsLocation',
            Header: assetFields?.find((f) => f.fieldName === 'currentGpsLocation')?.fieldLabel || 'currentGpsLocation',
            cell: ({ row }) => <GpsLocationCell value={row?.original?.currentGpsLocation} />
          }
        ]
        : []),
      ...(assetFields?.find((f) => f.fieldName === 'currentGpsWellNames')
        ? [
          {
            accessor: 'currentGpsWellNames',
            Header: assetFields?.find((f) => f.fieldName === 'currentGpsWellNames')?.fieldLabel || 'currentGpsWellNames',
            cell: ({ row }) => <FreeStyleMultiSelect value={row?.original?.currentGpsWellNames} />
          }
        ]
        : []),
      {
        accessor: 'productName',
        Header: productFields?.find((f) => f.fieldName === 'productName')?.fieldLabel || 'Product',
        Cell: ({ row }) =>
          row?.original?.productName ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row?.original?.productName}</h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.productDetail.path}/${row?.original?.productId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'description',
        Header: 'Description',
        Cell: ({ row }) => (row?.original?.description ? <h5 className="text-truncate">{row?.original?.description}</h5> : <NoDataCell />)
      },
      {
        accessor: 'warehouse',
        Header: assetFields?.find((f) => f.fieldName === 'warehouse')?.fieldLabel || 'Plant',
        Cell: ({ row }) =>
          row?.original?.warehouse ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row?.original?.warehouse}</h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.warehouseDetail.path}/${row?.original?.warehouseId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'loadingTicket',
        Header: 'Loading Ticket',
        Cell: ({ row }) =>
          row?.original?.loadingTicket ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row?.original?.loadingTicket}</h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.deliveryTicketDetail.path}/${row?.original?.loadingTicketId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'receivingTicket',
        Header: 'Receiving Ticket',
        Cell: ({ row }) =>
          row?.original?.receivingTicket ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row?.original?.receivingTicket}</h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.deliveryTicketDetail.path}/${row?.original?.receivingTicketId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'returnTicket',
        Header: 'Return Ticket',
        Cell: ({ row }) =>
          row?.original?.returnTicket ? (
            <div className="flex items-center gap-2">
              <h5 className="text-truncate">{row?.original?.returnTicket}</h5>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.deliveryTicketDetail.path}/${row?.original?.returnTicketId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'returnQty',
        Header: 'Returned Qty',
        Cell: ({ row }) => (row?.original?.returnQty ? <h5 className="text-truncate">{row?.original?.returnQty}</h5> : <NoDataCell />)
      },
      {
        accessor: 'status',
        Header: 'Asset Status',
        Cell: ({ row }) => (row?.original?.status ? <h5 className="text-truncate">{row?.original?.status}</h5> : <NoDataCell />)
      },
      ...(assetFields?.find((f) => f.fieldName === 'wellNumber')
        ? [
          {
            accessor: 'wellNumber',
            Header: assetFields?.find((f) => f.fieldName === 'wellNumber')?.fieldLabel,
            accessorFn: (original) => {
              return isArray(original?.wellNumber)
                ? original?.wellNumber[0]?.optionLabel
                : isObject(original?.wellNumber)
                  ? original?.wellNumber?.optionLabel
                  : original?.wellNumber;
            },
            Cell: ({ row }) => (
              <DropdownCell
                permissions={permissions}
                permissionForLinks={{}}
                field={{
                  fieldName: 'wellNumber',
                  lookupResource: sidebarResource.wellNumber
                }}
                original={row?.original}
              />
            )
          }
        ]
        : []),
      {
        accessor: 'manualStartDate',
        Header: 'Actual Start Date',
        Cell: ({ row }) =>
          row?.original?.manualStartDate ? (
            <h5 className="text-truncate" title={`${displayDate(row?.original?.manualStartDate)}`}>
              {displayDate(row?.original?.manualStartDate)}
            </h5>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'manualEndDate',
        Header: 'Actual End Date',
        Cell: ({ row }) =>
          row?.original?.manualEndDate ? (
            <h5 className="text-truncate" title={`${displayDate(row?.original?.manualEndDate)}`}>
              {displayDate(row?.original?.manualEndDate)}
            </h5>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'startDate',
        Header: 'System Start Date',
        show: false,
        Cell: ({ row }) =>
          row?.original?.startDate ? (
            <h5 className="text-truncate" title={`${displayDate(row?.original?.startDate)}`}>
              {displayDate(row?.original?.startDate)}
            </h5>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'endDate',
        Header: 'System End Date',
        show: false,
        Cell: ({ row }) =>
          row?.original?.endDate ? (
            <h5 className="text-truncate" title={`${displayDate(row?.original?.endDate)}`}>
              {displayDate(row?.original?.endDate)}
            </h5>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'rentalAssetStatus',
        Header: 'Rental Asset Status',
        Cell: ({ row }) => (row?.original?.rentalAssetStatus ? <h5 className="text-truncate">{row?.original?.rentalAssetStatus}</h5> : <NoDataCell />)
      }
    ];
    if (user?.user?.brandPolicy?.rentalReceivingStepConsume) {
      column.push({
        accessor: 'consumeQty',
        Header: 'Consumed Qty',
        Cell: ({ row }) => (row?.original?.consumeQty ? <h5 className="text-truncate">{row?.original?.consumeQty}</h5> : <NoDataCell />)
      });
    }
    column.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) => {
        return (
          <>
            {allowedToEdit ? (
              <HtmlTooltip
                title={
                  row?.original?.isInvoiceCreated && !row?.original?.isAllowedEndDate
                    ? 'Invoice Created - Cannot change Start Date'
                    : row?.original?.isAllowedStartDate === false && row?.original?.isAllowedEndDate === false
                      ? `Can change the Date after delivered`
                      : row?.original?.isAllowedEndDate === false && row?.original?.isAllowedStartDate !== true
                        ? `Can change the End Date after received`
                        : `Update - Start Date/End Date`
                }
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={row?.original?.isAllowedStartDate || row?.original?.isAllowedEndDate ? false : true}
                    onClick={() => {
                      setOpenChangeActualDateDialog({ isBulkUpdate: false, open: true, data: row?.original, records: [row?.original] });
                    }}
                  >
                    <Edit fontSize="small" color={row?.original?.isAllowedStartDate || row?.original?.isAllowedEndDate ? 'primary' : 'inherit'} />
                  </IconButton>
                </span>
              </HtmlTooltip>
            ) : null}
          </>
        );
      }
    });
    setColumns(column);
  };

  const checkAssetPolicy = (status) => {
    let result: any = null;
    const statusPolicy = assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === status);
    if (statusPolicy) {
      if (statusPolicy?.products && statusPolicy?.products?.length > 0) {
        const assetIds = selectedRecords?.filter((r) => r?.type === 'Asset' && statusPolicy?.products?.includes(r?.productId))?.map((a) => a?._id);
        if (assetIds && assetIds?.length > 0) {
          result = { statusPolicy: statusPolicy, assetIds: assetIds };
        }
      } else {
        result = { statusPolicy: statusPolicy, assetIds: selectedRecords?.filter((r) => r?.type === 'Asset')?.map((a) => a?._id) };
      }
    }
    return result;
  };

  const handleTicketDialog = (ticketType, deliveryToType, open = true) => {
    const data = {};
    data['ticketName'] = rentalManagementData.rentalJobName;
    data['referenceId'] = rentalManagementData._id;
    data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.customer;
    data['pickupFrom'] = rentalManagementData?.customerAccount?.optionValue;
    data['pickupFromAddress'] = selectedRecords[0]?.currentLocation;
    data['deliveryToType'] = deliveryToType;
    if (deliveryToType === DELIVERY_FROM_TO_TYPE.supplier) {
      if (selectedRecords.length) {
        data['deliveryTo'] = selectedRecords[0].owner;
        data['deliveryToAddress'] = '';
        data['isDeliveryToDisable'] = true;
      }
    } else {
      if (selectedRecords[0].warehouseId && ticketType === DELIVERY_TICKET_TYPE.return) {
        data['deliveryTo'] = selectedRecords[0].warehouseId;
        data['deliveryToAddress'] = selectedRecords[0].currentLocation;
        //data['isDeliveryToDisable'] = true;
      } else {
        data['deliveryTo'] = rentalManagementData?.warehouse?.optionValue;
        data['deliveryToAddress'] = rentalManagementData?.warehouse?.address;
      }
    }
    data['startDate'] = rentalManagementData?.estimateStartDate;
    data['endDate'] = rentalManagementData?.estimateStartDate;
    data['isPickupFromDisable'] = true;

    if (rentalManagementData?.padName?.optionValue) {
      data['padName'] = rentalManagementData?.padName?.optionValue;
    }
    if (rentalManagementData?.wellName?.optionValue) {
      data['wellName'] = rentalManagementData?.wellName?.optionValue;
    }
    if (selectedRecords?.find((e) => !isEmpty(e?.wellNumber))) {
      data['wellNumber'] = getUniqueWellNumber(selectedRecords);
    } else if (rentalManagementData?.wellNumber) {
      if (rentalManagementData?.wellNumber?.optionValue) {
        data['wellNumber'] = rentalManagementData?.wellNumber?.optionValue;
      } else {
        data['wellNumber'] = rentalManagementData?.wellNumber?.map((e) => e?.optionValue);
      }
    }
    if (rentalManagementData?.afeNumber) {
      data['afeNumber'] = rentalManagementData?.afeNumber;
    }
    if (rentalManagementData?.processor?.optionValue) {
      data['processor'] = rentalManagementData?.processor?.optionValue;
    }
    const receivingStatus = user?.user?.brandPolicy?.rentalReceivingAvailableStatus ? ASSET_STATUS.available : ASSET_STATUS.underReview;
    const statusPolicy = checkAssetPolicy(receivingStatus);
    if (statusPolicy && selectedRecords?.filter((e) => e.type === 'Asset')?.length) {
      setOpenAssetDetailDialog({
        open: open,
        statusPolicy: statusPolicy?.statusPolicy,
        _ids: statusPolicy?.assetIds,
        referenceData: data,
        ticketType: ticketType
      });
    } else {
      setShowTicketDialog({ open: open, ticketType: ticketType, data: data });
    }
  };

  const handleAddAssetToRepairJob = (repairJobId) => {
    axiosInstance()
      .post(`${repairJob.api}/${repairJobId}/assets`, {
        assets: selectedRecords?.map((s) => {
          return { _id: s._id, currentStatus: s.status };
        })
      })
      .then(({ data }) => {
        axiosInstance()
          .patch(`${repairJob.api}/${repairJobId}/status`, { status: REPAIR_JOB_STATUS.inProgress })
          .then(({ data: { data } }) => { })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleAddAssetsToRepairOrder = async (repairOrderData: any) => {
    let rows = uniqBy(selectedRecords, '_id').map((record: any) => ({
      materialId: record._id,
      type: MATERIAL_TYPE.serializedAsset,
      qty: 1,
      parentId: null
    }));
    axiosInstance()
      .post(`${repairOrder.api}/${repairOrderData}/product-package`, { material: rows, inUseAsset: showRepairOrderDialog.inUseAsset })
      .then(() => {
        setShowRepairOrderDialog({ open: false, inUseAsset: false });
        fetchRecords();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handelProcessLoadingTickets = (date = new Date(), status = null) => {
    let data = {};
    const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
    if (loadingTicketIds.length) {
      data['_ids'] = loadingTicketIds?.map((e) => e);
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['signatures'] = [];
      data['warehouse'] = rentalManagementData?.warehouse?.optionValue;
      data['receiveDate'] = date;

      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          if (status) {
            handleChangeStatusInUse(status, openDateDialog.prevStatus, date);
          } else {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: `Delivered Successfully`
            });
            setOpenDateDialog({ open: false, type: null, status: null, prevStatus: null, assets: [], loading: false });
            fetchRecords();
          }
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handelProcessTickets = () => {
    let data = {};
    const receivingTicketId = uniq(map(selectedRecords, 'receivingTicketId'));
    const returnTicketId = uniq(map(selectedRecords, 'returnTicketId'));
    const ticketIds: any = [];
    receivingTicketId?.forEach((e) => {
      if (e && e !== undefined) {
        ticketIds.push(e);
      }
    });
    returnTicketId?.forEach((e) => {
      if (e && e !== undefined) {
        ticketIds.push(e);
      }
    });
    if (ticketIds.length) {
      data['_ids'] = ticketIds;
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['signatures'] = [];
      data['warehouse'] = rentalManagementData?.warehouse?.optionValue;
      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Received Successfully`
          });
          if (
            receivingTicketId?.length &&
            selectedRecords?.filter((e) => e.type === 'Asset')?.length &&
            user?.user?.brandPolicy?.rentalRepairAutoCreate
          ) {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: 'Repair Order created for received assets'
            });
          }
          fetchRecords();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleConsumProduct = (data) => {
    const products = [];
    if (data) {
      selectedRecords?.forEach((e) => {
        products.push({ product: e.materialId, loadingTicketId: e.loadingTicketId, qty: parseInt(data.qty) });
      });
    } else {
      selectedRecords?.forEach((e) => {
        products.push({ product: e.materialId, loadingTicketId: e.loadingTicketId, qty: parseInt(e.qty) - parseInt(e.consumeQty || 0) });
      });
    }
    setOkBtnLoading(true);

    if (showConformationConsume?.type === 'revert') {
      axiosInstance()
        .post(`${rentalManagement.api}/revert-consume-product/${rentalManagementData._id}`, { products: products })
        .then(({ data }) => {
          setOkBtnLoading(false);
          setShowConformationConsume({ open: false, type: '' });
          setShowConformationConsumeMultiple(false);
          fetchRecords();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      axiosInstance()
        .post(`${rentalManagement.api}/consume-product/${rentalManagementData._id}`, { products: products })
        .then(({ data }) => {
          setOkBtnLoading(false);
          setShowConformationConsume({ open: false, type: '' });
          setShowConformationConsumeMultiple(false);
          fetchRecords();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleAutoConsume = (data: any[]) => {
    const products = data?.map((d) => ({ product: d.materialId, qty: parseInt(d.qty) }));
    axiosInstance()
      .post(`${rentalManagement.api}/consume-product/${rentalManagementData._id}`, { products })
      .then(({ data }) => {
        setOkBtnLoading(false);
        setShowConformationConsume({ open: false, type: '' });
        setShowConformationConsumeMultiple(false);
        fetchRecords();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleChangeStatus = () => {
    setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: true }));
    axiosInstance()
      .put(`${productInventoryHelperObject.api}/update-status`, {
        comment: statusToUpdate.message,
        assets: selectedRecords.map((m) => ({
          _id: m?._id ?? m?.id,
          currentStatus: m.status
        })),
        status: statusToUpdate.status,
        reference: {
          _id: rentalManagementData._id,
          type: 'Rental'
        }
      })
      .then(({ data }) => {
        setStatusToUpdate({ open: false, isUpdating: false, status: '', message: '' });
        fetchRecords();
        toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
      })
      .catch((error) => {
        setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: false }));
        toastConfig.setToastConfig(error);
      });
  };

  const handelRevertTickets = () => {
    setOkBtnLoading(true);
    const receivingTicketIds = uniq(
      map(
        selectedRecords?.filter((e) => e?.receivingTicketId),
        'receivingTicketId'
      )
    );
    const returnTicketIds = uniq(
      map(
        selectedRecords?.filter((e) => e?.returnTicketId),
        'returnTicketId'
      )
    );
    if (receivingTicketIds?.length || returnTicketIds?.length) {
      let data = [];
      receivingTicketIds?.forEach((receivingTicketId) => {
        const ele: any = {};
        ele._id = receivingTicketId;
        ele.products = selectedRecords?.filter((e) => e?.receivingTicketId === receivingTicketId && e?.type === 'Product')?.map((e) => e?.productId);
        ele.assets = selectedRecords?.filter((e) => e?.receivingTicketId === receivingTicketId && e?.type === 'Asset')?.map((e) => e?._id);
        data.push(ele);
      });
      returnTicketIds?.forEach((returnTicketId) => {
        const ele: any = {};
        ele._id = returnTicketId;
        ele.products = selectedRecords?.filter((e) => e?.returnTicketId === returnTicketId && e?.type === 'Product')?.map((e) => e?.productId);
        ele.assets = selectedRecords?.filter((e) => e?.returnTicketId === returnTicketId && e?.type === 'Asset')?.map((e) => e?._id);
        data.push(ele);
      });
      axiosInstance()
        .put(`${deliveryTicket.api}/revert-partially`, data)
        .then(({ data: { data } }) => {
          setOkBtnLoading(false);
          setShowConformationRevertTicket(false);
          fetchRecords();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Reverted Successfully`
          });
        })
        .catch((error) => {
          setOkBtnLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handelCancleTickets = async () => {
    setOkBtnLoading(true);
    try {
      const inTransitReceivingTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e?.receivingTicketStatus === DELIVERY_TICKET_STATUS.inTransit),
          'receivingTicketId'
        )
      );
      const inTransitReturnTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e?.returnTicketStatus === DELIVERY_TICKET_STATUS.inTransit),
          'returnTicketId'
        )
      );

      if (inTransitReceivingTicketIds.length || inTransitReturnTicketIds.length) {
        await axiosInstance().put(`${deliveryTicket.api}/revert`, { ids: [...inTransitReceivingTicketIds, ...inTransitReturnTicketIds] });
      }

      const deliveredReceivingTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e?.receivingTicketStatus === DELIVERY_TICKET_STATUS.delivered),
          'receivingTicketId'
        )
      );
      const deliveredReturnTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e?.returnTicketStatus === DELIVERY_TICKET_STATUS.delivered),
          'returnTicketId'
        )
      );

      if (deliveredReceivingTicketIds.length || deliveredReturnTicketIds.length) {
        await axiosInstance().post(`${deliveryTicket.api}/cancel-delivered-ticket`, {
          _ids: [...deliveredReceivingTicketIds, ...deliveredReturnTicketIds]
        });
      }

      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: `Cancelled Successfully`
      });
      setOkBtnLoading(false);
      setShowConformationCancleTicket({ open: false });
      fetchRecords();
      fetchRentalData();
    } catch (error) {
      setOkBtnLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const handleSubmitChangeDates = (values) => {
    if (!openChangeActualDateDialog.data) return;
    setIsSubmitting(true);
    let ids = [],
      asset = [];
    if (openChangeActualDateDialog.isBulkUpdate) {
      selectedRecords?.forEach((ele) => {
        ids.push(ele.uniqueId);
        asset.push(ele._id?.split('_')[0]);
      });
    } else {
      ids = [openChangeActualDateDialog?.data?.uniqueId];
      asset = [openChangeActualDateDialog?.data?._id?.split('_')[0]];
    }
    const data: any = {
      ids: ids,
      asset: asset
    };
    if (values.manualStartDate) {
      data.startDate = displayDate(values.manualStartDate);
    }
    if (values.manualEndDate) {
      data.endDate = displayDate(values.manualEndDate);
    }
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData?._id}/start-end-date`, data)
      .then((response) => {
        toastConfig.setToastConfig({
          open: true,
          message: response?.data?.message,
          type: 'success'
        });
        setOpenChangeActualDateDialog({ open: false, data: null, records: null, isBulkUpdate: false });
        setIsSubmitting(false);
        fetchRecords();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setIsSubmitting(false);
      });
  };

  const handleChangeStatusInUse = (status, prevStatus, date) => {
    setOpenDateDialog((prev) => ({ ...prev, loading: true }));
    const assets = selectedRecords
      ?.filter((e: any) => e.type === 'Asset')
      ?.map((e) => {
        return { asset: e._id, uniqueId: e.uniqueId };
      });
    if (assets?.length) {
      axiosInstance()
        .put(`${rentalManagement.api}/${rentalManagementData._id}/assets-inuse-standby`, {
          assets,
          status: status,
          prevStatus: prevStatus,
          date: date
        })
        .then(({ data }) => {
          fetchRecords();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setOpenDateDialog({ open: false, type: null, status: null, prevStatus: null, assets: [], loading: false });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setOpenDateDialog((prev) => ({ ...prev, loading: false }));
        });
    } else {
      fetchRecords();
      setOpenDateDialog({ open: false, type: null, status: null, prevStatus: null, assets: [], loading: false });
    }
  };

  const handleChangeDate = (date) => {
    setOpenDateDialog((prev) => ({ ...prev, loading: true }));
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData._id}/assets-date-update`, { assets: openDateDialog.assets, date: date })
      .then(({ data }) => {
        fetchRecords();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setOpenDateDialog({ open: false, type: null, status: null, prevStatus: '', assets: [], loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setOpenDateDialog((prev) => ({ ...prev, loading: false }));
      });
  };

  const handleOpenReplaceAssetReason = (rows) => {
    const data: any = {};
    data.referenceType = 'rentalJob';
    data.referenceId = rentalManagementData._id;
    const assets: any = [];
    selectedRecords?.forEach((element: any) => {
      const result = rows.filter((f) => f.productId === element?.product?.optionValue && !f.isCounted);
      if (result.length) {
        assets.push({
          _id: element._id,
          uniqueId: element.uniqueId,
          status: element.status,
          deliveryTicketId: element.loadingTicketId,
          newId: result[0]._id
        });
        result[0].isCounted = true;
      }
    });
    data.assets = assets;
    setShowReplaceReason({ open: true, data: data });
  };

  const handleReplaceAsset = (reason) => {
    setIsSubmitting(true);
    axiosInstance()
      .post(`${deliveryTicket.api}/replace-assets`, { ...showReplaceReason.data, reason: reason })
      .then(({ data }) => {
        setShowReplaceReason({ open: false, data: [] });
        setAddSerializedAssetDialog({ open: false, products: [], type: '' });
        setIsSubmitting(false);
        fetchRecords();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Assets Replaced Successfully`
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSwapAssets = (rows) => {
    const data = [];
    selectedRecords?.forEach((element: any) => {
      const result = rows.filter((f) => f.productId === element?.product?.optionValue && !f.isCounted);
      if (result.length) {
        data.push({ _id: element._id, newId: result[0]._id, parentId: element?.parentId });
        result[0].isCounted = true;
      }
    });
    setIsSubmitting(true);
    axiosInstance()
      .post(`${rentalManagement.api}/swap-inuse-assets`, {
        assets: data?.map((e) => e._id),
        newAssets: data?.map((e) => {
          return { asset: e.newId, oldAssetParentId: e?.parentId };
        }),
        rentalJob: rentalManagementData?._id
      })
      .then(({ data }) => {
        setAddSerializedAssetDialog({ open: false, products: [], type: '' });
        setIsSubmitting(false);
        fetchRecords();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Assets Swapped Successfully`
        });
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const rightSideContents = () => {
    return (
      <>
        <span>
          <PreviewDownloadMultiple referenceIds={uniqueReceivingTicket} />
        </span>
        {allowedToEdit && !rentalPolicyData?.hideAssetChangeStatus && (
          <ThemeButton
            disabled={
              selectedRecords?.length === 0 ||
              isOffline ||
              selectedRecords?.some((f) => f.type === 'Product') ||
              selectedRecords?.some((f) =>
                [
                  ASSET_STATUS.lost,
                  ASSET_STATUS.delivered,
                  ASSET_STATUS.inUse,
                  ASSET_STATUS.standBy,
                  ASSET_STATUS.standByNotChargeable,
                  ASSET_STATUS.inTransit,
                  ASSET_STATUS.inRepair,
                  ASSET_STATUS.repair,
                  ASSET_STATUS.scrapRequested
                ].includes(f.status)
              )
            }
            onClick={handleClick}
            endIcon={<ExpandMore />}
          >
            {'Change Status'}
          </ThemeButton>
        )}
        {(repairJobCount > 0 || repairOrderCount > 0) && (
          <ThemeButton
            onClick={openLinkActions}
            endIcon={<ExpandMore fontSize="inherit" />}
          >
            Order(s)
          </ThemeButton>
        )}
        {showProcessDeliveryTicket && !isOffline && (
          <>
            <HtmlTooltip title="Process Multiple Receiving/Return Ticket(s)">
              <ThemeButton
                iconForMobile={<AddBoxRoundedIcon />}
                mobileTooltip='Process Ticket'
                buttonType='theme'
                onClick={() => {
                  setOpenDeliveryTicketDialog(true);
                }}
              >
                {'Process Ticket'}
              </ThemeButton>
            </HtmlTooltip>
          </>
        )}
      </>
    );
  };

  const handleAssetData = (assetsData) => {
    const assetsAdd: any = [];
    selectedRecords.forEach((r) => {
      const obj: any = {};
      obj._id = r?.uniqueId;
      obj.asset = r?._id;
      const matchedAsset = assetsData?.find((asset) => asset._id === obj.asset);
      if (matchedAsset) {
        const { _id, ...assetData } = matchedAsset;
        obj.assetData = assetData;
      }
      assetsAdd.push(obj);
    });
    setIsSubmitting(true);
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData._id}/change-asset-data`, assetsAdd)
      .then(({ data }) => {
        fetchRecords();
        setIsSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setOpenAssetDataDialog(false);
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleMainTabChange = (event: any, newValue: number) => {
    setTabValue(newValue);
    dispatch({ type: 'selection', selectedRecords: [] });
  };

  return (
    <>
      {serviceData?.length > 0 && (
        <CustomTabs value={tabValue} onChange={handleMainTabChange} className="mb-0">
          <CustomTab value={0} label={'Assets/Products'} primaryColor={true} />
          <CustomTab value={1} label={'Services'} primaryColor={true} />
        </CustomTabs>
      )}
      <TabPanel value={tabValue} index={0}>
        <DetailsPageHeader
          isAddButtonVisible={false}
          isActionButtonVisible={true}
          actionButtonMenuItems={
            <ActionButtonMenuItems
              {...{
                selectedRecords,
                setOpenMessageDialog,
                handleTicketDialog,
                setShowRemoveAssetFromReceivingTicketDialog,
                setShowQtyDialog,
                handelProcessLoadingTickets,
                handelProcessTickets,
                isOffline,
                setIsExistingRentalJob,
                setAddSerializedAssetDialog,
                permissions,
                setShowRepairJobDialog,
                setShowRepairOrderDialog,
                setShowConformationRevertTicket,
                setShowConformationCancleTicket,
                setShowConformationConsume,
                setShowConformationConsumeMultiple,
                dataRows,
                user,
                setOpenDateDialog,
                currentStep,
                columns,
                rentalManagementData,
                rentalPolicyData,
                setTransferAnotherPackageialog,
                hideDeliveryTicketDelivered,
                openChangeActualDateDialog,
                setOpenChangeActualDateDialog,
                setOpenAssetDataDialog,
                assetPolicyData,
                validateAction,
                resources
              }}
            />
          }
          actionButtonProps={{ disabled: selectedRecords.length === 0 }}
          rightSideContents={rightSideContents()}
          hasXpadding
        />
        <Grid size={{ xs: 12, md: 12, sm: 12 }}>
          {columns ? (
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              refreshGrid={fetchRecords}
              hideAction={!(allowedToEdit || isProcessor)}
              hideSelection={!(allowedToEdit || isProcessor)}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <ReceivingServices
          services={serviceData}
          rentalManagementData={rentalManagementData}
          fetchRecords={fetchRecords}
          allowedToEdit={allowedToEdit}
          stepFullScreen={stepFullScreen}
        />
      </TabPanel>
      <Menu
        anchorEl={anchorLinkActionEl}
        keepMounted
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        id="orders-menu"
        open={Boolean(anchorLinkActionEl)}
        onClose={closeLinkActions}
      >
        {repairJobCount > 0 && (
          <MenuItem
            onClick={() => {
              OpenInNewWindow(routes.repairJob.path);
            }}
          >
            {`Created ${resources?.repairJob?.titleSingular}`}
          </MenuItem>
        )}
        {repairOrderCount > 0 && (
          <MenuItem
            onClick={() => {
              OpenInNewWindow(routes?.repairOrder?.path);
            }}
          >
            {`Created ${resources?.repairOrder?.titleSingular}`}
          </MenuItem>
        )}
      </Menu>
      <Menu
        id="status-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        {selectedRecords?.filter((f) => f.type === 'Asset').length === selectedRecords.length && allowUpdateStatus && (
          <>
            {selectedRecords?.filter(
              (f) =>
                ((f.hasOwnProperty('receivingTicketId') && f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.delivered) ||
                  (f.hasOwnProperty('returnTicketId') && f?.returnTicketStatus === DELIVERY_TICKET_STATUS.delivered)) &&
                [ASSET_STATUS.underReview].includes(f.status)
            )?.length === selectedRecords?.length && (
                <>
                  <MenuItem
                    disabled={selectedRecords?.filter((e) => e?.status === ASSET_STATUS.available)?.length ? true : false}
                    onClick={() => {
                      setAnchorEl(null);
                      setStatusToUpdate({ open: true, isUpdating: false, status: ASSET_STATUS.available, message: '' });
                    }}
                  >
                    {ASSET_STATUS.available}
                  </MenuItem>
                </>
              )}
            <MenuItem
              disabled={selectedRecords?.filter((e) => e?.status === ASSET_STATUS.scrap)?.length ? true : false}
              onClick={() => {
                setAnchorEl(null);
                setStatusToUpdate({ open: true, isUpdating: false, status: ASSET_STATUS.scrap, message: '' });
              }}
            >
              {ASSET_STATUS.scrap}
            </MenuItem>
            <MenuItem
              disabled={selectedRecords?.filter((e) => e?.status === ASSET_STATUS.lost)?.length ? true : false}
              onClick={() => {
                setAnchorEl(null);
                setStatusToUpdate({ open: true, isUpdating: false, status: ASSET_STATUS.lost, message: '' });
              }}
            >
              {ASSET_STATUS.lost}
            </MenuItem>
            <MenuItem
              disabled={selectedRecords?.filter((e) => e?.status === ASSET_STATUS.needRepair)?.length ? true : false}
              onClick={() => {
                setAnchorEl(null);
                setStatusToUpdate({ open: true, isUpdating: false, status: ASSET_STATUS.needRepair, message: '' });
              }}
            >
              {ASSET_STATUS.needRepair}
            </MenuItem>
            <MenuItem
              disabled={selectedRecords?.filter((e) => e?.status === ASSET_STATUS.needRecert)?.length ? true : false}
              onClick={() => {
                setAnchorEl(null);
                setStatusToUpdate({ open: true, isUpdating: false, status: ASSET_STATUS.needRecert, message: '' });
              }}
            >
              {ASSET_STATUS.needRecert}
            </MenuItem>
          </>
        )}
      </Menu>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={showTicketDialog.ticketType}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          referenceData={showTicketDialog.data}
          assets={
            assetsData?.length
              ? selectedRecords
                ?.filter((e) => e.type === 'Asset')
                ?.map((ele) => {
                  const matchedAsset = assetsData.find((asset) => asset._id === ele._id);
                  if (matchedAsset) {
                    const { _id, ...assetData } = matchedAsset;
                    return {
                      ...ele,
                      assetData: { ...assetData }
                    };
                  }
                  return ele;
                })
              : selectedRecords?.filter((e) => e.type === 'Asset')
          }
          products={
            showTicketDialog.ticketType === DELIVERY_TICKET_TYPE.return
              ? showQtyDialog?.data && showQtyDialog?.data?.length > 0
                ? showQtyDialog.data.map((d) => ({ ...d, _id: d?.productId, qty: d.returnQuantity }))
                : []
              : selectedRecords
                ?.filter((e) => e.type === 'Product')
                .map((d) => ({
                  _id: d?.materialId,
                  qty: d?.qty,
                  uniqueId: d?.uniqueId,
                  productSerialNumbers: d?.productSerialNumbers
                }))
          }
          onClose={() => {
            setShowTicketDialog({ open: false, ticketType: '', data: {} });
            if (assetsData?.length) {
              setAssetsData([]);
            }
          }}
          onSuccess={() => {
            setShowTicketDialog({ open: false, ticketType: '', data: {} });
            if (showTicketDialog.ticketType === DELIVERY_TICKET_TYPE.return) {
              if (showQtyDialog?.data || showQtyDialog?.data?.length > 0) {
                let consumableData = showQtyDialog.data.filter((d) => d?.consumeQuantity > 0);
                consumableData = consumableData.map((d) => ({ ...d, materialId: d?.row?.materialId, qty: d.consumeQuantity }));
                if (consumableData.length > 0) {
                  handleAutoConsume(consumableData);
                }
              }
            }
            fetchRecords();
            fetchRentalData();
          }}
        />
      )}
      {openAssetDetailDialog.open && (
        <AssetDetailsChangeDialog
          ids={openAssetDetailDialog._ids}
          statusPolicy={openAssetDetailDialog.statusPolicy}
          setAssetsData={setAssetsData}
          ticketType={openAssetDetailDialog.ticketType}
          onClose={() => setOpenAssetDetailDialog({ open: false, statusPolicy: null, _ids: null, referenceData: null, ticketType: null })}
          onSuccess={() => {
            const referenceData = openAssetDetailDialog.referenceData;
            const ticketType = openAssetDetailDialog.ticketType;
            setOpenAssetDetailDialog({ open: false, statusPolicy: null, _ids: null, referenceData: null, ticketType: null });
            setShowTicketDialog({ open: true, ticketType: ticketType, data: referenceData });
          }}
        />
      )}
      {showQtyDialog.open && (
        <ReturnTicketDialog
          products={selectedRecords.filter((d: any) => d?.type === 'Product')}
          onSuccess={(data) => {
            setShowQtyDialog({ data: data, open: false });
            const receivingStatus = user?.user?.brandPolicy?.rentalReceivingAvailableStatus ? ASSET_STATUS.available : ASSET_STATUS.underReview;
            const statusPolicy = checkAssetPolicy(receivingStatus);
            if (statusPolicy && selectedRecords?.filter((e) => e.type === 'Asset')?.length) {
              setOpenAssetDetailDialog((ps: any) => ({ ...ps, open: true }));
            } else {
              setShowTicketDialog((ps: any) => ({ ...ps, open: true }));
            }
          }}
          onClose={() => {
            setShowQtyDialog({ open: false, data: null });
            setShowTicketDialog({ open: false, ticketType: '', data: {} });
          }}
          invoiceQtyData={invoiceData}
        />
      )}
      {isExistingRentalJob && (
        <ExistingRentalJob
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          referenceData={rentalManagementData}
          productInventory={selectedRecords?.filter((e) => e.type === 'Asset')}
          onClose={() => setIsExistingRentalJob(false)}
          onSuccess={() => {
            setIsExistingRentalJob(false);
            fetchRecords();
          }}
          assetPolicyData={assetPolicyData}
        />
      )}
      {showRemoveAssetFromReceivingTicketDialog && (
        <ConfirmationDialog
          open={showRemoveAssetFromReceivingTicketDialog}
          message={`Are you sure you want to revert selected records from Receiving Ticket(s)?`}
          onClose={() => {
            setShowRemoveAssetFromReceivingTicketDialog(false);
          }}
          onOk={() => {
            setOkBtnLoading(true);
            const groupByCalls = groupBy(selectedRecords, 'receivingTicketId');
            let apiCalls = [];
            Object.keys(groupByCalls).forEach((key) => {
              apiCalls.push(axiosInstance().put(`${deliveryTicket.api}/${key}/assets`, { ids: groupByCalls[key].map((m) => m._id) }));
            });
            Promise.all(apiCalls)
              .then(() => {
                toastConfig.setToastConfig({
                  open: true,
                  type: 'success',
                  message: `Selected records removed from assiged Receiving Ticket(s)`
                });
                fetchRecords();
              })
              .catch((error) => {
                toastConfig.setToastConfig(error);
              })
              .finally(() => {
                setOkBtnLoading(false);
                setShowRemoveAssetFromReceivingTicketDialog(false);
              });
          }}
          okBtnLoading={okBtnLoading}
        />
      )}

      {statusToUpdate.open && (
        <Dialog
          open
          TransitionComponent={CustomDialogTransition}
          classes={{
            paper: classes.paper
          }}
          onClose={() => setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: false, open: false }))}
        >
          <CustomDialogHeader
            title="Are you sure ?"
            showRequiredLabel={false}
            onClose={() => setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: false, open: false }))}
          />
          <CustomDialogContent>
            <Box className="my-2">
              {[ASSET_STATUS.available, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert].includes(statusToUpdate.status) ? (
                <h4>You want to change the status of selected assets to {statusToUpdate.status} ?</h4>
              ) : (
                <TextField
                  id="outlined-multiline-static"
                  label={`Please enter the reason for ${statusToUpdate.status}`}
                  multiline
                  fullWidth
                  rows={4}
                  value={statusToUpdate.message}
                  variant="outlined"
                  onChange={(e) => {
                    setStatusToUpdate((prevState) => ({ ...prevState, message: e.target.value }));
                  }}
                />
              )}
            </Box>
          </CustomDialogContent>
          <CustomDialogFooter>
            <ThemeButton
              onClick={() => setStatusToUpdate((prevState) => ({ ...prevState, open: false }))}
              buttonType='transparent'
            >
              Cancel
            </ThemeButton>
            <ThemeButton
              disabled={statusToUpdate.isUpdating}
              buttonType='theme'
              isLoading={statusToUpdate.isUpdating}
            >
              Change Status
            </ThemeButton>
          </CustomDialogFooter>
        </Dialog>
      )}
      {openDeliveryTicketDialog && (
        <MultipleTicket
          referenceData={rentalManagementData}
          ticketType={[DELIVERY_TICKET_TYPE.receiving, DELIVERY_TICKET_TYPE.return]}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          handleClose={() => {
            setOpenDeliveryTicketDialog(false);
            fetchRecords();
          }}
        />
      )}
      {showRepairJobDialog && (
        <ManageRepairJob
          referenceType="Rental Job"
          referenceData={{
            _id: rentalManagementData._id,
            warehouse: selectedRecords[0].warehouseId,
            wellName: rentalManagementData?.wellName?.optionValue,
            wellNumber: rentalManagementData?.wellNumber
              ? rentalManagementData?.wellNumber?.optionValue || rentalManagementData?.wellNumber?.map((e) => e?.optionValue)
              : null,
            afeNumber: rentalManagementData?.afeNumber
          }}
          onClose={() => setShowRepairJobDialog(false)}
          onSuccess={(obj) => {
            handleAddAssetToRepairJob(obj?._id);
            setShowRepairJobDialog(false);
            fetchRecords();
          }}
        />
      )}
      {showRepairOrderDialog.open && (
        <ManageRepairOrder
          referenceType="rentalJob"
          referenceData={{
            _id: rentalManagementData._id,
            warehouse: selectedRecords[0].warehouseId,
            customerAccount: rentalManagementData?.customerAccount?.optionValue,
            customerContact: rentalManagementData?.customerContact?.optionValue
          }}
          onClose={() => setShowRepairOrderDialog({ open: false, inUseAsset: false })}
          onSuccess={(obj) => {
            handleAddAssetsToRepairOrder(obj?._id);
          }}
          isClone={false}
        />
      )}
      {showConformationConsume?.open && (
        <ConsumeProduct
          products={selectedRecords}
          handleClose={() => setShowConformationConsume({ open: false, type: '' })}
          loading={okBtnLoading}
          type={showConformationConsume.type}
          handleSucess={(data) => {
            handleConsumProduct(data);
          }}
        />
      )}
      {showInfo.open && (
        <ShowNonSerializeAssets data={showInfo.data} onClose={() => setShowInfo({ open: false, data: {}, type: null })} title={showInfo?.type} />
      )}
      {showConformationConsumeMultiple && (
        <ConfirmationDialog
          open={showConformationConsumeMultiple}
          message={`Are you sure you want to consumed selected products?`}
          onClose={() => {
            setShowConformationConsumeMultiple(false);
          }}
          onOk={() => {
            handleConsumProduct(null);
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {showConformationRevertTicket && (
        <ConfirmationDialog
          open={showConformationRevertTicket}
          message={`Are you sure you want to revert ticket for the selected line item ?`}
          onClose={() => {
            setShowConformationRevertTicket(false);
          }}
          onOk={() => {
            handelRevertTickets();
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {showConformationCancleTicket.open && (
        <ConfirmationDialog
          open={showConformationCancleTicket.open}
          message={`This action will cancel the complete Receiving/Return Ticket(s). Are you sure?`}
          onClose={() => {
            setShowConformationCancleTicket({ open: false });
          }}
          onOk={() => {
            handelCancleTickets();
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {openChangeActualDateDialog.open && (
        <ChangeActualDateDialog
          data={openChangeActualDateDialog.data}
          records={openChangeActualDateDialog.records}
          loading={isSubmitting}
          isBulkUpdate={openChangeActualDateDialog.isBulkUpdate}
          onClose={() => {
            setOpenChangeActualDateDialog({ open: false, data: null, records: null, isBulkUpdate: false });
          }}
          handleSubmit={handleSubmitChangeDates}
          rentalId={rentalManagementData?._id}
        />
      )}
      {openMessageDialog.open && (
        <CustomMessageDialog
          open={openMessageDialog.open}
          errorMessages={openMessageDialog.errorMessages}
          onClose={() => {
            setOpenMessageDialog({ open: false, errorMessages: [] });
          }}
        />
      )}
      {addSerializedAssetDialog.open && (
        <AddSerializedAsset
          addSerializedAsset={(rows) => {
            if (addSerializedAssetDialog.type === 'RentalJobReplaceAsset') {
              handleOpenReplaceAssetReason(rows);
            } else {
              handleSwapAssets(rows);
            }
          }}
          handleSerializedAssetClose={() => {
            setAddSerializedAssetDialog({ open: false, products: [], type: '' });
          }}
          referenceType={addSerializedAssetDialog.type}
          referenceData={{
            _id: rentalManagementData?._id,
            warehouse: rentalManagementData?.warehouse?.optionValue
          }}
          isAdding={isSubmitting}
          selectedProducts={addSerializedAssetDialog.products}
          filterByPlant={rentalManagementData?.warehouse}
        />
      )}
      {openDateDialog.open && (
        <DateDialog
          loading={openDateDialog.loading}
          onClose={() => {
            setOpenDateDialog({ open: false, type: null, status: null, prevStatus: '', assets: [], loading: false });
          }}
          handleSubmit={(date, status) => {
            if (
              openDateDialog.type === 'changeStatus' &&
              [ASSET_STATUS.inUse, ASSET_STATUS.standBy, ASSET_STATUS.standByNotChargeable]?.includes(openDateDialog.status)
            ) {
              handleChangeStatusInUse(openDateDialog.status, openDateDialog.prevStatus, date);
            } else if (openDateDialog.type === 'changeStatus' && [ASSET_STATUS.delivered]?.includes(openDateDialog.status)) {
              handelProcessLoadingTickets(date, status);
            } else if (openDateDialog.type === 'changeDate') {
              handleChangeDate(date);
            }
          }}
          type={openDateDialog.type}
          status={openDateDialog.status}
          title={
            openDateDialog.type === 'changeStatus'
              ? openDateDialog.status === ASSET_STATUS.delivered
                ? 'Delivered Date'
                : `Change Status ${openDateDialog.status}`
              : `Change Date ${openDateDialog.status}`
          }
          assets={openDateDialog.assets}
        />
      )}
      {showReplaceReason.open && (
        <ReplaceAssetReason
          handleClose={() => setShowReplaceReason({ open: false, data: {} })}
          loading={isSubmitting}
          handleSucess={(data) => {
            handleReplaceAsset(data?.reason);
          }}
        />
      )}
      {transferAnotherPackageDialog && (
        <TransferToAnotherPackageDialog
          onClose={() => {
            setTransferAnotherPackageialog(false);
          }}
          onSuccess={() => {
            fetchRecords();
            setTransferAnotherPackageialog(false);
          }}
          assets={selectedRecords}
          rentalManagementData={rentalManagementData}
          material={allMaterial}
          assetPolicyData={assetPolicyData}
        />
      )}
      {openAssetDataDialog && (
        <ChangePreviousAssetDataDialog
          onClose={() => {
            setOpenAssetDataDialog(false);
          }}
          statusPolicy={assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === ASSET_STATUS.reserved)}
          staticLookUpFilters={{
            wellNumber: rentalManagementData?.wellNumber
              ? rentalManagementData?.wellNumber?.optionValue || rentalManagementData?.wellNumber?.map((e) => e?.optionValue)
              : null
          }}
          ids={selectedRecords?.map((r) => r?._id)}
          onSuccess={handleAssetData}
          loading={isSubmitting}
        />
      )}
    </>
  );
};

export default ReceivingTicket;

const ActionButtonMenuItems = ({
  selectedRecords,
  setOpenMessageDialog,
  handleTicketDialog,
  setShowRemoveAssetFromReceivingTicketDialog,
  setShowQtyDialog,
  handelProcessLoadingTickets,
  handelProcessTickets,
  isOffline,
  setIsExistingRentalJob,
  setAddSerializedAssetDialog,
  permissions,
  setShowRepairJobDialog,
  setShowRepairOrderDialog,
  setShowConformationRevertTicket,
  setShowConformationCancleTicket,
  setShowConformationConsume,
  setShowConformationConsumeMultiple,
  dataRows,
  user,
  setOpenDateDialog,
  currentStep,
  columns,
  rentalManagementData,
  setTransferAnotherPackageialog,
  hideDeliveryTicketDelivered,
  openChangeActualDateDialog,
  setOpenChangeActualDateDialog,
  setOpenAssetDataDialog,
  assetPolicyData,
  validateAction,
  resources
}) => {
  const checkUniqStatus = () => {
    if (selectedRecords.length === 0) {
      return false;
    } else if (
      uniq(
        map(
          selectedRecords?.filter((e: any) => e.type === 'Asset'),
          'status'
        )
      ).length === 1
    ) {
      return true;
    } else {
      return false;
    }
  };

  const getParentPackageId = (uniqueId) => {
    const product = rentalManagementData?.material?.find((d) => d?._id === uniqueId);
    if (!product?.parentId) {
      return;
    }
    const data = rentalManagementData?.material?.find((d) => d?._id === product?.parentId);
    if (!data?.parentId) {
      return data?.materialId;
    } else {
      getParentPackageId(data?.parentId);
    }
  };

  const getMinMaxDates = () => {
    const minMaxDates = selectedRecords?.reduce(
      (acc, ele) => {
        if (ele?.manualStartDate) {
          const startDate = new Date(ele?.manualStartDate);
          if (!acc.minStartDate || startDate < acc.minStartDate) {
            acc.minStartDate = startDate;
          }
        }
        if (ele?.manualEndDate) {
          const endDate = new Date(ele?.manualEndDate);
          if (!acc.maxEndDate || endDate > acc.maxEndDate) {
            acc.maxEndDate = endDate;
          }
        }
        return acc;
      },
      { minStartDate: null, maxEndDate: null }
    );
    return minMaxDates;
  };

  return (
    <>
      {currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.rentalOnFieldStep && !hideDeliveryTicketDelivered && (
        <HtmlTooltip title={!permissions?.deliveryTicket?.isUpdate ? actionDisable : ''}>
          <MenuItem
            id={'received-on-field-menu-item'}
            onClick={() => {
              if (validateAction(rentalManagementActions.deliveredToCustomer)) {
                if (user?.user?.brandPolicy?.assetDeliveredStatus) {
                  setOpenDateDialog({
                    open: true,
                    type: 'changeStatus',
                    status: ASSET_STATUS.delivered,
                    prevStatus: ASSET_STATUS.delivered,
                    assets: selectedRecords?.filter((e: any) => e.type === 'Asset')?.map((e) => e._id),
                    loading: false
                  });
                } else {
                  handelProcessLoadingTickets();
                }
              }
            }}
            disabled={!permissions?.deliveryTicket?.isUpdate}
          >
            Received on Field
          </MenuItem>
        </HtmlTooltip>
      )}
      {currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.assetDeliveredStatus && user?.user?.brandPolicy?.rentalOnFieldStep && (
        <Box>
          {selectedRecords.length > 0 &&
            selectedRecords.filter(
              (e: any) =>
                e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
                [ASSET_STATUS.delivered, ASSET_STATUS.inUse, ASSET_STATUS.standByNotChargeable].includes(e?.status) &&
                [
                  RENTAL_INTERNAL_ASSET_STATUS.delivered,
                  RENTAL_INTERNAL_ASSET_STATUS.inUse,
                  RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable
                ].includes(e?.rentalAssetStatus)
            ).length === selectedRecords.length &&
            checkUniqStatus() && (
              <MenuItem
                id={'change-status-to-standby-menu-item'}
                onClick={() => {
                  setOpenDateDialog({
                    open: true,
                    type: 'changeStatus',
                    status: ASSET_STATUS.standBy,
                    prevStatus: selectedRecords[0].status,
                    assets: selectedRecords?.filter((e: any) => e.type === 'Asset')?.map((e) => e._id),
                    loading: false
                  });
                }}
              >
                {`Change Status to ${ASSET_STATUS.standBy}`}
              </MenuItem>
            )}
          {selectedRecords.length > 0 &&
            selectedRecords.filter(
              (e: any) =>
                e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
                [ASSET_STATUS.delivered, ASSET_STATUS.inUse, ASSET_STATUS.standBy].includes(e?.status) &&
                [RENTAL_INTERNAL_ASSET_STATUS.delivered, RENTAL_INTERNAL_ASSET_STATUS.inUse, RENTAL_INTERNAL_ASSET_STATUS.standBy].includes(
                  e?.rentalAssetStatus
                )
            ).length === selectedRecords.length &&
            checkUniqStatus() && (
              <MenuItem
                id={'change-status-to-standby-not-chargeble-menu-item'}
                onClick={() => {
                  setOpenDateDialog({
                    open: true,
                    type: 'changeStatus',
                    status: ASSET_STATUS.standByNotChargeable,
                    prevStatus: selectedRecords[0].status,
                    assets: selectedRecords?.filter((e: any) => e.type === 'Asset')?.map((e) => e._id),
                    loading: false
                  });
                }}
              >
                {`Change Status to ${ASSET_STATUS.standByNotChargeable}`}
              </MenuItem>
            )}
          {selectedRecords.length > 0 &&
            selectedRecords.filter(
              (e: any) =>
                e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
                [ASSET_STATUS.delivered, ASSET_STATUS.standBy, ASSET_STATUS.standByNotChargeable].includes(e?.status) &&
                [
                  RENTAL_INTERNAL_ASSET_STATUS.delivered,
                  RENTAL_INTERNAL_ASSET_STATUS.standBy,
                  RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable
                ].includes(e?.rentalAssetStatus)
            ).length === selectedRecords.length &&
            checkUniqStatus() && (
              <MenuItem
                id={'change-status-to-in-use-menu-item'}
                onClick={() => {
                  setOpenDateDialog({
                    open: true,
                    type: 'changeStatus',
                    status: ASSET_STATUS.inUse,
                    prevStatus: selectedRecords[0].status,
                    assets: selectedRecords?.filter((e: any) => e.type === 'Asset')?.map((e) => e._id),
                    loading: false
                  });
                }}
              >
                {`Change Status to ${ASSET_STATUS.inUse}`}
              </MenuItem>
            )}
          {selectedRecords.length > 0 &&
            selectedRecords.filter(
              (e: any) =>
                e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
                [
                  RENTAL_INTERNAL_ASSET_STATUS.inUse,
                  RENTAL_INTERNAL_ASSET_STATUS.standBy,
                  RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable
                ].includes(e?.rentalAssetStatus)
            ).length === selectedRecords.length &&
            checkUniqStatus() && (
              <MenuItem
                id={'change-serialized-asset-last-status-date-menu-item'}
                onClick={() => {
                  setOpenDateDialog({
                    open: true,
                    type: 'changeDate',
                    status: '',
                    prevStatus: '',
                    assets: selectedRecords?.filter((e: any) => e.type === 'Asset')?.map((e) => e._id),
                    loading: false
                  });
                }}
              >
                {`Change ${resources?.serializedAsset?.titleSingular} Last Status Date`}
              </MenuItem>
            )}
        </Box>
      )}
      {((currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.rentalOnFieldStep) ||
        (currentStep === RENTAL_STEPS.receiving && !user?.user?.brandPolicy?.rentalOnFieldStep)) && (
          <>
            <HtmlTooltip title={!permissions?.deliveryTicket?.isCreate ? actionDisable : ''}>
              <MenuItem
                id={'create-receiving-ticket-chargaeble-menu-item'}
                onClick={() => {
                  if (validateAction(rentalManagementActions.createReceivingTicket)) {
                    handleTicketDialog(DELIVERY_TICKET_TYPE.receiving, DELIVERY_FROM_TO_TYPE.plant);
                  }
                }}
                disabled={!permissions?.deliveryTicket?.isCreate}
              >
                {user?.user?.brandPolicy?.rentalOnFieldStep ? `Create Return Ticket (Chargeable)` : `Create Receiving Ticket (Chargeable)`}
              </MenuItem>
            </HtmlTooltip>
            {selectedRecords.length &&
              selectedRecords?.filter((f) => f.hasOwnProperty('receivingTicketId') && f?.receivingTicketStatus === DELIVERY_TICKET_STATUS.new)?.length ===
              selectedRecords?.length ? (
              <MenuItem
                id={'remove-receiving-ticket-menu-item'}
                onClick={() => {
                  setShowRemoveAssetFromReceivingTicketDialog(true);
                }}
              >
                Remove Receiving Ticket
              </MenuItem>
            ) : null}
            <HtmlTooltip title={!permissions?.deliveryTicket?.isCreate ? actionDisable : ''}>
              <MenuItem
                id={'create-return-ticket-non-chargeble-menu-item'}
                onClick={() => {
                  if (validateAction(rentalManagementActions.createReturnTicket)) {
                    if (selectedRecords?.every((e) => e.type === 'Asset')) {
                      handleTicketDialog(DELIVERY_TICKET_TYPE.return, DELIVERY_FROM_TO_TYPE.plant);
                    } else {
                      setShowQtyDialog({ open: true, data: null });
                      handleTicketDialog(DELIVERY_TICKET_TYPE.return, DELIVERY_FROM_TO_TYPE.plant, false);
                    }
                  }
                }}
                disabled={!permissions?.deliveryTicket?.isCreate}
              >
                {user?.user?.brandPolicy?.rentalOnFieldStep ? `Create Return Ticket (Spares)` : `Create Return Ticket (Non-Chargeable)`}
              </MenuItem>
            </HtmlTooltip>
            {permissions?.sublease?.isRead && (
              <HtmlTooltip title={!permissions?.deliveryTicket?.isCreate ? actionDisable : ''}>
                <MenuItem
                  id={'create-delivery-ticket-supplier-menu-item'}
                  onClick={() => {
                    if (validateAction(rentalManagementActions.createSupplierDeliveryTicket)) {
                      handleTicketDialog(DELIVERY_TICKET_TYPE.receiving, DELIVERY_FROM_TO_TYPE.supplier);
                    }
                  }}
                  disabled={!permissions?.deliveryTicket?.isCreate}
                >
                  Create Delivery Ticket for Supplier
                </MenuItem>
              </HtmlTooltip>
            )}
          </>
        )}
      {currentStep === RENTAL_STEPS.receiving && !hideDeliveryTicketDelivered && (
        <HtmlTooltip title={!permissions?.deliveryTicket?.isUpdate ? actionDisable : ''}>
          <MenuItem
            id={'received-items-menu-item'}
            onClick={() => {
              if (validateAction(rentalManagementActions.receiveItems)) {
                handelProcessTickets();
              }
            }}
            disabled={!permissions?.deliveryTicket?.isUpdate}
          >
            {`Received Items`}
          </MenuItem>
        </HtmlTooltip>
      )}
      {!isOffline &&
        ((currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.rentalOnFieldStep) ||
          (currentStep === RENTAL_STEPS.receiving && !user?.user?.brandPolicy?.rentalOnFieldStep)) && (
          <MenuItem
            id={'transfer-to-another-rental-management-menu-item'}
            onClick={() => {
              if (validateAction(rentalManagementActions.transferToAnotherRental)) {
                setIsExistingRentalJob(true);
              }
            }}
          >
            {`Transfer to another ${resources?.rentalManagement?.titleSingular}`}
          </MenuItem>
        )}
      {selectedRecords?.length &&
        selectedRecords?.every((e) => e?.status === ASSET_STATUS.inUse) &&
        selectedRecords?.every((e) => e?.loadingTicketId) &&
        !selectedRecords?.some((e) => e?.receivingTicketId || e?.returnTicketId) &&
        selectedRecords?.map((r) => getParentPackageId(r?.uniqueId))?.every((_id) => _id === getParentPackageId(selectedRecords[0]?.uniqueId)) && (
          <MenuItem
            id={'transfer-to-another-package-menu-item'}
            onClick={() => {
              setTransferAnotherPackageialog(true);
            }}
          >
            {`Transfer to another Package`}
          </MenuItem>
        )}
      {currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.rentalOnFieldStep && (
        <MenuItem
          id={'replace-asset-menu-item'}
          onClick={() => {
            if (validateAction(rentalManagementActions.replaceAsset)) {
              const products = [];
              selectedRecords?.forEach((element) => {
                const foundProduct = products.filter((e) => e._id === element?.product?.optionValue);
                if (foundProduct.length) {
                  foundProduct[0].qty += 1;
                } else {
                  products.push({
                    _id: element?.product?.optionValue,
                    id: element?.product?.optionValue,
                    productName: element?.product?.optionLabel,
                    qty: 1
                  });
                }
              });
              setAddSerializedAssetDialog({ open: true, products: products, type: 'RentalJobReplaceAsset' });
            }
          }}
        >
          Replace Asset
        </MenuItem>
      )}
      {!isOffline &&
        ((currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.rentalOnFieldStep) ||
          (currentStep === RENTAL_STEPS.receiving && !user?.user?.brandPolicy?.rentalOnFieldStep)) && (
          <MenuItem
            id={'swap-in-use-assets-menu-item'}
            onClick={() => {
              if (validateAction(rentalManagementActions.swapInUseAssets)) {
                const products = [];
                selectedRecords?.forEach((element) => {
                  const foundProduct = products.filter((e) => e._id === element?.product?.optionValue);
                  if (foundProduct.length) {
                    foundProduct[0].qty += 1;
                  } else {
                    products.push({
                      _id: element?.product?.optionValue,
                      id: element?.product?.optionValue,
                      productName: element?.product?.optionLabel,
                      qty: 1
                    });
                  }
                });
                setAddSerializedAssetDialog({ open: true, products: products, type: 'RentalJobSwapAsset' });
              }
            }}
          >
            {`Swap In-Use Assets`}
          </MenuItem>
        )}
      {permissions?.repairJob?.isCreate && !isOffline && currentStep === RENTAL_STEPS.receiving && (
        <MenuItem
          id={'create-repair-job-menu-item'}
          onClick={() => {
            if (validateAction(rentalManagementActions.createRepairJob)) {
              setShowRepairJobDialog(true);
            }
          }}
        >
          {`Create ${resources?.repairJob?.titleSingular}`}
        </MenuItem>
      )}
      {permissions?.repairOrder?.isCreate && !isOffline && currentStep === RENTAL_STEPS.receiving && (
        <MenuItem
          id={'create-repair-order-menu-item'}
          onClick={() => {
            if (validateAction(rentalManagementActions.createRepairOrder)) {
              setShowRepairOrderDialog({ open: true, inUseAsset: false });
            }
          }}
        >
          {`Create ${resources?.repairOrder?.titleSingular}`}
        </MenuItem>
      )}
      {((currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.rentalOnFieldStep) ||
        (currentStep === RENTAL_STEPS.receiving && !user?.user?.brandPolicy?.rentalOnFieldStep)) &&
        user?.user?.brandPolicy?.rentalInUseAssetRepair &&
        permissions?.repairOrder?.isCreate &&
        !isOffline &&
        selectedRecords?.length > 0 &&
        selectedRecords?.every((r) => r?.status === ASSET_STATUS.inUse && r?.rentalAssetStatus === RENTAL_INTERNAL_ASSET_STATUS.inUse) && (
          <MenuItem
            id={'create-repair-order-menu-item-in-use-assets'}
            onClick={() => {
              setShowRepairOrderDialog({ open: true, inUseAsset: true });
            }}
          >
            {`Create ${resources?.repairOrder?.titleSingular} (${ASSET_STATUS.inUse} Assets)`}
          </MenuItem>
        )}
      {((currentStep === RENTAL_STEPS.onField && user?.user?.brandPolicy?.rentalOnFieldStep) ||
        (currentStep === RENTAL_STEPS.receiving && !user?.user?.brandPolicy?.rentalOnFieldStep)) && (
          <>
            {!hideDeliveryTicketDelivered && (
              <HtmlTooltip title={!permissions?.deliveryTicket?.isUpdate ? actionDisable : ''}>
                <MenuItem
                  id={'cancel-specific-line-item-menu-item'}
                  onClick={() => {
                    if (validateAction(rentalManagementActions.cancelInTransitTicket)) {
                      setShowConformationRevertTicket(true);
                    }
                  }}
                  disabled={!permissions?.deliveryTicket?.isUpdate}
                >
                  Cancel Specific Line Items
                </MenuItem>
              </HtmlTooltip>
            )}
            <HtmlTooltip title={!permissions?.deliveryTicket?.isUpdate ? actionDisable : ''}>
              <MenuItem
                id={'cancel-receiving-return-ticket-menu-item'}
                onClick={() => {
                  if (validateAction(rentalManagementActions.cancelReceivingReturnTicket)) {
                    setShowConformationCancleTicket({ open: true });
                  }
                }}
                disabled={!permissions?.deliveryTicket?.isUpdate}
              >
                Cancel Receiving/Return Ticket(s)
              </MenuItem>
            </HtmlTooltip>
          </>
        )}
      {selectedRecords?.filter(
        (f) =>
          f.type === 'Product' &&
          !f?.serialized &&
          f.hasOwnProperty('loadingTicketId') &&
          f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
          Number(f?.consumeQty) + Number(f?.returnQty) < Number(f?.qty)
      ).length === selectedRecords.length &&
        user?.user?.brandPolicy?.rentalReceivingStepConsume && (
          <MenuItem
            id={'consumed-menu-item'}
            onClick={() => {
              if (selectedRecords?.length === 1) {
                setShowConformationConsume({ open: true, type: 'add' });
              } else {
                setShowConformationConsumeMultiple(true);
              }
            }}
          >
            {RENTAL_INTERNAL_ASSET_STATUS.consumed}
          </MenuItem>
        )}
      {selectedRecords.length === 1 &&
        selectedRecords?.filter(
          (f) =>
            f.type === 'Product' &&
            f.hasOwnProperty('loadingTicketId') &&
            f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
            f?.consumeQty > 0
        ).length === selectedRecords.length &&
        user?.user?.brandPolicy?.rentalReceivingStepConsume && (
          <MenuItem
            id={'revert-consumed-quantity-menu-item'}
            onClick={() => {
              setShowConformationConsume({ open: true, type: 'revert' });
            }}
          >
            {`Revert Consumed Qty`}
          </MenuItem>
        )}
      {selectedRecords?.length > 0 && (
        <MenuItem
          id={'update-start-date-end-date-menu-item'}
          onClick={() => {
            if (validateAction(rentalManagementActions.updateStartDateEndDate)) {
              const { minStartDate, maxEndDate } = getMinMaxDates();
              setOpenChangeActualDateDialog({
                open: true,
                data: {
                  isAllowedStartDate: selectedRecords?.every((e) => e.isAllowedStartDate),
                  isAllowedEndDate: selectedRecords?.every((e) => e.isAllowedEndDate),
                  manualStartDate: minStartDate?.toISOString(),
                  manualEndDate: maxEndDate?.toISOString()
                },
                records: selectedRecords,
                isBulkUpdate: true
              });
            }
          }}
        >
          Update - Start Date/End Date
        </MenuItem>
      )}
      {assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === ASSET_STATUS.reserved) &&
        selectedRecords?.length > 0 &&
        selectedRecords?.every(
          (r) =>
            r?.type === 'Asset' &&
            [
              RENTAL_INTERNAL_ASSET_STATUS.reserved,
              RENTAL_INTERNAL_ASSET_STATUS.inUse,
              RENTAL_INTERNAL_ASSET_STATUS.standBy,
              RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable
            ]?.includes(r?.rentalAssetStatus)
        ) && (
          <MenuItem
            onClick={() => {
              setOpenAssetDataDialog(true);
            }}
            id={'change-asset-data-menu-item'}
          >
            Change Assets Data
          </MenuItem>
        )}
    </>
  );
};
