import { Box, Button, Grid, IconButton } from '@mui/material';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import EditIcon from '@mui/icons-material/Edit';
import RemoveCircleRoundedIcon from '@mui/icons-material/RemoveCircleRounded';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaSignature } from 'react-icons/fa';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import PreviewDownload from 'src/components/PreviewDownload';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import SignatureDialog from '../../components/Helpers/SignatureDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import {
  ACTIVITY_RESOURCE,
  ASSET_STATUS,
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_MAPPED_STATUS,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_STATUS,
  DELIVERY_TICKET_TYPE,
  deliveryTicket,
  displayDateTime,
  getObjKeysWithValues,
  gridLoadingTimeout,
  prepareDataForGrid,
  rentalManagement,
  sidebarResource
} from '../../constants/helpers';
import { findOne, objectStore } from '../../constants/indexdbhelper';
import DateDialog from '../RentalManagement/LoadingTicket/DateDialog';
import AddSerializedAsset from '../RentalManagement/SerializedAsset/AddSerializedAsset';
import DeliveryTicketAdditionalCost from './DeliveryTicketAdditionalCost';
import DeliveryTicketProduct from './DeliveryTicketProduct';
import ManageDeliveryTicket from './ManageDeliveryTicket';
import ViewSignsDialog from './ViewSignsDialog';
import { updateSignatureOffline } from './deliveryTicketOfflineHelper';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { RiFolderReceivedLine } from 'react-icons/ri';
import { TbTruckDelivery } from 'react-icons/tb';
import Step from 'src/pages/DynamicForm/Step';

