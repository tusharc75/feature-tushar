import { Dialog, IconButton, Menu, MenuItem, TextField, Theme } from '@mui/material';
import Box from '@mui/material/Box/Box';
import { makeStyles } from '@mui/styles';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import Edit from '@mui/icons-material/Edit';
import HelpIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { groupBy, isArray, isEmpty, isObject, map, startCase, uniq } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { IoRemoveCircleOutline } from 'react-icons/io5';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CustomMessageDialog from 'src/components/MessageDialog';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { actionDisable, rentalManagementActions, rentalManagementMessage } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../../StateProvider/OfflineContext/OfflineContext';
import axiosInstance from '../../../axios/axiosInstance';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import ReplaceAssetReason from '../../../components/RentalManagment/ReplaceAssetReason';
import {
  ASSET_STATUS,
  COLOUR_MASTER_CLASSES,
  CustomDialogTransition,
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  INVENTORY_OWNER_TYPE,
  MATERIAL_TYPE,
  RENTAL_INTERNAL_ASSET_STATUS,
  cn,
  dateFormatToSend,
  deliveryTicket,
  gridLoadingTimeout,
  rentalManagement,
  serializedAsset,
  sidebarResource
} from '../../../constants/helpers';
import { findOne, objectStore } from '../../../constants/indexdbhelper';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import MultipleTicket from '../../DeliveryTicket/MultipleTicket';
import AddSerializedAsset from '../SerializedAsset/AddSerializedAsset';
import ShowNonSerializeAssets from '../SerializedAsset/ShowNonSerializeAssets';
import { getNestedQty, getRentalDeliveryTicket, getRentalProductAssets } from './../rentalOfflineHelper';
import DateDialog from './DateDialog';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import { FiExternalLink } from 'react-icons/fi';
import { checkProductInside, fetch_rental_product_fields, getParentWellNumber, getUniqueWellNumber } from 'src/components/RentalManagment/helper';
import PreviewDownloadMultiple from '../../../components/DeliveryTicket/PreviewDownloadMultiple';
import { useGetWalkmeInstance, useSetWalkmeData } from 'src/components/CustomIntro';
import { generateDeliveredToCustomer, generateLoadingStepCreateTicketSteps, nextButtonStep } from 'src/pages/RentalManagement/walkmeSteps';
import ChangePreviousAssetDataDialog from 'src/pages/RentalManagement/LoadingTicket/ChangePreviousAssetDataDialog';
import GpsLocationCell from 'src/components/CustomReactTable/Cells/GpsLocationCell';
import WarningIcon from '@mui/icons-material/Warning';
import FreeStyleMultiSelect from 'src/components/CustomReactTable/Cells/FreeStyleMultiSelect';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { ExpandMore } from '@mui/icons-material';
import IconButtonTabs from 'src/components/IconButtonTabs';
import { flattenArray } from 'src/constants/columns';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';

const stepGlobalDataAdded = {
  createTicket: false,
  deliverToCustomer: false
};

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

