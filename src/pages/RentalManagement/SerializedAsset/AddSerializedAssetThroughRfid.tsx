import { Box } from '@mui/material';
import Dialog from '@mui/material/Dialog/Dialog';
import TextField from '@mui/material/TextField';
import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, prepareDataForGrid, serializedAsset } from '../../../constants/helpers';

const AddSerializedAssetThroughRfid = ({ isAdding, onSuccess, onClose, selectedProducts, ids = [], referenceData = null, referenceType = null }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { permissions, user, resources }
  }: any = useData();

  const [assetNumber, setAssetNumber] = useState('');
  const assetNumberRef = useRef(null);

  useEffect(() => {
    if (assetNumberRef.current) {
      assetNumberRef.current.focus();
    }
  }, []);

  const getQueryString = () => {
    const ignoreIds = ids && ids?.length > 0 ? ids : [];
    let deepFilter = `?ignoreIds=${JSON.stringify(ignoreIds)}`;

    if (referenceType === 'Rental Job') {
      const dateFilter = { from: referenceData?.fromDate, to: referenceData?.toDate };
      deepFilter = `${deepFilter}&rental=true&rentalJobId=${referenceData?._id}&date=${JSON.stringify(dateFilter)}`;
    }
    return deepFilter;
  };

  const assignAssets = async (assetNumber: string) => {
    try {
      toastConfig.setToastConfig({
        message: 'Assigning assets...',
        type: 'info',
        open: true
      });
      let queryString = getQueryString();
      if (selectedProducts.length > 0) {
        var updatedFilters = [];
        updatedFilters.push({ field: 'product', term: { $in: selectedProducts.map((m) => m?.id) } });
        queryString = `${queryString}&filterById=${JSON.stringify(updatedFilters)}&filterType=and`;
      }
      const deepFilter: any = [{ field: 'assetNumber', term: assetNumber }];
      queryString = `${queryString}&deepFilter=${JSON.stringify(deepFilter)}`;

      const response = await axiosInstance().get(`${serializedAsset.api}${queryString}`);
      const assets = response?.data?.data?.filter((d) => d?.assetNumber === assetNumber);
      if (assets?.length > 0) {
        const rows = assets.map(u => prepareDataForGrid(u));
        const assetsToAssign = [];

        for (const product of selectedProducts) {
          const matchedAssets = rows.filter(asset => asset.productId === product.id);
          const assetsToTake = matchedAssets?.slice(0, product.qty);
          assetsToAssign.push(...assetsToTake);
        }

        if (assetsToAssign.length > 0) {
          onSuccess(assetsToAssign);
        }
      } else {
        toastConfig.setToastConfig({
          message: 'Invalid Asset Number',
          type: 'error',
          open: true
        });
      }
    } catch (error: any) {
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <Fragment>
      <Dialog TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} maxWidth="xs">
        <CustomDialogHeader
          showRequiredLabel={false}
          title={`Scan RFID`}
          onClose={onClose}
        ></CustomDialogHeader>
        <CustomDialogContent isFooterPresent={false}>
          <Box pt={1} pb={1} className="main-container-v1">
            <TextField
              disabled={isAdding}
              autoFocus
              margin="dense"
              fullWidth
              label="Asset Number"
              variant="outlined"
              inputRef={assetNumberRef}
              value={assetNumber}
              onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData('text');
                setAssetNumber(pastedText);
                assignAssets(pastedText);
              }}
            />
          </Box>
        </CustomDialogContent>
      </Dialog>
    </Fragment>
  );
};

export default AddSerializedAssetThroughRfid;
