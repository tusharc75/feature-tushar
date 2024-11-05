import { Box, Button, CircularProgress, Dialog, Grid } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { ASSET_STATUS, CustomDialogTransition, gridLoadingTimeout, prepareDataForGrid, rentalManagement } from 'src/constants/helpers';
import ManageRentalManagementDialog from 'src/pages/RentalManagement/ManageRental';
import AssetDetailsChangeDialog from 'src/pages/RentalManagement/ReceivingTicket/AssetDetailsChangeDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const renderedFrom = 'assemblyOrder_rental_management_existing';

const ExistingRentalJob = ({ onClose, referenceData, managedPackageIds, inventory = [], assetPolicyData = null }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, selectedEntity }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showRentalDialog, setShowRentalDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openAssetDataDialog, setOpenAssetDataDialog] = useState({ open: false, statusPolicy: null, _ids: null, rentalId: null });

  const { state, dispatch } = useTableReducer({ renderedFrom });
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
      const response: any = await axiosInstance().post(`${rentalManagement.api}/pending-asset-rental`, {});
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

  const handleAdd = (rentalId) => {
    if (rentalId) {
      const statusPolicy = assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === ASSET_STATUS.reserved);
      if (statusPolicy) {
        if (statusPolicy?.products && statusPolicy?.products?.length > 0) {
          const assetIds = inventory?.filter((r) => statusPolicy?.products?.includes(r?.productId))?.map((a) => a?._id);
          if (assetIds && assetIds?.length > 0) {
            setOpenAssetDataDialog({ open: true, statusPolicy: statusPolicy, _ids: assetIds, rentalId: rentalId });
          }
        } else {
          setOpenAssetDataDialog({ open: true, statusPolicy: statusPolicy, _ids: inventory?.map((a) => a?._id), rentalId: rentalId });
        }
      } else {
        handleAddManagedPAckage(rentalId);
      }
    }
  };

  const handleAddManagedPAckage = (rentalId, reserveAssetsData = null) => {
    setIsSubmitting(true);
    axiosInstance()
      .post(`${rentalManagement.api}/productpackage/${rentalId}/managedPackages`, {
        ids: managedPackageIds,
        reserveAssetsData: reserveAssetsData
      })
      .then(() => {
        setIsSubmitting(false);
        setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null, rentalId: null });
        onClose();
      })
      .catch((error) => {
        setIsSubmitting(false);
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
                handleAdd(selectedRecords[0]?._id);
              }}
              variant={'contained'}
              disabled={isSubmitting || selectedRecords.length > 1 || selectedRecords.length === 0}
              endIcon={isSubmitting && <CircularProgress color="inherit" size={18} />}
            >
              Add
            </Button>
          </Grid>
        </Box>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
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
            handleAdd(data?._id);
          }}
        />
      )}

      {openAssetDataDialog.open && (
        <AssetDetailsChangeDialog
          ids={openAssetDataDialog._ids}
          statusPolicy={openAssetDataDialog.statusPolicy}
          setAssetsData={() => { }}
          onClose={() => setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null, rentalId: null })}
          onSuccess={(_assetData) => {
            handleAddManagedPAckage(openAssetDataDialog.rentalId, _assetData);
          }}
        />
      )}
    </Dialog>
  );
};

export default ExistingRentalJob;
