import { useContext, useEffect, useMemo, useState, useReducer, Fragment } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Box, Grid, Button, IconButton, Tooltip, Tabs, Tab } from '@material-ui/core';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import queryString from 'query-string';
import { deliveryTicket, getObjKeysWithValues, dateTimeFormat, ACTIVITY_RESOURCE, ASSET_STATUS, rentalManagement } from '../../constants/helpers';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import routes from '../../components/Helpers/Routes';
import axiosInstance from '../../axios/axiosInstance';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import ManageDeliveryTicket from './ManageDeliveryTicket';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { serializedAsset, gridLoadingTimeout } from '../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import SignatureDialog from '../../components/Helpers/SignatureDialog';
import ViewSignsDialog from './ViewSignsDialog';
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import RemoveCircleRoundedIcon from '@material-ui/icons/RemoveCircleRounded';
import moment from 'moment';
import AddSerializedAsset from '../RentalManagement/SerializedAsset/AddSerializedAsset';
import { FaSignature, FaWpforms } from 'react-icons/fa';
import { BiFoodMenu } from 'react-icons/bi';
import EditIcon from '@material-ui/icons/Edit';
import {
  prepareDataForGrid,
  DELIVERY_TICKET_MAPPED_STATUS,
  sidebarResource,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_FROM_TO_TYPE
} from '../../constants/helpers';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../constants/useColumns';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { objectStore, findOne, findAll } from '../../constants/indexdbhelper';
import { updateSignatureOffline } from './deliveryTicketOfflineHelper';
import { camelCase } from 'lodash';
import DeliveryTicketProduct from './DeliveryTicketProduct';
import DeliveryTicketAdditionalCost from './DeliveryTicketAdditionalCost';
import ActivityButton from 'src/components/Activity/ActivityButton';
import DateDialog from '../RentalManagement/LoadingTicket/DateDialog';
import PreviewDownload from 'src/components/PreviewDownload';

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`main-tabpanel-${index}`} aria-labelledby={`main-tab-${index}`} {...other}>
      {children}
    </div>
  );
}

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`
  };
}

export default function DeliveryTicketDetail(props) {
  const renderedFrom = `${camelCase(routes?.deliveryTicket.title)}_grid-1`;
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const { tab }: any = queryString.parse(history.location.search);
  const [deliveryTicketData, setDeliveryTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openSigns, setOpenSigns] = useState(false);
  const [submittingSign, setSubmittingSign] = useState(false);
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [signatures, setSignatures] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [deliveryTicketFields, setDeliveryTicketFields] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const [okBtnLoading, setOkBtnLoading] = useState(false);
  const [showRemoveAssetFromLoadingTicketDialog, setShowRemoveAssetFromLoadingTicketDialog] = useState(false);
  const { dataRows, rowCount, page, limit, pageSizes, selectedRecords } = state;
  const { getColumnData } = useColumns();
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false);

  const [startDeliveryDate, setStartDeliveryDate] = useState(null);
  const [signOffDate, setSignOffDate] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [locationKeys, setLocationKeys] = useState([]);
  const { isOffline } = useContext(CustomOfflineContext);
  const [openDateDialog, setOpenDateDialog] = useState({ open: false, type: null, status: null, prevStatus: null, assets: [], loading: false });

  useEffect(() => {
    return history.listen((location) => {
      const { tab }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key]);
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys);
          // Handle forward event
          setTabValue(tab ? parseInt(tab) : 1);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setTabValue(tab ? parseInt(tab) : 1);
        }
      }
    });
  }, [locationKeys]);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  useEffect(() => {
    fetchDeliveryTicketData();
  }, [id]);

  const getDeliveryTicketFields = async (ticket: any) => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.resource, objectStore.deliveryTicket);
      } else {
        const response = await axiosInstance().get(`/field?resource=${sidebarResource['deliveryTicket']}&showHiddenFields=true`);
        data = response?.data?.data;
      }
      data = data.filter((fields: any) => {
        if (ticket?.type === DELIVERY_TICKET_REFERENCE_TYPE.repairJob) {
          if (
            [
              'transferAsset',
              'rentalJob',
              'sublease',
              'salesOrder',
              'productInventory',
              'pickupFromType',
              'deliveryToType',
              'transferInventory',
              'repairOrder'
            ].includes(fields.fieldData.fieldName)
          ) {
            return false;
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFERENCE_TYPE.transferAsset) {
          if (
            [
              'rentalJob',
              'repairJob',
              'sublease',
              'salesOrder',
              'productInventory',
              'pickupFromType',
              'deliveryToType',
              'transferInventory',
              'repairOrder'
            ].includes(fields.fieldData.fieldName)
          ) {
            return false;
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFERENCE_TYPE.rentalJob) {
          if (
            [
              'repairJob',
              'transferAsset',
              'sublease',
              'salesOrder',
              'productInventory',
              'pickupFromType',
              'deliveryToType',
              'transferInventory',
              'repairOrder'
            ].includes(fields.fieldData.fieldName)
          ) {
            return false;
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFERENCE_TYPE.salesOrder) {
          if (
            [
              'repairJob',
              'transferAsset',
              'sublease',
              'productInventory',
              'pickupFromType',
              'deliveryToType',
              'transferInventory',
              'repairOrder'
            ].includes(fields.fieldData.fieldName)
          ) {
            return false;
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFERENCE_TYPE.sublease) {
          if (
            [
              'rentalJob',
              'repairJob',
              'transferAsset',
              'salesOrder',
              'productInventory',
              'pickupFromType',
              'deliveryToType',
              'transferInventory',
              'repairOrder'
            ].includes(fields.fieldData.fieldName)
          ) {
            return false;
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFERENCE_TYPE.transferInventory) {
          if (
            [
              'rentalJob',
              'repairJob',
              'transferAsset',
              'salesOrder',
              'productInventory',
              'pickupFromType',
              'deliveryToType',
              'sublease',
              'repairOrder'
            ].includes(fields.fieldData.fieldName)
          ) {
            return false;
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFERENCE_TYPE.repairOrder) {
          if (
            [
              'rentalJob',
              'repairJob',
              'transferAsset',
              'salesOrder',
              'productInventory',
              'pickupFromType',
              'deliveryToType',
              'sublease',
              'transferInventory'
            ].includes(fields.fieldData.fieldName)
          ) {
            return false;
          }
        }
        if (ticket?.type === DELIVERY_TICKET_REFERENCE_TYPE.productionOrder) {
          if (
            ['rentalJob', 'repairJob', 'transferAsset', 'salesOrder', 'repairOrder', 'productInventory', 'sublease', 'transferInventory'].includes(
              fields.fieldData.fieldName
            )
          ) {
            return false;
          }
        }
        if (fields.fieldData.sectionName.includes('Fields')) {
          return false;
        }
        return true;
      });

      if (ticket?.type === DELIVERY_TICKET_REFERENCE_TYPE.transferInventory) {
      } else {
        data = data.filter((fields: any) => !['pickupFromStorageLocation', 'deliveryToStorageLocation']?.includes(fields.fieldData.fieldName));
      }

      if (ticket?.ticketType !== DELIVERY_TICKET_TYPE.return) {
        data = data.filter((fields: any) => fields.fieldData.fieldName !== 'returnReason');
      }
      data.forEach((element) => {
        if (element?.fieldData.fieldName === 'pickupFrom') {
          if (ticket?.pickupFromType === DELIVERY_FROM_TO_TYPE.customer) {
            element.fieldData.lookupResource = sidebarResource.customerAccount;
          }
          if (ticket?.pickupFromType === DELIVERY_FROM_TO_TYPE.supplier) {
            element.fieldData.lookupResource = sidebarResource.supplierAccount;
          }
        }
        if (element?.fieldData.fieldName === 'deliveryTo') {
          if (ticket?.deliveryToType === DELIVERY_FROM_TO_TYPE.customer) {
            element.fieldData.lookupResource = sidebarResource.customerAccount;
          }
          if (ticket?.deliveryToType === DELIVERY_FROM_TO_TYPE.supplier) {
            element.fieldData.lookupResource = sidebarResource.supplierAccount;
          }
        }
      });
      setDeliveryTicketFields(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const fetchDeliveryTicketData = async () => {
    try {
      if (gridApi) {
        gridApi.deselectAll();
      }
      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
      if (selectedEntity) {
        setLoading(true);
        let data;
        if (isOffline) {
          data = await findOne(objectStore.deliveryTicket, id);
        } else {
          const response = await axiosInstance().get(`${deliveryTicket.api}/${id}?entity=${selectedEntity}`);
          data = response?.data?.data;
        }
        getDeliveryTicketFields(data);
        setDeliveryTicketData(data);
        const startDeliverySignatures = data?.signatures?.filter((f) => f.status === 'Start Delivery' && f.date);
        if (startDeliverySignatures && startDeliverySignatures.length > 0) {
          setStartDeliveryDate(moment(startDeliverySignatures[startDeliverySignatures.length - 1].date).format(dateTimeFormat));
        }
        setSignOffDate(data?.actualDeliveryDate);
        const signOffSignatures = data?.signatures?.filter((f) => f.status === 'Sign-Off' && f.date);
        if (signOffSignatures && signOffSignatures.length > 0) {
          setSignOffDate(moment(signOffSignatures[signOffSignatures.length - 1].date).format(dateTimeFormat));
        }
        setCanEdit([...(data?.collaborator ?? []), data?.owner ?? {}, data?.processor ?? {}].some((obj) => obj.optionValue === user.user._id));
        setSignatures(data?.signatures || []);
        if (data?.productInventory && data?.productInventory.length) {
          let ids = data?.productInventory.map((o) => o?.optionValue);
          fetchProductInventory(ids);
        } else {
          dispatch({ type: 'initialize', data: [], count: 0 });
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.resource, 'serializedAsset');
      } else {
        const response = await axiosInstance().get(`/field?resource=${serializedAsset.resource}`);
        data = response?.data?.data;
      }
      let columns = [];
      let rendererNames = [];
      data.forEach((o) => {
        let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.serializedAssetDetail.path);
        if (currentColumn !== null) {
          columns = [...columns, currentColumn?.columnData];
          if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
            rendererNames.push(currentColumn?.rendererName);
          }
        }
      });
      let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
      tempFrameworkComponent = {
        ...tempFrameworkComponent
      };
      setFrameWorkComponent({ ...tempFrameworkComponent });
      columns = [...columns, ...getStaticFields()];
      setColumns([...columns]);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchProductInventory = async (productInventories) => {
    if (!productInventories) {
      productInventories = deliveryTicketData?.productInventory?.map((o) => o?.optionValue);
    }
    try {
      dispatch({ type: 'loading', loading: true });
      if (gridApi) {
        gridApi.setRowData([]);
      }
      let data;
      if (isOffline) {
        const deliveryTicket = await findOne(objectStore.deliveryTicket, id);
        const response = await findOne(objectStore.rentalManagement, deliveryTicket?.rentalJob?.optionValue);
        data = response?.productInventory.map((u) => {
          return u.inventoryDetail;
        });
        const inventory = deliveryTicket?.productInventory?.map((e) => e.optionValue);
        data = response?.productInventory?.filter((d) => inventory?.includes(d.inventory)).map((obj) => obj.inventoryDetail);
      } else {
        const response = await axiosInstance().get(`${deliveryTicket.api}/${id}/assets`);
        data = response?.data?.data;
      }
      let rows = data.map((u) => {
        let finalObject = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: rows.length });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      toastConfig.setToastConfig(error);
      dispatch({ type: 'loading', loading: false });
    }
  };

  const handleDeleteLoadingTicket = () => {
    if (deliveryTicketData?._id) {
      axiosInstance()
        .put(`${deliveryTicket.api}/remove?entity=${selectedEntity}`, {
          ids: [deliveryTicketData._id]
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          history.push({
            pathname: routes.deliveryTicket.path
          });
          setShowConfirmBox(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleChangeStatus = (label) => {
    if (DELIVERY_TICKET_MAPPED_STATUS[label]) {
      const fieldsDataForUpdate = deliveryTicketFields.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      let values = getObjKeysWithValues(deliveryTicketData, fieldsDataForUpdate);
      values['status'] = DELIVERY_TICKET_MAPPED_STATUS[label];
      values['_id'] = deliveryTicketData._id;
      axiosInstance()
        .put(`${deliveryTicket.api}`, values)
        .then(({ data: { data } }) => {
          fetchDeliveryTicketData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleSignature = async (signedData) => {
    let signaturesToSend = [...signatures];

    const status = deliveryTicketData?.status === DELIVERY_TICKET_STATUS.new ? 'Start Delivery' : 'Sign-Off';
    const label =
      deliveryTicketData?.status === DELIVERY_TICKET_STATUS.new
        ? 'Sign-off - Dispatch'
        : deliveryTicketData?.status === 'In-Transit'
        ? 'Sign-off - Delivery'
        : '';

    const { type, sign: newSign, name } = signedData;
    const indexOfExistingSignature = signatures.findIndex((sign) => sign.type === type && sign.status === status);

    if (indexOfExistingSignature === -1) {
      signaturesToSend = [...signatures, { type, signature: newSign, status: status, name: name }];
    } else {
      signaturesToSend[indexOfExistingSignature] = {
        ...signaturesToSend[indexOfExistingSignature],
        type,
        signature: newSign,
        status: status,
        name: name
      };
    }

    setSignatures([...signaturesToSend]);
    if (signaturesToSend.length === 2 || signaturesToSend.length === 4) {
      if (isOffline) {
        setSubmittingSign(true);
        const response = await updateSignatureOffline(id, signaturesToSend);
        fetchDeliveryTicketData();
        setOpenSignatureDialog(false);
        setSubmittingSign(false);
      } else {
        setSubmittingSign(true);
        axiosInstance()
          .put(`${deliveryTicket.api}/signature`, {
            _id: id,
            signatures: [...signaturesToSend]
          })
          .then(() => {
            handleChangeStatus(label);
            setOpenSignatureDialog(false);
            setSubmittingSign(false);
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
            setOpenSignatureDialog(false);
            setSubmittingSign(false);
          });
      }
    }
  };

  const handelProcessTickets = (date = new Date(), status = null) => {
    setOpenDateDialog((prev) => ({ ...prev, loading: true }));
    const data = {};
    data['_ids'] = [deliveryTicketData._id];
    data['status'] = DELIVERY_TICKET_STATUS.delivered;
    data['signatures'] = [];
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
          fetchDeliveryTicketData();
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleChangeStatusInUse = (status, prevStatus, date) => {
    const assets = dataRows?.map((e) => e._id);
    if (assets?.length) {
      axiosInstance()
        .put(`${rentalManagement.api}/${deliveryTicketData?.rentalJob?.optionValue}/assets-inuse-standby`, {
          assets,
          status: status,
          prevStatus: prevStatus,
          date: date
        })
        .then(({ data }) => {
          fetchDeliveryTicketData();
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
      fetchDeliveryTicketData();
      setOpenDateDialog({ open: false, type: null, status: null, prevStatus: null, assets: [], loading: false });
    }
  };

  return (
    <>
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs routes={[routes.deliveryTicket, { title: deliveryTicketData?.ticketName }]} />
          </Box>
          <Box className="controls-v1">
            <Box className="control-buttons-v1">
              {permissions?.deliveryTicket?.isUpdate &&
                canEdit &&
                deliveryTicketData?.type === DELIVERY_TICKET_REFERENCE_TYPE.rentalJob &&
                [DELIVERY_TICKET_STATUS.indTransit].includes(deliveryTicketData?.status) &&
                [DELIVERY_TICKET_TYPE.loading, DELIVERY_TICKET_TYPE.receiving].includes(deliveryTicketData?.ticketType) && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    className="btn-outline-v1"
                    size="small"
                    onClick={() => {
                      if (user?.user?.brandPolicy?.assetDeliveredStatus && deliveryTicketData?.ticketType === DELIVERY_TICKET_TYPE.loading) {
                        setOpenDateDialog({
                          open: true,
                          type: 'changeStatus',
                          status: ASSET_STATUS.delivered,
                          prevStatus: ASSET_STATUS.delivered,
                          assets: selectedRecords?.filter((e: any) => e.type === 'Asset')?.map((e) => e._id),
                          loading: false
                        });
                      } else {
                        handelProcessTickets();
                      }
                    }}
                    style={isMobile && !isTablet ? { color: 'var(--teal)' } : {}}
                  >
                    {deliveryTicketData?.ticketType === DELIVERY_TICKET_TYPE.loading ? 'Delivered to Customer' : 'Receive Item'}
                  </Button>
                )}
              {permissions?.deliveryTicket?.isUpdate &&
                canEdit &&
                ![DELIVERY_TICKET_STATUS.delivered, DELIVERY_TICKET_STATUS.cancelled].includes(deliveryTicketData?.status) && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    className="btn-outline-v1"
                    size="small"
                    onClick={handleOpenUpdateDialog}
                    style={isMobile && !isTablet ? { color: 'var(--teal)' } : {}}
                  >
                    {isMobile && !isTablet ? <EditIcon /> : 'Edit'}
                  </Button>
                )}

              {deliveryTicketData?.signatures?.length > 0 ? (
                <Button
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  className="btn-outline-v1"
                  color="primary"
                  size="small"
                  onClick={() => setOpenSigns(true)}
                  style={isMobile && !isTablet ? { color: 'var(--info-darken)' } : {}}
                >
                  {isMobile && !isTablet ? <FaSignature size={20} /> : 'View Signatures'}
                </Button>
              ) : null}
              <PreviewDownload
                resource={sidebarResource.deliveryTicket}
                referenceId={deliveryTicketData?._id}
                hideDetailButton={true}
                fileName={`${routes.deliveryTicket.title}-${deliveryTicketData?.ticketName}`}
                columns={columns?.filter((e) => ['assetNumber', 'product', 'productDescription'].includes(e.field))}
              />
              <ActivityButton
                referenceId={deliveryTicketData?._id}
                resource={ACTIVITY_RESOURCE.deliveryTicket}
                resourceLabel={deliveryTicketData?.ticketName}
              />
            </Box>
          </Box>
        </Box>
        <Box className={`detail-container-v1`}>
          <Tabs
            className="new-tab-container-v1"
            value={tabValue}
            onChange={handleMainTabChange}
            textColor="primary"
            TabIndicatorProps={{
              style: {
                display: 'none'
              }
            }}
          >
            <Tab
              className={'tabLayout'}
              label={
                <div className="d-flex align-items-center tab-font">
                  <FaWpforms className="mr-1" fontSize="inherit" /> Header
                </div>
              }
              {...a11yProps(0)}
            />
            <Tab
              className={'tabLayout'}
              label={
                <div className="d-flex align-items-center tab-font">
                  <BiFoodMenu className="mr-1" fontSize="inherit" /> Serialized Assets
                </div>
              }
              {...a11yProps(1)}
            />
            <Tab
              className={'tabLayout'}
              label={
                <div className="d-flex align-items-center tab-font">
                  <BiFoodMenu className="mr-1" fontSize="inherit" /> Additional Products
                </div>
              }
              {...a11yProps(0)}
            />
            {deliveryTicketData?.additionalCost?.length > 0 && (
              <Tab
                className={'tabLayout'}
                label={
                  <div className="d-flex align-items-center tab-font">
                    <BiFoodMenu className="mr-1" fontSize="inherit" /> Add-On
                  </div>
                }
                {...a11yProps(0)}
              />
            )}
          </Tabs>
          <TabPanel value={tabValue} index={0}>
            {deliveryTicketData && deliveryTicketFields.length > 0 && !loading ? (
              <DetailsPage
                data={{
                  ...deliveryTicketData,
                  actualDispatchedDate: startDeliveryDate,
                  actualDeliveryDate: signOffDate,
                  creationDate: deliveryTicketData?.createdBy?.date,
                  completionDate: deliveryTicketData?.actualDeliveryDate
                }}
                fields={[
                  ...deliveryTicketFields,
                  {
                    fieldData: {
                      type: 'date',
                      fieldLabel: 'Actual Delivery Date',
                      fieldName: 'actualDeliveryDate',
                      sectionName: 'Actuals'
                    }
                  },
                  {
                    fieldData: {
                      type: 'date',
                      fieldLabel: 'Creation Date',
                      fieldName: 'creationDate',
                      sectionName: 'Actuals'
                    }
                  },
                  {
                    fieldData: {
                      type: 'date',
                      fieldLabel: 'Completion Date',
                      fieldName: 'completionDate',
                      sectionName: 'Actuals'
                    }
                  }
                ]}
              />
            ) : (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            )}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={1} className="p-2">
              <Grid item xs={12} className="mt-2 d-flex gap-2">
                {deliveryTicketData?.status === 'New' && (
                  <IconButton
                    onClick={() => {
                      setAddSerializedAssetDialog(true);
                    }}
                    disabled={isOffline}
                    color="primary"
                    size="small"
                  >
                    <Tooltip title="Add More Serialized Assets">
                      <AddBoxRoundedIcon />
                    </Tooltip>
                  </IconButton>
                )}
                {deliveryTicketData?.status === 'New' && (
                  <IconButton
                    disabled={selectedRecords.length === 0 || isOffline}
                    onClick={() => {
                      setShowRemoveAssetFromLoadingTicketDialog(true);
                    }}
                    color="primary"
                    size="small"
                  >
                    <Tooltip title="Remove Serialized Assets">
                      <RemoveCircleRoundedIcon />
                    </Tooltip>
                  </IconButton>
                )}
                <Box mx={1} />
              </Grid>
              <Grid item xs={12}>
                {isMobile && !isTablet ? (
                  <CustomSwipableList
                    allowSelection={false}
                    allowSwipe={true}
                    permissions={permissions}
                    primaryField={columns?.find((d) => d.field === 'assetNumber')}
                    onClick={(data) => {
                      history.push(`${routes.serializedAssetDetail.path}/${data._id}`);
                    }}
                    dataRows={dataRows}
                    selectedRecords={selectedRecords}
                    dispatch={dispatch}
                    onEdit={() => {}}
                    extraParamsToCheckDelete={true}
                    onDelete={() => {}}
                    rowCount={rowCount}
                    page={page}
                    loading={loading}
                    chips={[
                      {
                        label: `Product Description: `,
                        field: 'productName',
                        forceShow: true
                      }
                    ]}
                    onCreate={null}
                    showClone={false}
                    fullHeight={true}
                    renderedFrom={renderedFrom}
                    onClone={() => {}}
                  />
                ) : Object.keys(frameWorkComponent).length > 0 ? (
                  <CustomAgGrid
                    isClientSideGrid={true}
                    allowSelection={deliveryTicketData?.status === 'New'}
                    allowAction={false}
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameWorkComponent}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    actionWidth={150}
                    loading={false}
                    renderedFrom={renderedFrom}
                    refreshGrid={fetchProductInventory}
                  />
                ) : (
                  <Box p={2} height={500}>
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                  </Box>
                )}
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <DeliveryTicketProduct renderedFrom={`${camelCase(routes?.deliveryTicket.title)}_grid-2`} deliveryTicketId={id} />
          </TabPanel>
          {deliveryTicketData?.additionalCost?.length > 0 && (
            <TabPanel value={tabValue} index={3}>
              <DeliveryTicketAdditionalCost
                renderedFrom={`${camelCase(routes?.deliveryTicket.title)}_grid-3`}
                additionalCost={deliveryTicketData?.additionalCost}
              />
            </TabPanel>
          )}
        </Box>
        {showConfirmBox ? (
          <ConfirmationDialog
            open={showConfirmBox}
            message={`Are you sure you want to delete this Loading Ticket ? `}
            onClose={() => setShowConfirmBox(false)}
            onOk={handleDeleteLoadingTicket}
          />
        ) : null}

        {openUpdateDialog && (
          <ManageDeliveryTicket
            deliveryTicketId={deliveryTicketData?._id}
            onClose={() => setOpenUpdateDialog(false)}
            onSuccess={() => {
              setOpenUpdateDialog(false);
              fetchDeliveryTicketData();
            }}
          />
        )}

        {openSignatureDialog && (
          <SignatureDialog
            submitting={submittingSign}
            label={deliveryTicketData?.status === DELIVERY_TICKET_STATUS.new ? 'Sign-off - Dispatch' : 'Sign-off - Delivery'}
            steps={deliveryTicketData?.status === DELIVERY_TICKET_STATUS.new ? ['Supervisor', 'Delivery Person'] : ['Delivery Person', 'Receiver']}
            forDelivery={true}
            open={true}
            onClose={() => {
              setOpenSignatureDialog(false);
            }}
            onSigned={handleSignature}
          />
        )}

        {openSigns && <ViewSignsDialog signatures={deliveryTicketData?.signatures} close={() => setOpenSigns(false)} />}

        {showRemoveAssetFromLoadingTicketDialog && (
          <ConfirmationDialog
            open={showRemoveAssetFromLoadingTicketDialog}
            message={`Are you sure you want to remove selected serialized asset(s) ?`}
            onClose={() => {
              setShowRemoveAssetFromLoadingTicketDialog(false);
            }}
            onOk={() => {
              setOkBtnLoading(true);
              axiosInstance()
                .put(`${deliveryTicket.api}/${id}/assets`, { ids: selectedRecords.map((m) => m._id) })
                .then(() => {
                  toastConfig.setToastConfig({ open: true, type: 'success', message: `Selected serialized asset(s) removed` });
                  dispatch({
                    type: 'selection',
                    selectedRecords: []
                  });
                  fetchDeliveryTicketData();
                })
                .catch((error) => {
                  toastConfig.setToastConfig(error);
                })
                .finally(() => {
                  setOkBtnLoading(false);
                  setShowRemoveAssetFromLoadingTicketDialog(false);
                });
            }}
            okBtnLoading={okBtnLoading}
          />
        )}

        {addSerializedAssetDialog && (
          <AddSerializedAsset
            addSerializedAsset={(newRecordsToAdd) => {
              axiosInstance()
                .post(`${deliveryTicket.api}/${id}/assets`, { ids: newRecordsToAdd.map((m) => m._id ?? m.id) })
                .then(({ data }) => {
                  setAddSerializedAssetDialog(false);
                  fetchDeliveryTicketData();
                  setIsAdding(false);
                  toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: data.message
                  });
                })
                .catch((error) => {
                  setAddSerializedAssetDialog(false);
                  setIsAdding(false);
                  toastConfig.setToastConfig(error);
                });
            }}
            handleSerializedAssetClose={() => {
              setAddSerializedAssetDialog(false);
            }}
            isAdding={isAdding}
            selectedProducts={[]}
            rentalId={deliveryTicketData?.type === DELIVERY_TICKET_REFERENCE_TYPE.rentalJob ? deliveryTicketData?.rentalJob?.optionValue : ''}
            repairJobId={deliveryTicketData?.type === DELIVERY_TICKET_REFERENCE_TYPE.repairJob ? deliveryTicketData?.repairJob?.optionValue : ''}
            transferAssetId={
              deliveryTicketData?.type === DELIVERY_TICKET_REFERENCE_TYPE.transferAsset ? deliveryTicketData?.transferAsset?.optionValue : ''
            }
            notIn={deliveryTicketData.ticketType}
          />
        )}
        {openDateDialog.open && (
          <DateDialog
            loading={openDateDialog.loading}
            onClose={() => {
              setOpenDateDialog({ open: false, type: null, status: null, prevStatus: '', assets: [], loading: false });
            }}
            handleSubmit={(date, status) => {
              handelProcessTickets(date, status);
            }}
            type={openDateDialog.type}
            status={openDateDialog.status}
            title={'Delivered Date'}
            assets={[]}
          />
        )}
      </Box>
    </>
  );
}