export default function DeliveryTicketDetail(props) {
  const renderedFrom = `${camelCase(sidebarResource.deliveryTicket)}_grid-1`;
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const {
    state: { user, selectedEntity, permissions, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const { generateColumns } = useColumns();
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
  const [okBtnLoading, setOkBtnLoading] = useState(false);
  const [showRemoveAssetFromLoadingTicketDialog, setShowRemoveAssetFromLoadingTicketDialog] = useState(false);
  const [serializedAssetColumns, setSerializedAssetColumns] = useState([]);
  const [productColumns, setProductColumns] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false);

  const [startDeliveryDate, setStartDeliveryDate] = useState(null);
  const [signOffDate, setSignOffDate] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [locationKeys, setLocationKeys] = useState([]);
  const { isOffline } = useContext(CustomOfflineContext);
  const [openDateDialog, setOpenDateDialog] = useState({ open: false, type: null, status: null, prevStatus: null, assets: [], loading: false });
  const [resourceData, setResourceData] = useState(null);

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
        data = await findOne(objectStore.resource, sidebarResource.deliveryTicket);
      } else {
        const response = await axiosInstance().get(`/field?resource=${sidebarResource['deliveryTicket']}&showHiddenFields=true`);
        data = response?.data?.data;
      }

      let ticketTypeKey;
      for (let key in DELIVERY_TICKET_REFERENCE_TYPE) {
        if (ticket?.type === DELIVERY_TICKET_REFERENCE_TYPE[key]) {
          ticketTypeKey = key;
          break;
        }
      }
      data = data.filter((fields: any) => {
        if (
          [...Object.keys(DELIVERY_TICKET_REFERENCE_TYPE)?.filter((e) => e !== ticketTypeKey), 'pickupFromType', 'deliveryToType'].includes(
            fields.fieldData.fieldName
          )
        ) {
          return false;
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
      dispatch({ type: 'selection', selectedRecords: [] });
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
          setStartDeliveryDate(displayDateTime(startDeliverySignatures[startDeliverySignatures.length - 1].date));
        }
        setSignOffDate(data?.actualDeliveryDate);
        const signOffSignatures = data?.signatures?.filter((f) => f.status === 'Sign-Off' && f.date);
        if (signOffSignatures && signOffSignatures.length > 0) {
          setSignOffDate(displayDateTime(signOffSignatures[signOffSignatures.length - 1].date));
        }
        setCanEdit([...(data?.collaborator ?? []), data?.owner ?? {}, data?.processor ?? {}].some((obj) => obj.optionValue === user.user._id));
        setSignatures(data?.signatures || []);
        fetchProductInventory();
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
      setLoading(false);
    }
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.deliveryTicket}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    fetchGridColumns();
    fetchPolicy();
  }, []);

  const defaultColumns = [
    {
      accessor: 'qty',
      Header: 'Qty',
      width: 100,
      minWidth: 100,
      order: 1,
      disabled: true,
      Cell: ({ row }) => (row?.original?.qty ? <div>{row?.original?.qty}</div> : <NoDataCell />)
    }
  ];

  const fetchGridColumns = async () => {
    try {
      let assetData, productData;
      if (isOffline) {
        assetData = await findOne(objectStore.resource, sidebarResource.serializedAsset);
        productData = await findOne(objectStore.resource, sidebarResource.product);
      } else {
        const assetResponse = await axiosInstance().get(`/field?resource=${sidebarResource.serializedAsset}&view=true`);
        const productResponse = await axiosInstance().get(`/field?resource=${sidebarResource.product}&view=true`);
        assetData = assetResponse?.data?.data;
        productData = productResponse?.data?.data;
      }
      const newAssetColumns = generateColumns(renderedFrom, assetData, routes.serializedAssetDetail.path, true);
      const newProductColumns = generateColumns(renderedFrom, productData, routes.productDetail.path);
      setSerializedAssetColumns([...newAssetColumns, ...getStaticFields()]);
      setProductColumns([...defaultColumns, ...newProductColumns]);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchProductInventory = async () => {
    try {
      dispatch({ type: 'loading', loading: true });

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
    const assets = dataRows?.map((e) => {
      return { asset: e._id, uniqueId: e.uniqueId };
    });
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
            <CustomBreadCrumbs
              routes={[{ ...routes.deliveryTicket, title: resources?.deliveryTicket?.titlePlural }, { title: deliveryTicketData?.ticketName }]}
            />
          </Box>
          <Box className="controls-v1">
            <Box className="control-buttons-v1">
              {permissions?.deliveryTicket?.isUpdate &&
                canEdit &&
                deliveryTicketData?.type === DELIVERY_TICKET_REFERENCE_TYPE.rentalJob &&
                [DELIVERY_TICKET_STATUS.inTransit].includes(deliveryTicketData?.status) &&
                [DELIVERY_TICKET_TYPE.loading, DELIVERY_TICKET_TYPE.receiving].includes(deliveryTicketData?.ticketType) && (
                  <ThemeButton
                    iconForMobile={deliveryTicketData?.ticketType === DELIVERY_TICKET_TYPE.loading ? <TbTruckDelivery /> : <RiFolderReceivedLine />}
                    mobileTooltip={deliveryTicketData?.ticketType === DELIVERY_TICKET_TYPE.loading ? 'Delivered to Customer' : 'Receive Item'}
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
                  </ThemeButton>
                )}

              {permissions?.deliveryTicket?.isUpdate &&
                canEdit &&
                ![DELIVERY_TICKET_STATUS.delivered, DELIVERY_TICKET_STATUS.cancelled].includes(deliveryTicketData?.status) && (
                  <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpenUpdateDialog} tooltip={'Edit'}>
                    {'Edit'}
                  </ThemeButton>
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
                fileName={`${resources?.deliveryTicket?.titleSingular}-${deliveryTicketData?.ticketName}`}
                columns={serializedAssetColumns?.length ? serializedAssetColumns : productColumns}
                defaultColumns={
                  serializedAssetColumns?.length ? ['assetNumber', 'product', 'productDescription'] : ['productName', 'productDescription']
                }
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
          <CustomTabs value={tabValue} onChange={handleMainTabChange}>
            <CustomTab value={0}>Header</CustomTab>
            {permissions?.serializedAsset?.isRead && <CustomTab value={1}>Serialized Assets</CustomTab>}
            <CustomTab value={2}>Additional Products</CustomTab>
            {deliveryTicketData?.additionalCost?.length > 0 && <CustomTab value={3}>Add-On</CustomTab>}
            {resourceData &&
              resourceData?.tabs?.length > 0 &&
              resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 4}>{tab?.tabName}</CustomTab>)}
          </CustomTabs>
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
          {permissions?.serializedAsset?.isRead && (
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={1} className="p-2">
                <Grid item xs={12} className="d-flex mt-2 gap-2">
                  {deliveryTicketData?.status === 'New' && (
                    <IconButton
                      onClick={() => {
                        setAddSerializedAssetDialog(true);
                      }}
                      disabled={isOffline}
                      color="primary"
                      size="small"
                    >
                      <HtmlTooltip title="Add More Serialized Assets">
                        <AddBoxRoundedIcon />
                      </HtmlTooltip>
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
                      <HtmlTooltip title="Remove Serialized Assets">
                        <RemoveCircleRoundedIcon />
                      </HtmlTooltip>
                    </IconButton>
                  )}
                  <Box mx={1} />
                </Grid>
                <Grid item xs={12}>
                  {serializedAssetColumns ? (
                    <CustomReactTable
                      height={'calc(100vh - 150px)'}
                      columns={serializedAssetColumns}
                      state={state}
                      dispatch={dispatch}
                      renderedFrom={renderedFrom}
                      refreshGrid={fetchProductInventory}
                      hideSelection={!(deliveryTicketData?.status === 'New')}
                      hideAction={true}
                      isClientSideGrid={true}
                    />
                  ) : (
                    <Box p={2} height={500}>
                      <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                  )}
                </Grid>
              </Grid>
            </TabPanel>
          )}
          <TabPanel value={tabValue} index={2}>
            <DeliveryTicketProduct
              renderedFrom={`${camelCase(sidebarResource.deliveryTicket)}_grid-2`}
              deliveryTicketId={id}
              columns={productColumns}
            />
          </TabPanel>
          {deliveryTicketData?.additionalCost?.length > 0 && (
            <TabPanel value={tabValue} index={3}>
              <DeliveryTicketAdditionalCost
                renderedFrom={`${camelCase(sidebarResource.deliveryTicket)}_grid-3`}
                additionalCost={deliveryTicketData?.additionalCost}
              />
            </TabPanel>
          )}
          {resourceData &&
            resourceData?.tabs?.length > 0 &&
            resourceData?.tabs?.map((tab, i) => {
              return (
                <TabPanel value={tabValue} index={i + 4}>
                  <Step
                    tab={tab}
                    resourcePolicyId={resourceData?._id}
                    resourceId={id}
                    resource={sidebarResource.deliveryTicket}
                    data={deliveryTicketData}
                    allowedToEdit={permissions?.deliveryTicket?.isUpdate}
                  />
                </TabPanel>
              );
            })}
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