const LoadingTicket = ({
  rentalManagementData,
  fetchRentalData,
  setNextStep,
  setNextStepToolTip,
  renderedFrom,
  allowedToEdit,
  isProcessor,
  allowUpdateStatus,
  stepFullScreen,
  rentalPolicyData
}) => {
  const walkmeInstance = useGetWalkmeInstance();
  const { setWalkmeData } = useSetWalkmeData();
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const {
    state: { user, permissions, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords, dataRows } = state;

  const [okBtnLoading, setOkBtnLoading] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: '', message: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
  const [showRemoveTicketDialog, setShowRemoveTicketDialog] = useState(false);
  const [uniqueLoadingTicket, setUniqueLoadingTicket] = useState([]);
  const [openDeliveryTicketDialog, setOpenDeliveryTicketDialog] = useState(false);
  const [showProcessDeliveryTicket, setShowProcessDeliveryTicket] = useState(false);
  const [showInfo, setShowInfo] = useState({ open: false, data: {}, type: null });
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false, products: [] });
  const [showReplaceReason, setShowReplaceReason] = useState({ open: false, data: {} });
  const [replaceLoading, setReplaceLoading] = useState(false);
  const [showConformationRevertTicket, setShowConformationRevertTicket] = useState(false);
  const [showConformationCancleTicket, setShowConformationCancleTicket] = useState({ open: false });
  const [checkMTRValidation, setCheckMTRValidation] = useState(false);
  const [mtrConfirmBox, setMtrConfirmBox] = useState(false);
  const [openDateDialog, setOpenDateDialog] = useState({ open: false, type: null, status: null, prevStatus: null, assets: [], loading: false });
  const [openMessageDialog, setOpenMessageDialog] = useState({ open: false, errorMessages: [] });
  const [assetPolicyData, setAssetPolicyData] = useState(null);
  const [openAssetDataDialog, setOpenAssetDataDialog] = useState(false);
  const [columns, setColumns] = useState(null);
  const [hideDeliveryTicketDelivered, setHideDeliveryTicketDelivered] = useState(false);
  const [fieldLabels, setFieldLabels] = useState(null);

  const [view, setView] = useState(rentalPolicyData?.loadingReceivingDefaultView || 'flat');

  const { generateColumns } = useColumns();

  useEffect(() => {
    if (rentalPolicyData?.loadingReceivingDefaultView) {
      setView(rentalPolicyData?.loadingReceivingDefaultView);
    }
  }, [rentalPolicyData]);

  useEffect(() => {
    fetchPolicy();
    fetchFieldLabels();
  }, []);

  useEffect(() => {
    if (fieldLabels) {
      getColumn();
      fetchRecords();
    }
  }, [view, fieldLabels]);

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

  const fetchFieldLabels = async () => {
    try {
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
            fieldNames: [
              'serialNumber',
              'position',
              'wellNumber',
              'padName',
              'mtrAttached',
              'warehouse',
              'jobCount',
              'currentGpsLocation',
              'currentGpsWellNames',
              'gpsNumber',
            ]
          }
        ]
      });
      setFieldLabels(data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getColumn = async () => {
    setColumns(null);
    const productFields = fieldLabels?.find((d) => d.resource === sidebarResource.product)?.fieldNames || [];
    const assetFields = fieldLabels?.find((d) => d.resource === sidebarResource.serializedAsset)?.fieldNames || [];

    const rentalJobProductFields = await fetch_rental_product_fields(rentalManagementData.currency, isOffline);
    const newColumns = generateColumns(
      renderedFrom,
      rentalJobProductFields?.filter((r) => r?.fieldName === 'longDescription'),
      null,
      false,
      rentalManagementData?.currency
    );

    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        minWidth: 100,
        width: 100,
        disabled: true,
        cell: ({ row }) => (
          <div
            className={cn(
              'd-flex align-items-center gap-2',
              row?.original?.warehouseId &&
                row?.original?.warehouseId !== rentalManagementData?.warehouse?.optionValue &&
                !row?.original?.loadingTicketId
                ? COLOUR_MASTER_CLASSES.transferAsset.background
                : [ASSET_STATUS.lost, ASSET_STATUS.scrap, ASSET_STATUS.needRepair, ASSET_STATUS.needRecert]?.includes(row?.original?.status)
                  ? COLOUR_MASTER_CLASSES.lostAssets.background
                  : ''
            )}
          >
            <h5 className="text-truncate">{row?.original?.index}</h5>
            {row?.original?.loadingTicketId && (
              <HtmlTooltip title={`Loading Ticket ${row?.original?.loadingTicketStatus}`}>
                <LocalShippingIcon fontSize="small" color={'primary'} />
              </HtmlTooltip>
            )}
            {row?.original?.warehouseId &&
              row?.original?.warehouseId !== rentalManagementData?.warehouse?.optionValue &&
              !row?.original?.loadingTicketId && (
                <HtmlTooltip title="Will be shipped from different facility">
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
        accessor: 'type',
        Header: 'Type',
        cell: ({ row }) =>
          row.original['type'] ? (
            <p>
              {row.original?.type === MATERIAL_TYPE.serializedAsset ? 'Asset' : `${startCase(row.original?.type)} `}
              {row.original['type'] === MATERIAL_TYPE.product ? (row.original?.serializedProduct ? '(Serialized)' : '(Non-Serialized)') : ''}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'detail',
        Header: 'Details',
        disabled: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <h5 className="text-truncate" title={row?.original?.detail}>
              {row?.original?.detail}
            </h5>
            <IconButton
              size="small"
              onClick={() => {
                if (row?.original?.type === MATERIAL_TYPE.serializedAsset) {
                  window.open(`${routes.serializedAssetDetail.path}/${row?.original?._id}`);
                } else if (row?.original?.type === MATERIAL_TYPE.package) {
                  window.open(`${routes.packagesDetail.path}/${row?.original?._id}`);
                } else if (row?.original?.type === MATERIAL_TYPE.service) {
                  window.open(`${routes.serviceMasterDetail.path}/${row?.original?._id}`);
                } else {
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
          </div>
        )
      },
      ...(view === 'flat'
        ? [
          {
            accessor: 'parentName',
            Header: 'Parent',
            disabled: true,
            cell: ({ row }) => (row?.original?.parentName ? <h5 className="text-truncate">{row?.original?.parentName}</h5> : <NoDataCell />)
          }
        ]
        : []),
      ...newColumns,
      {
        accessor: 'loadingTicket',
        Header: 'Loading Ticket',
        cell: ({ row }) =>
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
        accessor: 'qty',
        Header: 'Qty',
        disabled: true,
        cell: ({ row }) => <h5 className="text-truncate">{row?.original?.qty || <NoDataCell />}</h5>
      },
      ...(assetFields?.find((f) => f.fieldName === 'serialNumber')
        ? [
          {
            accessor: 'serialNumber',
            Header: assetFields?.find((f) => f.fieldName === 'serialNumber')?.fieldLabel || 'Serial Number',
            cell: ({ row }) => (row?.original?.serialNumber ? <h5 className="text-truncate">{row?.original?.serialNumber}</h5> : <NoDataCell />)
          }
        ]
        : []),
      ...(assetFields?.find((f) => f.fieldName === 'position')
        ? [
          {
            accessor: 'position',
            Header: assetFields?.find((f) => f.fieldName === 'position')?.fieldLabel || 'Position',
            cell: ({ row }) => (row?.original?.position ? <h5 className="text-truncate">{row?.original?.position}</h5> : <NoDataCell />)
          }
        ]
        : []),
      ...(assetFields?.find((f) => f.fieldName === 'jobCount')
        ? [
          {
            accessor: 'jobCount',
            Header: assetFields?.find((f) => f.fieldName === 'jobCount')?.fieldLabel || 'Job Count',
            cell: ({ row }) =>
              row?.original?.jobCount || row?.original?.jobCount === 0 ? (
                <h5 className="text-truncate">{row?.original?.jobCount}</h5>
              ) : (
                <NoDataCell />
              )
          }
        ]
        : []),
      ...(assetFields?.find((f) => f.fieldName === 'gpsNumber')
        ? [
          {
            accessor: 'gpsNumber',
            Header: assetFields?.find((f) => f.fieldName === 'gpsNumber')?.fieldLabel || 'gpsNumber',
            cell: ({ row }) => (row?.original?.gpsNumber ? <div><p className="text-truncate">{row?.original?.gpsNumber}</p></div> : <NoDataCell />)
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
      ...(assetFields?.find((f) => f?.fieldName === 'padName')
        ? [
          {
            accessor: 'padName',
            Header: assetFields?.find((f) => f.fieldName === 'padName')?.fieldLabel || 'Pad Name',
            cell: ({ row }) =>
              row?.original?.padName ? (
                <div className="flex items-center gap-2">
                  <h5 className="text-truncate">{row?.original?.padName}</h5>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.padMasterDetail.path}/${row?.original?.padId}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              ) : (
                <NoDataCell />
              )
          }
        ]
        : []),
      ...(assetFields?.find((f) => f.fieldName === 'wellNumber')
        ? [
          {
            accessor: 'wellNumber',
            Header: assetFields?.find((f) => f.fieldName === 'wellNumber')?.fieldLabel || 'Well Number',
            accessorFn: (original) => {
              return isArray(original?.wellNumber)
                ? original?.wellNumber[0]?.optionLabel
                : isObject(original?.wellNumber)
                  ? original?.wellNumber?.optionLabel
                  : original?.wellNumber;
            },
            cell: ({ row }) => (
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
      ...(view === 'flat'
        ? [
          {
            accessor: 'productName',
            Header: productFields?.find((f) => f.fieldName === 'productName')?.fieldLabel || 'Product Name',
            cell: ({ row }) =>
              row?.original?.productName ? (
                <div className="flex items-center gap-2">
                  <h5 className="text-truncate">{row?.original?.productName}</h5>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.productDetail.path}/${row?.original?.materialId}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              ) : (
                <NoDataCell />
              )
          }
        ]
        : []),
      {
        accessor: 'description',
        Header: 'Description',
        cell: ({ row }) => (row?.original?.description ? <h5 className="text-truncate">{row?.original?.description}</h5> : <NoDataCell />)
      },
      {
        accessor: 'warehouse',
        Header: assetFields?.find((f) => f.fieldName === 'warehouse')?.fieldLabel || 'Plant',
        cell: ({ row }) =>
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
        accessor: 'rentalAssetStatus',
        Header: 'Rental Asset Status',
        cell: ({ row }) => (row?.original?.rentalAssetStatus ? <h5 className="text-truncate">{row?.original?.rentalAssetStatus}</h5> : <NoDataCell />)
      },
      {
        accessor: 'status',
        Header: 'Asset Status',
        cell: ({ row }) => (row?.original?.status ? <h5 className="text-truncate">{row?.original?.status}</h5> : <NoDataCell />)
      }
    ];
    if (assetFields?.find((f) => f.fieldName === 'mtrAttached')) {
      column.push({
        accessor: 'mtrAttachedView',
        Header: 'MTR Attached',
        cell: ({ row }) => (row?.original?.mtrAttachedView ? <h5 className="text-truncate">{row?.original?.mtrAttachedView}</h5> : <NoDataCell />)
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
      Cell: ({ row }) =>
        user?.user?.brandPolicy?.assetDeliveredStatus &&
          [RENTAL_INTERNAL_ASSET_STATUS.inUse, RENTAL_INTERNAL_ASSET_STATUS.standBy, RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable]?.includes(
            row?.original?.rentalAssetStatus
          ) &&
          row?.original?.type === MATERIAL_TYPE.serializedAsset ? (
          <HtmlTooltip title={`Change ${resources?.serializedAsset?.titleSingular} Last Status Date`}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                setOpenDateDialog({
                  open: true,
                  type: 'changeDate',
                  status: row?.original?.detail,
                  prevStatus: '',
                  assets: [row?.original?._id],
                  loading: false
                });
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        ) : (
          ''
        )
    });
    setColumns(column);
    setCheckMTRValidation(assetFields?.some((e) => e?.fieldName === 'mtrAttached'));
  };

  const fetchRecords = async () => {
    setNextStep(false);
    setNextStepToolTip(null);
    try {
      var productAssets: any = [];
      var deliveryTicketList: any = [];
      var material: any = [];
      var nonSerializeAsset: any = [];
      var productSerialNumbers: any = [];
      var consumeProducts: any = [];
      var nonSerializedInventory: any = [];

      dispatch({ type: 'selection', selectedRecords: [] });
      dispatch({ type: 'loading', loading: true });

      if (isOffline) {
        productAssets = await getRentalProductAssets(rentalManagementData._id);
        productAssets = productAssets?.map((u) => ({
          ...u,
          type: MATERIAL_TYPE.serializedAsset,
          qty: 1,
          detail: u?.assetNumber,
          productName: u?.product?.optionLabel,
          warehouse: u?.warehouse?.optionLabel,
          warehouseId: u?.warehouse?.optionValue,
          currentOwner: u?.currentOwner,
          currentLocation: u?.currentLocation?.optionValue,
          currentGpsLocation: u?.currentGpsLocation,
          currentGpsWellNames: u?.currentGpsWellNames?.toString(),
          currentLocationNotMatchWithGps: u?.currentLocationNotMatchWithGps,
          rentalAssetStatus: u?.status
        }));

        deliveryTicketList = await getRentalDeliveryTicket(rentalManagementData._id);

        const productResponse = await findOne(objectStore.rentalManagement, rentalManagementData._id);
        material = productResponse.material;
      } else {
        const assetResponse = await axiosInstance().get(`${rentalManagement.api}/${rentalManagementData._id}/inventory`);
        productAssets = assetResponse?.data?.data;

        const result = await axiosInstance().get(
          `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}&referenceId=${rentalManagementData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
        );
        deliveryTicketList = result?.data?.data;

        const productResponse = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`);
        material = productResponse?.data?.data?.material;
        nonSerializeAsset = productResponse?.data?.data?.nonSerializeAsset;
        consumeProducts = productResponse?.data?.data?.consumeProducts;
        productSerialNumbers = productResponse?.data?.data?.productSerialNumbers;
        nonSerializedInventory = productResponse?.data?.data?.nonSerializedInventory;
        setHideDeliveryTicketDelivered(productResponse?.data?.data?.defaultDeliveryTicketStatus === DELIVERY_TICKET_STATUS.delivered ? true : false);
      }

      const loadingTicketProducts = [];
      const loadingTicketAssets = [];

      let newRows: any = [];

      deliveryTicketList?.forEach((element) => {
        if (element.ticketType === DELIVERY_TICKET_TYPE.loading) {
          if (element?.products?.length) {
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
          if (element?.assets?.length) {
            element?.assets?.forEach((ele) => {
              loadingTicketAssets.push({
                ...ele,
                loadingTicketId: element._id,
                loadingTicket: element?.ticketName,
                loadingTicketStatus: element?.status
              });
            });
          }
        }
      });

      productAssets = processAssets(productAssets, loadingTicketAssets);

      if (view === 'flat') {
        newRows = [...productAssets];

        material
          ?.filter(
            (ele) =>
              ele.type === MATERIAL_TYPE.product &&
              ele?.consumableType !== 'Internal' &&
              (!ele?.productDetail?.serializedProduct || productSerialNumbers?.filter((e) => e?._id === ele?._id)?.length)
          )
          ?.forEach((element) => {
            const subProductRows = processProduct(
              '',
              newRows?.length,
              element,
              material,
              nonSerializedInventory,
              loadingTicketProducts,
              consumeProducts,
              nonSerializeAsset,
              productSerialNumbers
            );
            newRows = [...newRows, ...subProductRows];
          });

        newRows = [...newRows?.filter((e) => !e.isReplaced), ...newRows?.filter((e) => e.isReplaced)];

        newRows?.forEach((ele, index) => {
          ele.index = index + 1;
          if (ele.type === MATERIAL_TYPE.serializedAsset) {
            const parentId = material?.find((e) => e._id === ele.uniqueId)?.parentId;
            if (parentId) {
              const parent = material?.find((e) => e._id === parentId);
              if (parent) {
                ele['parentName'] = parent?.packageDetail?.packageName || parent?.productDetail?.productName || parent?.serviceDetail?.serviceName;
                ele['longDescription'] = parent?.longDescription || '';
              }
            }
          } else if (ele?.parentId) {
            const parent = material?.find((e) => e._id === ele?.parentId);
            if (parent) {
              ele['parentName'] = parent?.packageDetail?.packageName || parent?.productDetail?.productName || parent?.serviceDetail?.serviceName;
            }
          }
        });
      } else {
        let rows = material.filter((e) => e.parentId === null)?.filter((ele) => checkProductInside(ele, material));
        newRows = [];
        rows.forEach((parent, i) => {
          if (
            parent.type === MATERIAL_TYPE.product &&
            (!parent?.productDetail?.serializedProduct || productSerialNumbers?.filter((e) => e?._id === parent?._id)?.length)
          ) {
            const subProductRows = processProduct(
              '',
              newRows?.length,
              parent,
              material,
              nonSerializedInventory,
              loadingTicketProducts,
              consumeProducts,
              nonSerializeAsset,
              productSerialNumbers
            );
            newRows = [...newRows, ...subProductRows];
          } else {
            parent.index = i + 1;
            parent.type = parent?.type;
            parent.serializedProduct = parent?.productDetail?.serializedProduct || false;
            parent.detail =
              parent.type === MATERIAL_TYPE.package
                ? parent?.packageDetail?.packageName
                : parent.type === MATERIAL_TYPE.product
                  ? parent?.productDetail?.productName
                  : parent.type === MATERIAL_TYPE.service
                    ? parent?.serviceDetail?.serviceName
                    : '';
            parent.description =
              parent.type === MATERIAL_TYPE.package
                ? parent?.packageDetail?.packageDescription || ''
                : parent.type === MATERIAL_TYPE.product
                  ? parent?.productDetail?.productDescription || ''
                  : parent.type === MATERIAL_TYPE.service
                    ? parent?.serviceDetail?.serviceDescription || ''
                    : '';
            if ([MATERIAL_TYPE.package, MATERIAL_TYPE.service]?.includes(parent.type)) {
              parent.status = ASSET_STATUS.notApplied;
              parent.rentalAssetStatus = '';
            }
            parent.subRows = generateNestedData(
              parent,
              material,
              productAssets,
              loadingTicketProducts,
              consumeProducts,
              nonSerializedInventory,
              nonSerializeAsset,
              productSerialNumbers
            );
            newRows.push(parent);
          }
        });
      }

      const flattenRows = getFilterSelectedRecords(null, flattenArray(newRows));
      if (flattenRows?.length) {
        if (user?.user?.brandPolicy?.rentalOnFieldStep) {
          if (flattenRows.filter((e) => e.loadingTicketStatus).length) {
            setNextStep(true);
          } else {
            setNextStepToolTip(rentalManagementMessage.loadingCreateToProceed);
          }
        } else {
          if (
            flattenRows.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered).length > 0 &&
            flattenRows?.some((e: any) => e.startDate)
          ) {
            setNextStep(true);
          } else {
            if (flattenRows.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered).length === 0) {
              setNextStepToolTip(rentalManagementMessage.loadingCreatedAndDelivered);
            } else {
              setNextStepToolTip(rentalManagementMessage.changeStatusToInUse);
            }
          }
        }
      } else {
        setNextStep(true);
      }

      setUniqueLoadingTicket(deliveryTicketList?.filter((e) => e?.products?.length || e?.assets?.length)?.map((e) => e._id));

      dispatch({ type: 'initialize', data: newRows, count: newRows.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);

      addWalkmeData(flattenRows);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  const generateNestedData = (
    parent,
    material,
    productAssets,
    loadingTicketProducts,
    consumeProducts,
    nonSerializedInventory,
    nonSerializeAsset,
    productSerialNumbers
  ) => {
    let subRows: any = [];

    const assets = productAssets?.filter((e) => e.uniqueId === parent._id);
    assets.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (subRows?.length + 1);
      subRows.push(_subRow);
    });

    const childProduct: any = material.filter((e) => e.parentId === parent._id);
    childProduct.forEach((_subRow, j) => {
      if (
        _subRow.type === MATERIAL_TYPE.product &&
        (!_subRow?.productDetail?.serializedProduct || productSerialNumbers?.filter((e) => e?._id === parent?._id)?.length)
      ) {
        const subProductRows = processProduct(
          parent.index,
          subRows?.length,
          _subRow,
          material,
          nonSerializedInventory,
          loadingTicketProducts,
          consumeProducts,
          nonSerializeAsset,
          productSerialNumbers
        );
        subRows = [...subRows, ...subProductRows];
      } else {
        if (_subRow.type === MATERIAL_TYPE.service && !material?.find((e) => e.parentId === _subRow._id && e.type === MATERIAL_TYPE.product)) {
        } else {
          _subRow.index = parent.index + '.' + (subRows?.length + 1);
          _subRow.serializedProduct = _subRow?.productDetail?.serializedProduct || false;
          _subRow.detail =
            _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageName
              : _subRow.type === MATERIAL_TYPE.product
                ? _subRow?.productDetail?.productName
                : _subRow.type === MATERIAL_TYPE.service
                  ? _subRow?.serviceDetail?.serviceName
                  : '';
          _subRow.description =
            _subRow.type === MATERIAL_TYPE.package
              ? _subRow?.packageDetail?.packageDescription || ''
              : _subRow.type === MATERIAL_TYPE.product
                ? _subRow?.productDetail?.productDescription || ''
                : _subRow.type === MATERIAL_TYPE.service
                  ? _subRow?.serviceDetail?.serviceDescription || ''
                  : '';
          if ([MATERIAL_TYPE.package, MATERIAL_TYPE.service]?.includes(_subRow.type)) {
            _subRow.status = ASSET_STATUS.notApplied;
            _subRow.rentalAssetStatus = '';
          }
          _subRow.subRows = generateNestedData(
            _subRow,
            material,
            productAssets,
            loadingTicketProducts,
            consumeProducts,
            nonSerializedInventory,
            nonSerializeAsset,
            productSerialNumbers
          );
          subRows.push(_subRow);
        }
      }
    });
    return subRows;
  };

  const processAssets = (assets, loadingTicketAssets) => {
    const rows: any = [];
    assets.forEach((_subRow) => {
      const obj: any = {};
      obj.qty = 1;
      obj.type = MATERIAL_TYPE.serializedAsset;
      obj.detail = _subRow?.inventory?.assetNumber;
      obj._id = _subRow?.inventory?._id;
      obj.uniqueId = _subRow?._id;
      obj.isReplaced = _subRow?.isReplaced;
      obj.replaceReason = _subRow?.replaceReason;
      obj.replaceAsset = _subRow?.replaceAsset?.optionLabel;
      obj.rentalAssetStatus = _subRow?.status;
      obj.startDate = _subRow?.startDate;
      obj.wellNumber = _subRow?.inventory?.wellNumber;
      obj.padName = _subRow?.inventory?.padName?.optionLabel;
      obj.padId = _subRow?.inventory?.padName?.optionValue;
      obj.position = _subRow?.inventory?.position;
      obj.currentGpsLocation = _subRow?.inventory?.currentGpsLocation;
      obj.currentGpsWellNames = _subRow?.inventory?.currentGpsWellNames?.toString();
      obj.currentLocationNotMatchWithGps = _subRow?.inventory?.currentLocationNotMatchWithGps;
      obj.productName = _subRow?.inventory?.product?.optionLabel;
      obj.description = _subRow?.product?.productDescription || '';
      obj.materialId = _subRow?.inventory?.product?.optionValue;
      obj.warehouse = _subRow?.inventory?.warehouse?.optionLabel;
      obj.warehouseId = _subRow?.inventory?.warehouse?.optionValue;
      obj.currentOwner = _subRow?.inventory?.currentOwner;
      obj.currentLocation = _subRow?.inventory?.currentLocation?.optionValue;
      const loading = loadingTicketAssets?.find((e) => e?.asset === obj?._id && e?.uniqueId === obj?.uniqueId);
      if (loading) {
        obj.loadingTicket = loading?.loadingTicket;
        obj.loadingTicketId = loading?.loadingTicketId;
        obj.loadingTicketStatus = loading?.loadingTicketStatus;
      }
      obj.hideSelection =
        [ASSET_STATUS.repair, ASSET_STATUS.scrap, ASSET_STATUS.lost].includes(_subRow?.inventory?.status) ||
        [RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.return].includes(obj.rentalAssetStatus) ||
        _subRow?.inventory?.manualStatus === ASSET_STATUS.reserved ||
        obj?.isReplaced;

      obj.mtrAttachedView = _subRow?.inventory?.mtrAttached ? 'Yes' : 'No';
      rows.push({ ..._subRow?.inventory, ...obj });
    });
    return rows;
  };

  const processProduct = (
    parentIndex,
    subRowsCount,
    row,
    material,
    nonSerializedInventory,
    loadingTicketProducts,
    consumeProducts,
    nonSerializeAsset,
    productSerialNumbers
  ) => {
    const productRows: any = [];
    const rows: any = [];

    const isSerialNumberProduct = productSerialNumbers?.filter((e) => e?._id === row?._id)?.length ? true : false;

    if (isSerialNumberProduct) {
      rows.push({ ...row, qty: getNestedQty(material, row) });
    } else {
      const warehouseProduct = nonSerializedInventory?.filter((e) => e._id === row._id);
      if (warehouseProduct?.length) {
        warehouseProduct.forEach((element) => {
          rows.push({ ...row, qty: element.qty, warehouse: element.warehouse });
        });
      } else {
        rows.push({ ...row, qty: getNestedQty(material, row) });
      }
    }

    rows?.forEach((element) => {
      var qty = isSerialNumberProduct ? productSerialNumbers?.filter((e) => e?._id === element?._id)?.length : element.qty;

      var ticketProduct: any = [];
      let ticketProductSerialNumbers: any = [];

      if (element?.warehouse) {
        ticketProduct = loadingTicketProducts?.filter(
          (e) => e.uniqueId === element._id && e.product === element.materialId && e?.warehouse?.optionValue === element?.warehouse?.optionValue
        );
      } else {
        ticketProduct = loadingTicketProducts?.filter((e) => e.uniqueId === element._id && e.product === element.materialId);
      }

      ticketProduct?.forEach((ele) => {
        var consumeQty = 0;

        consumeProducts
          ?.filter((e) => e.product === element.materialId && e.loadingTicketId === ele.loadingTicketId)
          ?.forEach((e) => {
            consumeQty = consumeQty + e.qty;
          });

        const obj: any = {};
        obj._id = element.materialId + '_' + ele.loadingTicketId;
        obj.uniqueId = element?._id;
        obj.materialId = element?.materialId;
        obj.type = MATERIAL_TYPE.product;
        obj.serializedProduct = element?.productDetail?.serializedProduct;
        obj.qty = ele.qty;
        obj.description = element?.productDetail?.productDescription || '';
        obj.detail = element?.productDetail?.productName;
        obj.productName = element?.productDetail?.productName;
        obj.parentId = element?.parentId;
        obj.warehouse = element?.warehouse ? element?.warehouse?.optionLabel : rentalManagementData?.warehouse?.optionLabel;
        obj.warehouseId = element?.warehouse ? element?.warehouse?.optionValue : rentalManagementData?.warehouse?.optionValue;
        obj.status =
          element?.productDetail?.hasOwnProperty('serializedProduct') && element?.productDetail?.serializedProduct === true ? element?.status : 'N/A';
        obj.rentalAssetStatus = element?.status;
        obj.rentalAssetStatus = !element?.productDetail?.serializedProduct
          ? ele.qty === consumeQty
            ? RENTAL_INTERNAL_ASSET_STATUS.consumed
            : consumeQty < ele.qty && consumeQty > 0
              ? RENTAL_INTERNAL_ASSET_STATUS.partiallyConsumed
              : element?.status
          : element?.status;
        obj.nonSerializeAsset = nonSerializeAsset?.filter((e) => e.product === obj.materialId && e._id === element._id);
        obj.loadingTicket = ele?.loadingTicket;
        obj.loadingTicketId = ele?.loadingTicketId;
        obj.loadingTicketStatus = ele?.loadingTicketStatus;
        obj.startDate = element?.actualStartDate;
        obj.wellNumber = getParentWellNumber(material, element?._id);

        if (isSerialNumberProduct) {
          obj.productSerialNumbers = productSerialNumbers
            ?.filter((e) => e?._id === element?._id && ele?.serialNumber?.includes(e?.productSerialNumberDetail?._id))
            ?.map((e) => ({ ...e, assetNumber: e?.productSerialNumberDetail?.serialNumber }));
          ticketProductSerialNumbers = [...ticketProductSerialNumbers, ...(ele?.serialNumber || [])];
        }

        productRows.push(obj);
        qty = qty - ele.qty;
      });

      if (qty > 0) {
        const obj: any = {};
        obj._id = `${element.materialId}_${productRows?.length + 1}`;
        obj.materialId = element?.materialId;
        obj.uniqueId = element?._id;
        obj.type = MATERIAL_TYPE.product;
        obj.serializedProduct = element?.productDetail?.serializedProduct;
        obj.qty = qty;
        obj.description = element?.productDetail?.productDescription || '';
        obj.parentId = element?.parentId;
        obj.detail = element?.productDetail?.productName;
        obj.productName = element?.productDetail?.productName;
        obj.warehouse = element?.warehouse ? element?.warehouse?.optionLabel : rentalManagementData?.warehouse?.optionLabel;
        obj.warehouseId = element?.warehouse ? element?.warehouse?.optionValue : rentalManagementData?.warehouse?.optionValue;
        obj.nonSerializeAsset = nonSerializeAsset?.filter((e) => e.product === obj.materialId && e._id === element._id);
        obj.wellNumber = getParentWellNumber(material, element?._id);
        if (isSerialNumberProduct) {
          obj.productSerialNumbers = productSerialNumbers
            ?.filter((e) => e?._id === element?._id && !ticketProductSerialNumbers?.includes(e?.productSerialNumberDetail?._id))
            ?.map((e) => ({ ...e, assetNumber: e?.productSerialNumberDetail?.serialNumber }));
        }
        productRows.push(obj);
      }
    });

    productRows?.forEach((element, index) => {
      element.index = parentIndex ? `${parentIndex}.${subRowsCount + index + 1}` : `${subRowsCount + index + 1}`;
      element.hideSelection = [RENTAL_INTERNAL_ASSET_STATUS.complete, RENTAL_INTERNAL_ASSET_STATUS.return].includes(element.rentalAssetStatus);
    });

    return productRows;
  };

  const addWalkmeData = (rows: any[]) => {
    if (rows.length === 0) return;
    const stepDataAdded = {
      createTicket: false,
      deliverToCustomer: false
    };
    const walkmeData = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!stepDataAdded.createTicket && r.hideSelection !== true) {
        stepDataAdded.createTicket = true;
        walkmeData.push(generateLoadingStepCreateTicketSteps(i, r.type === MATERIAL_TYPE.serializedAsset && r.mtrAttached !== true));
        if (walkmeInstance && walkmeInstance.type === 'flow' && !Boolean(r?.loadingTicketId) && !stepGlobalDataAdded.createTicket) {
          stepGlobalDataAdded.createTicket = true;
          walkmeInstance.instance.push(
            generateLoadingStepCreateTicketSteps(i, r.type === MATERIAL_TYPE.serializedAsset && r.mtrAttached !== true, true).steps
          );
          walkmeInstance.handleNext();
        }
      }
      if (
        r.hideSelection !== true &&
        !stepDataAdded.deliverToCustomer &&
        !user?.user?.brandPolicy?.rentalOnFieldStep &&
        !hideDeliveryTicketDelivered &&
        !user?.user?.brandPolicy?.assetDeliveredStatus &&
        Boolean(r?.loadingTicketId)
      ) {
        stepDataAdded.deliverToCustomer = true;
        walkmeData.push(generateDeliveredToCustomer(i));
        if (walkmeInstance && walkmeInstance.type === 'flow' && !stepGlobalDataAdded.deliverToCustomer) {
          stepGlobalDataAdded.deliverToCustomer = true;
          const steps = generateDeliveredToCustomer(i).steps;
          steps.push({ ...nextButtonStep, waitForStepInsertion: true });
          walkmeInstance.instance.push(steps);
          walkmeInstance.handleNext();
        }
      }
    }
    setWalkmeData(walkmeData);
  };

  const getFilterSelectedRecords = (materialType = null, records = selectedRecords) => {
    if (materialType) {
      if (materialType === MATERIAL_TYPE.serializedAsset) {
        return records?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset);
      } else {
        return records?.filter(
          (e) => e.type === MATERIAL_TYPE.product && (!e?.serializedProduct || (e?.serializedProduct && e?.productSerialNumbers?.length > 0))
        );
      }
    }
    return records?.filter(
      (e) =>
        e.type === MATERIAL_TYPE.serializedAsset ||
        (e.type === MATERIAL_TYPE.product && (!e?.serializedProduct || (e?.serializedProduct && e?.productSerialNumbers?.length > 0)))
    );
  };

  const handleDeliveryTicketDialog = () => {
    const records = getFilterSelectedRecords();
    if (records.length) {
      const data = {};
      data['ticketName'] = rentalManagementData.rentalJobName;
      data['referenceId'] = rentalManagementData._id;

      if (records[0].warehouseId) {
        data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
        data['pickupFrom'] = records[0].warehouseId;
        data['pickupFromAddress'] = records[0].currentLocation;
      } else if (records[0].currentOwnerType === INVENTORY_OWNER_TYPE.customerAccount) {
        data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.customer;
        data['pickupFrom'] = records[0].currentOwner;
        data['pickupFromAddress'] = records[0].currentLocation;
      } else if (records[0].currentOwnerType === INVENTORY_OWNER_TYPE.supplierAccount) {
        data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.supplier;
        data['pickupFrom'] = records[0].currentOwner;
        data['pickupFromAddress'] = records[0].currentLocation;
      }

      data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.customer;
      data['deliveryTo'] = rentalManagementData?.customerAccount?.optionValue;
      data['deliveryToAddress'] = rentalManagementData.shippingAddress?.optionValue;

      data['startDate'] = rentalManagementData?.estimateStartDate;
      data['endDate'] = rentalManagementData?.estimateStartDate;
      data['isPickupFromDisable'] = true;
      data['isDeliveryToDisable'] = true;

      if (rentalManagementData?.padName?.optionValue) {
        data['padName'] = rentalManagementData?.padName?.optionValue;
      }
      if (rentalManagementData?.wellName?.optionValue) {
        data['wellName'] = rentalManagementData?.wellName?.optionValue;
      }

      if (records?.find((e) => !isEmpty(e?.wellNumber))) {
        data['wellNumber'] = getUniqueWellNumber(records);
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
      setShowTicketDialog({ open: true, data: data });
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenReplaceAssetReason = (rows) => {
    const data: any = {};
    data.referenceType = 'rentalJob';
    data.referenceId = rentalManagementData._id;
    const assets: any = [];
    getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.forEach((element: any) => {
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
    setReplaceLoading(true);
    axiosInstance()
      .post(`${deliveryTicket.api}/replace-assets`, { ...showReplaceReason.data, reason: reason })
      .then(({ data }) => {
        setShowReplaceReason({ open: false, data: [] });
        setAddSerializedAssetDialog({ open: false, products: [] });
        setReplaceLoading(false);
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

  const handelProcessTickets = (date = new Date(), status = null) => {
    let data = {};
    const loadingTicketIds = uniq(
      map(
        selectedRecords?.filter((e) => e?.loadingTicketId),
        'loadingTicketId'
      )
    );
    if (loadingTicketIds.length) {
      data['_ids'] = loadingTicketIds?.map((e) => e);
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['signatures'] = [];
      data['warehouse'] = rentalManagementData?.warehouse?.optionValue;
      data['receiveDate'] = dateFormatToSend(date);
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
          fetchRentalData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handelRevertTickets = () => {
    const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
    if (loadingTicketIds.length) {
      let data = [];
      loadingTicketIds?.forEach((loadingTicketId) => {
        const ele: any = {};
        ele._id = loadingTicketId;
        ele.products = selectedRecords
          ?.filter((e) => e.loadingTicketId === loadingTicketId && e.type === MATERIAL_TYPE.product)
          ?.map((e) => e.materialId);
        ele.assets = selectedRecords
          ?.filter((e) => e.loadingTicketId === loadingTicketId && e.type === MATERIAL_TYPE.serializedAsset)
          ?.map((e) => e._id);
        data.push(ele);
      });
      axiosInstance()
        .put(`${deliveryTicket.api}/revert-partially`, data)
        .then(({ data: { data } }) => {
          fetchRecords();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Reverted Successfully`
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handelCancleTickets = async () => {
    setOkBtnLoading(true);
    try {
      const inTransitloadingTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.inTransit),
          'loadingTicketId'
        )
      );
      if (inTransitloadingTicketIds?.length) {
        await axiosInstance().put(`${deliveryTicket.api}/revert`, { ids: inTransitloadingTicketIds });
      }
      const deliveredloadingTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered),
          'loadingTicketId'
        )
      );
      if (deliveredloadingTicketIds?.length) {
        await axiosInstance().post(`${deliveryTicket.api}/cancel-delivered-ticket`, { _ids: deliveredloadingTicketIds });
      }
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: `Cancelled Successfully`
      });
      setOkBtnLoading(false);
      setShowConformationCancleTicket({ open: false });
      fetchRecords();
    } catch (error) {
      setOkBtnLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const handleChangeStatusInUse = (status, prevStatus, date) => {
    setOpenDateDialog((prev) => ({ ...prev, loading: true }));
    const assets = getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.map((e) => {
      return { asset: e._id, uniqueId: e.uniqueId };
    });
    if (assets?.length) {
      axiosInstance()
        .put(`${rentalManagement.api}/${rentalManagementData._id}/assets-inuse-standby`, {
          assets,
          status: status,
          prevStatus: prevStatus,
          date: dateFormatToSend(date)
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
      .put(`${rentalManagement.api}/${rentalManagementData._id}/assets-date-update`, { assets: openDateDialog.assets, date: dateFormatToSend(date) })
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

  const validateAction = (action) => {
    const errorMessages = [];
    var records = [...getFilterSelectedRecords()];
    if (action === rentalManagementActions.cancelLoadingTicket) {
      const allRecord = getFilterSelectedRecords(null, flattenArray(dataRows));
      const loadingTicketIds = uniq(
        map(
          selectedRecords?.filter((e) => e?.loadingTicketId),
          'loadingTicketId'
        )
      );
      records = [
        ...getFilterSelectedRecords()?.filter((e) => !e?.loadingTicketId),
        ...allRecord?.filter((e) => loadingTicketIds?.includes(e?.loadingTicketId))
      ];
    }
    records?.forEach((e) => {
      if (action === rentalManagementActions.createLoadingTicket) {
        if (e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingAlreadyCreated });
        } else if (
          e.type === MATERIAL_TYPE.serializedAsset &&
          (![ASSET_STATUS.reserved, ASSET_STATUS.new, ASSET_STATUS.available, ASSET_STATUS.underReview]?.includes(e?.status) ||
            e?.rentalAssetStatus !== RENTAL_INTERNAL_ASSET_STATUS.reserved)
        ) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingReservedAssetStatus });
        } else if (uniq(map(records, 'warehouseId')).length !== 1) {
          errorMessages.push({
            index: e.index,
            message: rentalManagementMessage.repairSameWarehouse?.replace(sidebarResource?.warehouse, resources?.warehouse?.titleSingular)
          });
        }
      } else if (action === rentalManagementActions.deliveredToCustomer) {
        if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingAlreadyDelivered });
        }
      } else if (action === rentalManagementActions.replaceAsset) {
        if (e?.type !== MATERIAL_TYPE.serializedAsset) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.productsCanNotReplace });
        } else if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.delivered) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingDeliveredForReplace });
        } else if (e?.status !== ASSET_STATUS.inUse || e?.rentalAssetStatus !== ASSET_STATUS.inUse) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.onlyReplaceInUse });
        }
      } else if (action === rentalManagementActions.cancelInTransitLoadingTicket) {
        if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (e?.loadingTicketStatus !== DELIVERY_TICKET_STATUS.inTransit) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.cancelInTransitLineItems });
        }
      } else if (action === rentalManagementActions.cancelLoadingTicket) {
        if (!e.hasOwnProperty('loadingTicketId')) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.loadingNotCreated });
        } else if (![DELIVERY_TICKET_STATUS.inTransit, DELIVERY_TICKET_STATUS.delivered]?.includes(e?.loadingTicketStatus)) {
          errorMessages.push({ index: e.index, message: rentalManagementMessage.inTransitDeliveredLoadingTicket });
        } else if (e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
          if (
            e?.type === MATERIAL_TYPE.serializedAsset &&
            ![
              RENTAL_INTERNAL_ASSET_STATUS.inUse,
              RENTAL_INTERNAL_ASSET_STATUS.standBy,
              RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable,
              RENTAL_INTERNAL_ASSET_STATUS.delivered
            ]?.includes(e?.rentalAssetStatus)
          ) {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.rentalStatusInUseCancelLoading });
          } else if (
            e?.type === MATERIAL_TYPE.serializedAsset &&
            ![
              ASSET_STATUS.needRepair,
              ASSET_STATUS.needRecert,
              ASSET_STATUS.inUse,
              ASSET_STATUS.standBy,
              ASSET_STATUS.standByNotChargeable,
              ASSET_STATUS.delivered
            ]?.includes(e?.status)
          ) {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.statusInUseCancelLoading });
          } else if (
            e?.type === MATERIAL_TYPE.product &&
            [RENTAL_INTERNAL_ASSET_STATUS.consumed, RENTAL_INTERNAL_ASSET_STATUS.partiallyConsumed]?.includes(e?.rentalAssetStatus)
          ) {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.rentalProductConsumed });
          } else if (
            e?.type === MATERIAL_TYPE.product &&
            ![
              RENTAL_INTERNAL_ASSET_STATUS.inUse,
              RENTAL_INTERNAL_ASSET_STATUS.standBy,
              RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable,
              RENTAL_INTERNAL_ASSET_STATUS.delivered
            ]?.includes(e?.rentalAssetStatus)
          ) {
            errorMessages.push({ index: e.index, message: rentalManagementMessage.rentalStatusInUseCancelLoading });
          }
        }
      }
    });
    if (errorMessages?.length) {
      setOpenMessageDialog({ open: true, errorMessages: errorMessages });
      return true;
    }
    return false;
  };

  const rightSideContents = () => {
    return (
      <>
        <span>
          <PreviewDownloadMultiple referenceIds={uniqueLoadingTicket} />
        </span>
        {!isOffline && allowedToEdit && !rentalPolicyData?.hideAssetChangeStatus && (
          <ThemeButton
            disabled={
              !allowUpdateStatus ||
              getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).length === 0 ||
              getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.some((f) =>
                [
                  ASSET_STATUS.lost,
                  ASSET_STATUS.delivered,
                  ASSET_STATUS.inUse,
                  ASSET_STATUS.standBy,
                  ASSET_STATUS.standByNotChargeable,
                  ASSET_STATUS.inTransit,
                  ASSET_STATUS.inRepair,
                  ASSET_STATUS.repair,
                  ASSET_STATUS.reserved,
                  ASSET_STATUS.scrapRequested
                ].includes(f.status)
              )
            }
            onClick={handleClick}
            endIcon={<ExpandMore />}
          >
            Change Status
          </ThemeButton>
        )}
        {(allowedToEdit || isProcessor) && (
          <>
            {getFilterSelectedRecords().length &&
              getFilterSelectedRecords()?.filter((f) => f.hasOwnProperty('loadingTicketId') && f?.loadingTicketStatus === DELIVERY_TICKET_STATUS.new)
                ?.length === getFilterSelectedRecords()?.length ? (
              <HtmlTooltip title="Remove Assets From Loading Ticket(s)">
                <ThemeButton
                  onClick={() => {
                    setShowRemoveTicketDialog(true);
                  }}
                  iconForMobile={<IoRemoveCircleOutline size={22} />}
                  mobileTooltip="Remove Loading Ticket"
                  disabled={getFilterSelectedRecords().length === 0 || getFilterSelectedRecords().some((f) => !f.hasOwnProperty('loadingTicketId'))}
                >
                  Remove Loading Ticket
                </ThemeButton>
              </HtmlTooltip>
            ) : null}
            {showProcessDeliveryTicket && !isOffline && (
              <HtmlTooltip title="Process Multiple Loading Ticket(s)">
                <ThemeButton
                  onClick={() => {
                    setOpenDeliveryTicketDialog(true);
                  }}
                  buttonType="theme"
                  iconForMobile={<AddBoxRoundedIcon />}
                  mobileTooltip="Process Loading Ticket"
                >
                  Process Loading Ticket
                </ThemeButton>
              </HtmlTooltip>
            )}
          </>
        )}
      </>
    );
  };

  const rightSideContentsAfterAction = () => {
    return (
      <IconButtonTabs
        items={
          [
            {
              value: 'flat',
              icon: <FormatAlignJustifyIcon />,
              tooltip: 'Flat View'
            },
            {
              value: 'parentChild',
              icon: <FormatAlignLeftIcon />,
              tooltip: 'Parent Child View'
            }
          ] as const
        }
        setValue={setView}
        value={view}
      />
    );
  };

  const handleAssetData = (assetsData) => {
    const assetsAdd: any = [];
    getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).forEach((r) => {
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
    setReplaceLoading(true);
    axiosInstance()
      .put(`${rentalManagement.api}/${rentalManagementData._id}/change-asset-data`, assetsAdd)
      .then(({ data }) => {
        fetchRecords();
        setReplaceLoading(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setOpenAssetDataDialog(false);
      })
      .catch((error) => {
        setReplaceLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={allowedToEdit || isProcessor}
        actionButtonMenuItems={
          <ActionButtonMenuItems
            {...{
              validateAction,
              checkMTRValidation,
              selectedRecords,
              setMtrConfirmBox,
              handleDeliveryTicketDialog,
              user,
              setOpenDateDialog,
              handelProcessTickets,
              setAddSerializedAssetDialog,
              setShowConformationRevertTicket,
              setShowConformationCancleTicket,
              hideDeliveryTicketDelivered,
              permissions,
              assetPolicyData,
              setOpenAssetDataDialog,
              resources,
              getFilterSelectedRecords
            }}
          />
        }
        actionButtonProps={{ disabled: selectedRecords.length === 0 }}
        rightSideContents={rightSideContents()}
        rightSideContentsAfterAction={rightSideContentsAfterAction()}
        hasXpadding
      />
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
          expander={view === 'flat' ? false : true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

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
        {!user?.user?.brandPolicy?.serializedAssetScrapApproval && (
          <MenuItem
            disabled={getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.filter((e) => e?.status === ASSET_STATUS.scrap)?.length ? true : false}
            onClick={() => {
              setAnchorEl(null);
              setStatusToUpdate({ open: true, isUpdating: false, status: ASSET_STATUS.scrap, message: '' });
            }}
          >
            {ASSET_STATUS.scrap}
          </MenuItem>
        )}
        <MenuItem
          disabled={getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.filter((e) => e?.status === ASSET_STATUS.lost)?.length ? true : false}
          onClick={() => {
            setAnchorEl(null);
            setStatusToUpdate({ open: true, isUpdating: false, status: ASSET_STATUS.lost, message: '' });
          }}
        >
          {ASSET_STATUS.lost}
        </MenuItem>
      </Menu>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.loading}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          referenceData={showTicketDialog.data}
          onClose={() => setShowTicketDialog({ open: false, data: {} })}
          assets={getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)}
          products={getFilterSelectedRecords(MATERIAL_TYPE.product)?.map((e) => {
            return { ...e, _id: e.materialId };
          })}
          onSuccess={() => {
            setShowTicketDialog({ open: false, data: {} });
            fetchRecords();
            fetchRentalData();
          }}
        />
      )}
      {showRemoveTicketDialog && (
        <ConfirmationDialog
          open={showRemoveTicketDialog}
          message={`Are you sure you want to remove selected records from Loading Ticket?`}
          onClose={() => {
            setShowRemoveTicketDialog(false);
          }}
          onOk={() => {
            setOkBtnLoading(true);

            const groupByCalls = groupBy(selectedRecords, 'loadingTicketId');
            let apiCalls = [];

            Object.keys(groupByCalls).forEach((key) => {
              apiCalls.push(axiosInstance().put(`${deliveryTicket.api}/${key}/assets`, { ids: groupByCalls[key].map((m) => m._id) }));
            });

            Promise.all(apiCalls)
              .then(() => {
                toastConfig.setToastConfig({
                  open: true,
                  type: 'success',
                  message: `Selected records removed from assiged ${sidebarResource.deliveryTicket}(s)`
                });
                fetchRecords();
              })
              .catch((error) => {
                toastConfig.setToastConfig(error);
              })
              .finally(() => {
                setOkBtnLoading(false);
                setShowRemoveTicketDialog(false);
              });
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {statusToUpdate.open && (
        <Dialog
          open
          classes={{
            paper: classes.paper
          }}
          TransitionComponent={CustomDialogTransition}
          onClose={() => setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: false, open: false }))}
        >
          <CustomDialogHeader
            title="Are you sure ?"
            showRequiredLabel={false}
            onClose={() => setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: false, open: false }))}
          />

          <CustomDialogContent>
            <Box className="my-2">
              {statusToUpdate.status === 'Repair' ? (
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
                  sx={{
                    '& .MuiInputBase-root textarea': {
                      resize: 'vertical',
                      overflow: 'auto'
                    }
                  }}
                />
              )}
            </Box>
          </CustomDialogContent>
          <CustomDialogFooter>
            <ThemeButton onClick={() => setStatusToUpdate((prevState) => ({ ...prevState, open: false }))} buttonType="transparent">
              Cancel
            </ThemeButton>
            <ThemeButton
              disabled={statusToUpdate.isUpdating}
              onClick={() => {
                setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: true }));
                axiosInstance()
                  .put(`${serializedAsset.api}/update-status`, {
                    comment: statusToUpdate.message,
                    assets: getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).map((m) => ({
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
                    toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
                    setStatusToUpdate({ open: false, isUpdating: false, status: '', message: '' });
                    fetchRecords();
                  })
                  .catch((error) => {
                    setStatusToUpdate((prevState) => ({ ...prevState, isUpdating: false }));
                    toastConfig.setToastConfig(error);
                  });
              }}
              buttonType="theme"
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
          ticketType={[DELIVERY_TICKET_TYPE.loading]}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          handleClose={() => {
            setOpenDeliveryTicketDialog(false);
            fetchRecords();
          }}
        />
      )}
      {showInfo.open && (
        <ShowNonSerializeAssets data={showInfo.data} onClose={() => setShowInfo({ open: false, data: {}, type: null })} title={showInfo.type} />
      )}
      {addSerializedAssetDialog.open && (
        <AddSerializedAsset
          addSerializedAsset={handleOpenReplaceAssetReason}
          handleSerializedAssetClose={() => {
            setAddSerializedAssetDialog({ open: false, products: [] });
          }}
          referenceType={'ReplaceAsset'}
          replaceAssets={true}
          referenceData={{
            _id: rentalManagementData?._id,
            warehouse: rentalManagementData?.warehouse?.optionValue
          }}
          isAdding={replaceLoading}
          selectedProducts={addSerializedAssetDialog.products}
          filterByPlant={rentalManagementData?.warehouse}
        />
      )}
      {showReplaceReason.open && (
        <ReplaceAssetReason
          handleClose={() => setShowReplaceReason({ open: false, data: {} })}
          loading={replaceLoading}
          handleSucess={(data) => {
            handleReplaceAsset(data?.reason);
          }}
        />
      )}
      {showConformationRevertTicket && (
        <ConfirmationDialog
          open={showConformationRevertTicket}
          message={`Are you sure you want to revert loading ticket for the selected line item ?`}
          onClose={() => {
            setShowConformationRevertTicket(false);
          }}
          onOk={() => {
            handelRevertTickets();
            setShowConformationRevertTicket(false);
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {showConformationCancleTicket.open && (
        <ConfirmationDialog
          open={showConformationCancleTicket.open}
          message={`This action will cancel the complete Loading Ticket(s). Are you sure?`}
          onClose={() => {
            setShowConformationCancleTicket({ open: false });
          }}
          onOk={() => {
            handelCancleTickets();
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {mtrConfirmBox && (
        <ConfirmationDialog
          open={mtrConfirmBox}
          message={`MTR(s) missing for some or all line items.`}
          onClose={() => {
            setMtrConfirmBox(false);
          }}
          onOk={() => {
            handleDeliveryTicketDialog();
            setMtrConfirmBox(false);
          }}
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
              handelProcessTickets(date, status);
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
          ids={getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.map((r) => r?._id)}
          onSuccess={handleAssetData}
          loading={replaceLoading}
        />
      )}
    </>
  );
};

export default LoadingTicket;

const ActionButtonMenuItems = ({
  validateAction,
  checkMTRValidation,
  setMtrConfirmBox,
  handleDeliveryTicketDialog,
  user,
  setOpenDateDialog,
  handelProcessTickets,
  setAddSerializedAssetDialog,
  setShowConformationRevertTicket,
  setShowConformationCancleTicket,
  hideDeliveryTicketDelivered,
  permissions,
  assetPolicyData,
  setOpenAssetDataDialog,
  resources,
  getFilterSelectedRecords
}) => {
  const checkUniqStatus = () => {
    if (getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.length === 0) {
      return false;
    } else if (uniq(map(getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset), 'status')).length === 1) {
      return true;
    } else {
      return false;
    }
  };

  return (
    <>
      <HtmlTooltip title={!permissions?.deliveryTicket?.isCreate ? actionDisable : ''}>
        <MenuItem
          onClick={() => {
            if (!validateAction(rentalManagementActions.createLoadingTicket)) {
              if (checkMTRValidation && getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.some((e) => e.mtrAttached !== true)) {
                setMtrConfirmBox(true);
              } else {
                handleDeliveryTicketDialog();
              }
            }
          }}
          id={'create-loding-ticket-menu-item'}
          disabled={!permissions?.deliveryTicket?.isCreate || getFilterSelectedRecords()?.length === 0}
        >
          Create Loading Ticket
        </MenuItem>
      </HtmlTooltip>

      {user?.user?.brandPolicy?.rentalOnFieldStep || hideDeliveryTicketDelivered ? null : (
        <HtmlTooltip title={!permissions?.deliveryTicket?.isUpdate ? actionDisable : ''}>
          <MenuItem
            onClick={() => {
              if (!validateAction(rentalManagementActions.deliveredToCustomer)) {
                if (user?.user?.brandPolicy?.assetDeliveredStatus) {
                  setOpenDateDialog({
                    open: true,
                    type: 'changeStatus',
                    status: ASSET_STATUS.delivered,
                    prevStatus: ASSET_STATUS.delivered,
                    assets: getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.map((e) => e._id),
                    loading: false
                  });
                } else {
                  handelProcessTickets();
                }
              }
            }}
            id={'delivered-to-customer-menu-item'}
            disabled={!permissions?.deliveryTicket?.isUpdate || getFilterSelectedRecords()?.length === 0}
          >
            Delivered to Customer
          </MenuItem>
        </HtmlTooltip>
      )}
      {user?.user?.brandPolicy?.assetDeliveredStatus &&
        (user?.user?.brandPolicy?.rentalOnFieldStep ? null : (
          <Box>
            {getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).length > 0 &&
              getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).filter(
                (e: any) =>
                  e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
                  [ASSET_STATUS.delivered, ASSET_STATUS.inUse, ASSET_STATUS.standByNotChargeable].includes(e?.status) &&
                  [
                    RENTAL_INTERNAL_ASSET_STATUS.delivered,
                    RENTAL_INTERNAL_ASSET_STATUS.inUse,
                    RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable
                  ].includes(e?.rentalAssetStatus)
              ).length === getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).length &&
              checkUniqStatus() && (
                <MenuItem
                  onClick={() => {
                    setOpenDateDialog({
                      open: true,
                      type: 'changeStatus',
                      status: ASSET_STATUS.standBy,
                      prevStatus: getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)[0].status,
                      assets: getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.map((e) => e._id),
                      loading: false
                    });
                  }}
                  id={'change-status-to-standby-menu-item'}
                >
                  {`Change Status to ${ASSET_STATUS.standBy}`}
                </MenuItem>
              )}
            {getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).length > 0 &&
              getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).filter(
                (e: any) =>
                  e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
                  [ASSET_STATUS.delivered, ASSET_STATUS.inUse, ASSET_STATUS.standBy].includes(e?.status) &&
                  [RENTAL_INTERNAL_ASSET_STATUS.delivered, RENTAL_INTERNAL_ASSET_STATUS.inUse, RENTAL_INTERNAL_ASSET_STATUS.standBy].includes(
                    e?.rentalAssetStatus
                  )
              ).length === getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).length &&
              checkUniqStatus() && (
                <MenuItem
                  onClick={() => {
                    setOpenDateDialog({
                      open: true,
                      type: 'changeStatus',
                      status: ASSET_STATUS.standByNotChargeable,
                      prevStatus: getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)[0].status,
                      assets: getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.map((e) => e._id),
                      loading: false
                    });
                  }}
                  id={'change-status-to-standby-not-chargeable-menu-item'}
                >
                  {`Change Status to ${ASSET_STATUS.standByNotChargeable}`}
                </MenuItem>
              )}
            {getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).length > 0 &&
              getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).filter(
                (e: any) =>
                  e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
                  [ASSET_STATUS.delivered, ASSET_STATUS.standBy, ASSET_STATUS.standByNotChargeable].includes(e?.status) &&
                  [
                    RENTAL_INTERNAL_ASSET_STATUS.delivered,
                    RENTAL_INTERNAL_ASSET_STATUS.standBy,
                    RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable
                  ].includes(e?.rentalAssetStatus)
              ).length === getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).length &&
              checkUniqStatus() && (
                <MenuItem
                  onClick={() => {
                    setOpenDateDialog({
                      open: true,
                      type: 'changeStatus',
                      status: ASSET_STATUS.inUse,
                      prevStatus: getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)[0].status,
                      assets: getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.map((e) => e._id),
                      loading: false
                    });
                  }}
                  id={'change-status-to-inuse-menu-item'}
                >
                  {`Change Status to ${ASSET_STATUS.inUse}`}
                </MenuItem>
              )}
            {getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).length > 0 &&
              getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).filter(
                (e: any) =>
                  e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered &&
                  [
                    RENTAL_INTERNAL_ASSET_STATUS.inUse,
                    RENTAL_INTERNAL_ASSET_STATUS.standBy,
                    RENTAL_INTERNAL_ASSET_STATUS.standByNotChargeable
                  ].includes(e?.rentalAssetStatus)
              ).length === getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset).length &&
              checkUniqStatus() && (
                <MenuItem
                  onClick={() => {
                    setOpenDateDialog({
                      open: true,
                      type: 'changeDate',
                      status: '',
                      prevStatus: '',
                      assets: getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.map((e) => e._id),
                      loading: false
                    });
                  }}
                  id={'change-serialized-asset-last-status-date-menu-item'}
                >
                  {`Change ${resources?.serializedAsset?.titleSingular} Last Status Date`}
                </MenuItem>
              )}
          </Box>
        ))}
      {user?.user?.brandPolicy?.rentalOnFieldStep ? null : (
        <MenuItem
          onClick={() => {
            if (!validateAction(rentalManagementActions.replaceAsset)) {
              const products = [];
              getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.forEach((element) => {
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
              setAddSerializedAssetDialog({ open: true, products: products });
            }
          }}
          id={'last-status-menu-item'}
          disabled={getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.length === 0}
        >
          Replace Asset
        </MenuItem>
      )}
      {!hideDeliveryTicketDelivered && (
        <HtmlTooltip title={!permissions?.deliveryTicket?.isUpdate ? actionDisable : ''}>
          <MenuItem
            onClick={() => {
              if (!validateAction(rentalManagementActions.cancelInTransitLoadingTicket)) {
                setShowConformationRevertTicket(true);
              }
            }}
            id={'cancel-specific-line-item-menu-item'}
            disabled={!permissions?.deliveryTicket?.isUpdate || getFilterSelectedRecords()?.length === 0}
          >
            Cancel Specific Line Items
          </MenuItem>
        </HtmlTooltip>
      )}
      <HtmlTooltip title={!permissions?.deliveryTicket?.isDelete ? actionDisable : ''}>
        <MenuItem
          onClick={() => {
            if (!validateAction(rentalManagementActions.cancelLoadingTicket)) {
              setShowConformationCancleTicket({ open: true });
            }
          }}
          id={'cancel-loading-ticket-menu-item'}
          disabled={!permissions?.deliveryTicket?.isDelete || getFilterSelectedRecords()?.length === 0}
        >
          Cancel Loading Ticket(s)
        </MenuItem>
      </HtmlTooltip>
      {assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === ASSET_STATUS.reserved) &&
        getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.length > 0 &&
        getFilterSelectedRecords(MATERIAL_TYPE.serializedAsset)?.every((r) =>
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
