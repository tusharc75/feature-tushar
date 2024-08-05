import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import Grid from '@material-ui/core/Grid/Grid';
import { Button, Dialog } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import {
  CustomDialogTransition,
  gridLoadingTimeout,
  deliveryTicket,
  rentalManagement,
  ASSET_STATUS,
  DELIVERY_TICKET_STATUS
} from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import {
  prepareDataForGrid,
  DELIVERY_TICKET_REFERENCE_TYPE,
  getObjKeys,
  DELIVERY_FROM_TO_TYPE,
  DELIVERY_TICKET_TYPE,
  sidebarResource,
  generateUniqueIdOnly
} from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import ManageDeliveryTicket from '../../DeliveryTicket/ManageDeliveryTicket';
import ManageRentalManagementDialog from '../ManageRental';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import AssetDetailsChangeDialog from 'src/pages/RentalManagement/ReceivingTicket/AssetDetailsChangeDialog';

const ExistingRentalJob = ({ referenceData, referenceType, productInventory, onClose, onSuccess, assetPolicyData = null }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, selectedEntity }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, ticketType: '', data: {}, rentalJob: null });
  const [showRentalDialog, setShowRentalDialog] = useState({ open: false, data: {} });
  const [assetsAdd, setAssetsAdd] = useState([]);
  const [openAssetDataDialog, setOpenAssetDataDialog] = useState({ open: false, statusPolicy: null, data: null });

  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;
  const { generateColumns, checkStaticField } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    const response = await axiosInstance().get(`/field?resource=Rental Management&entity=${selectedEntity}&view=true`);
    const data = response?.data?.data;
    let newColumns = generateColumns(routes.rentalManagement, data, routes.rentalManagementDetail.path);
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      newColumns.push(checkStaticField(routes.rentalManagement.title, field));
    });
    setColumns([...newColumns]);
    fetchRentalManagement();
  };

  const fetchRentalManagement = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    try {
      const data: any = {};
      data.rentalJob = referenceData._id;
      const product = [];
      productInventory
        .filter((e) => e.type === 'Asset')
        ?.forEach((ele) => {
          const filter = product.filter((e) => e.product === ele?.product?.optionValue);
          if (filter.length) {
            filter[0].qty = filter[0].qty + 1;
          } else {
            product.push({ product: ele?.product?.optionValue, qty: 1 });
          }
        });
      data.product = product;
      const response: any = await axiosInstance().post(`${rentalManagement.api}/pending-asset-rental`, data);
      const count = response?.data?.count;
      let rows = response?.data?.data.map((u) => {
        let finalObject = prepareDataForGrid(u, user);
        return finalObject;
      });
      dispatch({ type: 'initialize', data: rows, count: count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: 'loading', loading: false });
    }
  };

  const calculateNestedQty = (material, parent) => {
    const childProduct: any = material.filter((e) => e.parentId === parent._id);
    childProduct?.forEach((child) => {
      child.qty = child.qty * parent.qty;
      calculateNestedQty(material, child);
    });
  };

  const handleCreateReceivingTicket = async (rentalData, isOnlyAssetAdd, assetsData = null) => {
    const response = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalData._id}`);
    const assetsAdd = [];
    const inventory = JSON.parse(JSON.stringify(productInventory.filter((e) => e.type === 'Asset')));
    var material = response?.data?.data?.material;

    material?.forEach((element) => {
      if (element.parentId === null) {
        calculateNestedQty(material, element);
      }
    });

    material?.forEach((e: any) => {
      if (e.type === 'product') {
        let qty = e.qty;
        while (qty) {
          const result = inventory.filter((f) => f?.product?.optionValue === e.materialId && !f.isCounted);
          if (result.length) {
            let obj: any = {};
            obj._id = e._id;
            obj.inventory = result[0]._id;
            obj.product = e.materialId;
            if (assetsData) {
              const matchedAsset = assetsData?.find((asset) => asset._id === obj.inventory);
              if (matchedAsset) {
                const { _id, ...assetData } = matchedAsset;
                obj.assetData = assetData;
              }
            }
            assetsAdd.push(obj);
            result[0].isCounted = true;
          }
          qty--;
        }
      }
    });

    if (assetsAdd.length !== productInventory.filter((e) => e.type === 'Asset').length) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: `Assets selected more than the assigned quantity in other rental`
      });
      return;
    }

    if (isOnlyAssetAdd) {
      axiosInstance()
        .post(`${rentalManagement.api}/${rentalData._id}/inventory`, { products: assetsAdd })
        .then(({ data }) => {
          onSuccess();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    } else {
      setAssetsAdd(assetsAdd);
      const response = await axiosInstance().get(`/field?resource=${sidebarResource['deliveryTicket']}`);
      let fieldsDataForCreate = response?.data?.data?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const tempInitialData = getObjKeys('', fieldsDataForCreate);
      tempInitialData['ticketName'] = `${referenceData?.rentalJobName}_${generateUniqueIdOnly()}`;
      tempInitialData['ticketType'] = DELIVERY_TICKET_TYPE.receiving;
      tempInitialData['type'] = DELIVERY_TICKET_REFERENCE_TYPE.rentalJob;
      tempInitialData['rentalJob'] = referenceData._id;
      tempInitialData['pickupFromType'] = DELIVERY_FROM_TO_TYPE.customer;
      tempInitialData['pickupFrom'] = referenceData?.customerAccount?.optionValue;
      tempInitialData['pickupFromAddress'] = referenceData.shippingAddress?.optionValue;
      tempInitialData['deliveryToType'] = DELIVERY_FROM_TO_TYPE.customer;
      tempInitialData['deliveryTo'] = rentalData?.deliveryTo;
      tempInitialData['deliveryToAddress'] = rentalData?.deliveryToAddress;
      if (referenceData?.wellName?.optionValue) {
        tempInitialData['wellName'] = referenceData?.wellName?.optionValue;
      }
      if (referenceData?.wellNumber) {
        if (referenceData?.wellNumber?.optionValue) {
          tempInitialData['wellNumber'] = referenceData?.wellNumber?.optionValue;
        } else {
          tempInitialData['wellNumber'] = referenceData?.wellNumber?.map((e) => e?.optionValue);
        }
      }
      if (referenceData?.afeNumber) {
        tempInitialData['afeNumber'] = referenceData?.afeNumber;
      }
      if (referenceData?.processor?.optionValue) {
        tempInitialData['deliveryPerson'] = referenceData?.processor?.optionValue;
      }
      tempInitialData['assets'] = productInventory
        ?.filter((e) => e.type === 'Asset')
        ?.map((d) => {
          return { asset: d._id, uniqueId: d?.uniqueId };
        });
      tempInitialData['products'] = [];
      productInventory
        ?.filter((e) => e.type === 'Product')
        ?.forEach((ele) => {
          tempInitialData['products'].push({ product: ele._id, qty: ele.qty });
        });
      tempInitialData['status'] = DELIVERY_TICKET_STATUS.delivered;
      axiosInstance()
        .post(`${deliveryTicket.api}`, tempInitialData)
        .then(({ data }) => {
          handleCreateLoadingTicketAddAsstes(data?.data, rentalData._id, assetsAdd);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });

      // const data = {}
      // data["ticketName"] = referenceData.rentalJobName;
      // data["referenceId"] = referenceData._id;
      // data["pickupFromType"] = DELIVERY_FROM_TO_TYPE.customer;
      // data["pickupFrom"] = referenceData?.customerAccount?.optionValue;
      // data["pickupFromAddress"] = referenceData.shippingAddress?.optionValue;
      // data["deliveryToType"] = DELIVERY_FROM_TO_TYPE.customer;
      // data["deliveryTo"] = rentalData?.deliveryTo;
      // data["deliveryToAddress"] = rentalData?.deliveryToAddress;
      // data["startDate"] = referenceData?.estimateStartDate;
      // data["endDate"] = referenceData?.estimateStartDate;
      // data["wellName"] = referenceData?.wellName?.optionValue;
      // data["afeNumber"] = referenceData?.afeNumber;
      // if (referenceData?.processor?.optionValue) {
      //   data["processor"] = referenceData?.processor?.optionValue;
      // }
      // data["isPickupFromDisable"] = true;
      // data["isDeliveryToDisable"] = true;
      // setShowTicketDialog({ open: true, ticketType: DELIVERY_TICKET_TYPE.receiving, data: data, rentalJob: rentalData._id });
    }
  };

  const handleCreateLoadingTicketAddAsstes = (data, rentalJob, assets) => {
    const deliveryTicketData: any = {};
    deliveryTicketData._id = data._id;
    deliveryTicketData.rentalJob = rentalJob;
    deliveryTicketData.ticketType = DELIVERY_TICKET_TYPE.loading;
    axiosInstance()
      .post(`${rentalManagement.api}/${rentalJob}/inventory`, { products: assets })
      .then(({ data }) => {
        axiosInstance()
          .post(`${deliveryTicket.api}/auto-create-ticket`, deliveryTicketData)
          .then(({ data }) => {
            setShowTicketDialog({ open: false, ticketType: '', data: {}, rentalJob: null });
            onSuccess();
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const cloneRentalDetail = (rentalData) => {
    const data: any = {};
    data._id = referenceData._id;
    data.newRentalJobId = rentalData._id;
    axiosInstance()
      .post(`${rentalManagement.api}/clone-rental-detail`, data)
      .then(({ data }) => {
        let isOnlyAssetAdd = false;
        if (productInventory.some((e) => e.status === ASSET_STATUS.inUse)) {
          isOnlyAssetAdd = false;
        } else {
          isOnlyAssetAdd = true;
        }
        if (!isOnlyAssetAdd && assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === ASSET_STATUS.underReview)) {
          setOpenAssetDataDialog({
            open: true,
            statusPolicy: assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === ASSET_STATUS.underReview),
            data: { _id: rentalData._id, deliveryTo: rentalData.customerAccount, deliveryToAddress: rentalData.shippingAddress }
          });
        } else {
          handleCreateReceivingTicket(
            { _id: rentalData._id, deliveryTo: rentalData.customerAccount, deliveryToAddress: rentalData.shippingAddress },
            isOnlyAssetAdd
          );
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
      <CustomDialogHeader title={`Select ${routes.rentalManagement.title}`} onClose={onClose}></CustomDialogHeader>
      <div className="listing-grid p-3">
        <Box mb={2}>
          <Grid item xs={12} sm={12} md={12} container justify={'flex-end'}>
            <Button
              size="small"
              color="primary"
              onClick={() => {
                setShowRentalDialog({ open: true, data: {} });
              }}
              variant="contained"
            >
              {`Create ${routes.rentalManagement.title}`}
            </Button>
            <Box mx={1} />
            <Button
              size="small"
              color="primary"
              onClick={() => {
                let isOnlyAssetAdd = false;
                if (productInventory.some((e) => e.status === ASSET_STATUS.inUse)) {
                  isOnlyAssetAdd = false;
                } else {
                  isOnlyAssetAdd = true;
                }
                if (!isOnlyAssetAdd && assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === ASSET_STATUS.underReview)) {
                  setOpenAssetDataDialog({
                    open: true,
                    statusPolicy: assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === ASSET_STATUS.underReview),
                    data: {
                      _id: selectedRecords[0]?._id,
                      deliveryTo: selectedRecords[0]?.customerAccountId,
                      deliveryToAddress: selectedRecords[0]?.shippingAddressId
                    }
                  });
                } else {
                  handleCreateReceivingTicket(
                    {
                      _id: selectedRecords[0]?._id,
                      deliveryTo: selectedRecords[0]?.customerAccountId,
                      deliveryToAddress: selectedRecords[0]?.shippingAddressId
                    },
                    isOnlyAssetAdd
                  );
                }
              }}
              variant={'contained'}
              disabled={selectedRecords.length > 1 || selectedRecords.length === 0}
            >
              {`Perform Transfer`}
            </Button>
          </Grid>
        </Box>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={'rental_management_existing'}
            refreshGrid={fetchRentalManagement}
            hideAction={true}
            isClientSideGrid={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={showTicketDialog.ticketType}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.rentalJob}
          referenceData={showTicketDialog.data}
          assets={productInventory?.filter((e) => e.type === 'Asset')}
          products={productInventory?.filter((e) => e.type === 'Product')}
          onClose={() => setShowTicketDialog({ open: false, ticketType: '', data: {}, rentalJob: null })}
          onSuccess={(data) => {
            handleCreateLoadingTicketAddAsstes(data, showTicketDialog.rentalJob, assetsAdd);
          }}
        />
      )}
      {showRentalDialog.open && (
        <ManageRentalManagementDialog
          rentalManagementId={null}
          isClone={false}
          open={showRentalDialog.open}
          referenceData={{ warehouse: referenceData?.warehouse?.optionValue }}
          onClose={() => {
            setShowRentalDialog({ open: false, data: {} });
          }}
          onSuccess={(data) => {
            cloneRentalDetail(data);
          }}
        />
      )}

      {openAssetDataDialog.open && (
        <AssetDetailsChangeDialog
          ids={productInventory?.map((e) => e._id)}
          statusPolicy={openAssetDataDialog.statusPolicy}
          setAssetsData={() => { }}
          onClose={() => setOpenAssetDataDialog({ open: false, statusPolicy: null, data: null })}
          onSuccess={(_assetData) => {
            handleCreateReceivingTicket(openAssetDataDialog.data, false, _assetData);
            setOpenAssetDataDialog({ open: false, statusPolicy: null, data: null });
          }}
          staticLookUpFilters={{ wellNumber: referenceData?.wellNumber }}
        />
      )}
    </Dialog>
  );
};

export default ExistingRentalJob;
