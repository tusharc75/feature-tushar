import { Box, Button, Dialog, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { ASSET_STATUS, CustomDialogTransition, MATERIAL_TYPE, rentalManagement } from 'src/constants/helpers';
import AssetDetailsChangeDialog from 'src/pages/RentalManagement/ReceivingTicket/AssetDetailsChangeDialog';

const TransferToAnotherPackageDialog = ({ onClose, onSuccess, rentalManagementData, assets, material, assetPolicyData }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user }
  }: any = useData();

  const [packageOptions, setPackageOptions] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openAssetDataDialog, setOpenAssetDataDialog] = useState({ open: false, statusPolicy: null, _ids: null });
  const [underReviewAssetData, setUnderReviewAssetData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const data = material
      ?.filter((e) => e.type === MATERIAL_TYPE.package && e?.packageDetail?.packageType === 'Product')
      ?.map((e) => {
        return {
          optionLabel: e?.packageDetail?.packageName,
          optionValue: e?._id
        };
      });
    setPackageOptions(data);
  };

  const handleSubmit = (underReviewAssetsData = null, reserveAssetsData = null) => {
    setIsSubmitting(true);
    const data = [];
    assets?.forEach((ele) => {
      const obj: any = {};
      obj.asset = ele?._id;
      obj.uniqueId = ele?.uniqueId;
      obj.productId = ele?.productId;
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
      data.push(obj);
    });

    axiosInstance()
      .post(`${rentalManagement.api}/productpackage/${rentalManagementData._id}/move-asset-inter-package`, {
        assets: data,
        uniqueId: selectedPackage.optionValue
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setIsSubmitting(false);
        onSuccess();
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const checkAssetPolicy = (status) => {
    let result: any = null;
    const statusPolicy = assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === status);
    if (statusPolicy) {
      if (statusPolicy?.products && statusPolicy?.products?.length > 0) {
        const assetIds = assets?.filter((r) => statusPolicy?.products?.includes(r?.productId))?.map((a) => a?._id);
        if (assetIds && assetIds?.length > 0) {
          result = { statusPolicy: statusPolicy, assetIds: assetIds };
        }
      } else {
        result = { statusPolicy: statusPolicy, assetIds: assets?.map((a) => a?._id) };
      }
    }
    return result;
  };

  const handlePerformUnderReview = () => {
    setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null });
    const statusPolicy = checkAssetPolicy(ASSET_STATUS.reserved);
    if (statusPolicy) {
      setOpenAssetDataDialog({
        open: true,
        statusPolicy: statusPolicy?.statusPolicy,
        _ids: statusPolicy?.assetIds
      });
    } else {
      handleSubmit(underReviewAssetData);
    }
  };

  return (
    <>
      <Dialog
        maxWidth="sm"
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            onClose();
          }
        }}
      >
        <CustomDialogHeader onClose={onClose} title={`Transfer to Another Package`} showRequiredLabel={false} showManimizeMaximize={false} />
        <CustomDialogContent>
          <Box m={1}>
            <Autocomplete
              size="small"
              options={packageOptions}
              value={selectedPackage}
              onChange={(_, val) => {
                setSelectedPackage(val);
              }}
              getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
              isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
              renderInput={(props) => (
                <TextField {...props} placeholder={''} variant="outlined" name="packages" required={true} label={'Select Package'} />
              )}
            />
          </Box>
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button variant="outlined" color="primary" size="small" onClick={onClose}>
            Cancel
          </Button>
          <CustomButton
            loading={isSubmitting}
            variant="contained"
            color="primary"
            disabled={!selectedPackage || isSubmitting}
            onClick={(e) => {
              const receivingStatus = user?.user?.brandPolicy?.rentalReceivingAvailableStatus ? ASSET_STATUS.available : ASSET_STATUS.underReview;
              const statusPolicy = checkAssetPolicy(receivingStatus);
              if (statusPolicy) {
                setOpenAssetDataDialog({ open: true, statusPolicy: statusPolicy?.statusPolicy, _ids: statusPolicy?.assetIds });
              } else {
                handleSubmit();
              }
            }}
          >
            Save
          </CustomButton>
        </CustomDialogFooter>
      </Dialog>
      {openAssetDataDialog.open && (
        <AssetDetailsChangeDialog
          ids={openAssetDataDialog._ids}
          statusPolicy={openAssetDataDialog.statusPolicy}
          setAssetsData={() => { }}
          onClose={() => setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null })}
          onSuccess={(data) => {
            const receivingStatus = user?.user?.brandPolicy?.rentalReceivingAvailableStatus ? ASSET_STATUS.available : ASSET_STATUS.underReview;
            if (openAssetDataDialog.statusPolicy?.status === receivingStatus) {
              setUnderReviewAssetData(data);
              handlePerformUnderReview();
            } else {
              handleSubmit(underReviewAssetData, data);
              setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null });
            }
          }}
          staticLookUpFilters={{
            wellNumber: rentalManagementData?.wellNumber
              ? rentalManagementData?.wellNumber?.optionValue || rentalManagementData?.wellNumber?.map((e) => e?.optionValue)
              : null
          }}
        />
      )}
    </>
  );
};

export default TransferToAnotherPackageDialog;
