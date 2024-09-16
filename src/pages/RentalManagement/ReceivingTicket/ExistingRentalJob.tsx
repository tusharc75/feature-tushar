import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import Grid from '@material-ui/core/Grid/Grid';
import { Button, CircularProgress, Dialog } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import {
  CustomDialogTransition,
  gridLoadingTimeout,
  rentalManagement,
  ASSET_STATUS,
} from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import {
  prepareDataForGrid,
} from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import ManageRentalManagementDialog from '../ManageRental';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import AssetDetailsChangeDialog from 'src/pages/RentalManagement/ReceivingTicket/AssetDetailsChangeDialog';
import PackageDialog from 'src/pages/RentalManagement/ReceivingTicket/PackageDialog';

const ExistingRentalJob = ({ referenceData, referenceType, productInventory, onClose, onSuccess, assetPolicyData = null }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, selectedEntity }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showRentalDialog, setShowRentalDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openPackageDialog, setOpenPackageDialog] = useState(false)
  const [openAssetDataDialog, setOpenAssetDataDialog] = useState({ open: false, statusPolicy: null, _ids: null, type: null, data: null });
  const [underReviewAssetData, setUnderReviewAssetData] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

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

  const checkAssetPolicy = (status) => {
    let result: any = null;
    const statusPolicy = assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === status);
    if (statusPolicy) {
      if (statusPolicy?.products && statusPolicy?.products?.length > 0) {
        const assetIds = productInventory?.filter(r => statusPolicy?.products?.includes(r?.productId))?.map(a => a?._id)
        if (assetIds && assetIds?.length > 0) {
          result = { statusPolicy: statusPolicy, assetIds: assetIds }
        }
      } else {
        result = { statusPolicy: statusPolicy, assetIds: productInventory?.map(a => a?._id) }
      }
    }
    return result;
  }

  const handleMoveAsset = (toRentalData, selectedPackage = null, underReviewAssetsData = null, reserveAssetsData = null) => {
    setIsSubmitting(true)
    const data: any = {
      fromRentalId: referenceData?._id,
      toRentalId: toRentalData?._id,
      isReceivingTicketCreated: false,
    }

    if ([ASSET_STATUS.available, ASSET_STATUS.underReview]?.includes(productInventory[0]?.status)) {
      data.isReceivingTicketCreated = true
    }

    const assets: any = [];
    productInventory?.forEach(inventory => {
      const obj: any = {};
      obj.asset = inventory?._id;
      obj.uniqueId = inventory?.uniqueId;
      if (underReviewAssetsData) {
        const matchedAsset = underReviewAssetsData?.find((asset) => asset._id === obj.asset);
        if (matchedAsset) {
          const { _id, ...assetData } = matchedAsset;
          obj.underReviewAssetsData = assetData;
        }
      }
      if (reserveAssetsData) {
        const matchedAsset = reserveAssetsData?.find((asset) => asset._id === obj.asset);
        if (matchedAsset) {
          const { _id, ...assetData } = matchedAsset;
          obj.reserveAssetsData = assetData;
        }
      }
      assets.push(obj);
    });
    data['assets'] = assets;

    if (selectedPackage) {
      data['packageUniqueId'] = selectedPackage?.optionValue
    }
    axiosInstance().post(`${rentalManagement.api}/move-asset-inter-rental`, data)
      .then((res) => {
        setIsSubmitting(false)
        setUnderReviewAssetData(null)
        setSelectedPackage(null)
        onSuccess()
      }).catch((error) => {
        setIsSubmitting(false)
        toastConfig.setToastConfig(error);
      })
  }

  const handlePerformTransfer = (rentalData) => {
    setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null, type: null, data: null });
    const statusPolicy = checkAssetPolicy(ASSET_STATUS.reserved)
    if (statusPolicy) {
      setOpenAssetDataDialog({ open: true, statusPolicy: statusPolicy?.statusPolicy, _ids: statusPolicy?.assetIds, type: 'reserved', data: rentalData })
    } else {
      handleMoveAsset(rentalData, selectedPackage, underReviewAssetData)
    }
  }

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
                setShowRentalDialog(true);
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
                setOpenPackageDialog(true)
              }}
              variant={'contained'}
              disabled={isSubmitting || selectedRecords.length > 1 || selectedRecords.length === 0}
              endIcon={isSubmitting && <CircularProgress color="inherit" size={18} />}
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

      {showRentalDialog && (
        <ManageRentalManagementDialog
          rentalManagementId={null}
          isClone={false}
          open={true}
          referenceData={{ warehouse: referenceData?.warehouse?.optionValue }}
          onClose={() => {
            setShowRentalDialog(false);
          }}
          onSuccess={(data) => {
            handlePerformTransfer(data)
          }}
        />
      )}

      {openPackageDialog && (
        <PackageDialog
          onClose={() => {
            setOpenPackageDialog(false)
          }}
          rentalManagementData={selectedRecords[0]}
          onSuccess={(_selectedPackage) => {
            setSelectedPackage(_selectedPackage)
            const statusPolicy = checkAssetPolicy(ASSET_STATUS.underReview)
            if (statusPolicy && ![ASSET_STATUS.available, ASSET_STATUS.underReview]?.includes(productInventory[0]?.status)) {
              setOpenAssetDataDialog({ open: true, statusPolicy: statusPolicy?.statusPolicy, _ids: statusPolicy?.assetIds, type: 'underReview', data: selectedRecords[0] })
            } else {
              handlePerformTransfer(selectedRecords[0])
            }
            setOpenPackageDialog(false)
          }}
        />
      )}

      {openAssetDataDialog.open && (
        <AssetDetailsChangeDialog
          ids={openAssetDataDialog._ids}
          statusPolicy={openAssetDataDialog.statusPolicy}
          setAssetsData={() => { }}
          onClose={() => setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null, type: null, data: null })}
          onSuccess={(_assetData) => {
            if (openAssetDataDialog.type === 'underReview') {
              setUnderReviewAssetData(_assetData)
              handlePerformTransfer(selectedRecords[0])
            } else {
              handleMoveAsset(openAssetDataDialog.data, selectedPackage, underReviewAssetData, _assetData)
              setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null, type: null, data: null });
            }

          }}
          staticLookUpFilters={{ wellNumber: referenceData?.wellNumber }}
        />
      )}
    </Dialog>
  );
};

export default ExistingRentalJob;
