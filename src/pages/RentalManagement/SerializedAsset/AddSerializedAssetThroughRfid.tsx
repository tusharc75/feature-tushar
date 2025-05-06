import { Box } from '@mui/material';
import Dialog from '@mui/material/Dialog/Dialog';
import TextField from '@mui/material/TextField';
import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../axios/axiosInstance';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { ASSET_STATUS, CustomDialogTransition, prepareDataForGrid, rentalManagement, serializedAsset } from '../../../constants/helpers';

const AddSerializedAssetThroughRfid = ({ onSuccess, onClose, selectedProducts, referenceData }) => {
  const toastConfig = useContext(CustomToastContext);

  const [assetNumber, setAssetNumber] = useState('');
  const assetNumberRef = useRef(null);
  const [products, setProducts] = useState(null);
  const [isAdding, setAdding] = useState(false);

  useEffect(() => {
    if (assetNumberRef.current) {
      assetNumberRef.current.focus();
    }
    setProducts(selectedProducts);
  }, []);

  const handleAddSerializedAsset = (assets) => {
    var data = [];
    products?.forEach((e: any) => {
      let qty = e.realAssetQty - e.realAssetAssignedQty;
      while (qty) {
        const result = assets.filter((f) => f.productId === e.materialId && !f.isCounted);
        if (result.length) {
          let obj: any = {};
          obj._id = e._id;
          obj.inventory = result[0].id;
          obj.product = e.materialId;
          data.push(obj);
          result[0].isCounted = true;
          e.realAssetAssignedQty++;
        }
        qty--;
      }
    });
    if (data?.length) {
      setAdding(true);
      axiosInstance().post(`${rentalManagement.api}/${referenceData._id}/inventory`, { products: data, withTransfer: false }).then(({ data }) => {
        setAdding(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Asset(s) assigned successfully'
        });
        const updatedProducts = products?.filter((e: any) => e.realAssetQty - e.realAssetAssignedQty > 0);
        if (updatedProducts?.length) {
          setProducts(updatedProducts);
          setAssetNumber('');
        } else {
          onSuccess();
        }
      }).catch((error) => {
        setAdding(false);
        toastConfig.setToastConfig(error);
      });
    }
  };

  const assignAssets = async (assetNumber: string) => {
    try {
      toastConfig.setToastConfig({
        message: 'Assigning assets...',
        type: 'info',
        open: true
      });
      const deepFilter: any = [{ field: 'assetNumber', term: assetNumber }];
      let queryString = `?deepFilter=${JSON.stringify(deepFilter)}&rentalJobId=${referenceData?._id}`;
      if (selectedProducts.length > 0) {
        var updatedFilters = [];
        updatedFilters.push({ field: 'product', term: { $in: selectedProducts.map((m) => m?.id) } });
        queryString = `${queryString}&filterById=${JSON.stringify(updatedFilters)}&filterType=and`;
      }

      const response = await axiosInstance().get(`${serializedAsset.api}${queryString}`);
      const assets = response?.data?.data?.filter((d) => d?.assetNumber === assetNumber);
      if (assets?.length > 0) {
        const rows = assets.map(u => prepareDataForGrid(u));
        const assetsToAssign = [];
        for (const product of selectedProducts) {
          const matchedAssets = rows.filter(asset => asset.productId === product.id);
          let assetsToTake = matchedAssets?.slice(0, product.qty);
          assetsToTake = assetsToTake?.map((asset) => {
            if(![ASSET_STATUS.new, ASSET_STATUS.available].includes(asset.status)) {
              toastConfig.setToastConfig({
                message: `Asset(${asset.assetNumber}) status is not valid for ${product.productName}`,
                type: 'error',
                open: true
              });
              return null;
            }
            return asset;
          })?.filter(Boolean);

          assetsToAssign.push(...assetsToTake);
        }
        if (assetsToAssign.length > 0) {
          handleAddSerializedAsset(assetsToAssign)
        }
      } else {
        toastConfig.setToastConfig({
          message: 'No asset found for selected product(s)',
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
      <Dialog
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        maxWidth="xs"
        fullWidth
      >
        <CustomDialogHeader showRequiredLabel={false} title={`Scan RFID`} onClose={onClose}       ></CustomDialogHeader>
        <CustomDialogContent isFooterPresent={false}>
          <Box pt={1} pb={1} className="main-container-v1">
            <TextField
              disabled={isAdding}
              autoFocus
              margin="dense"
              fullWidth
              label="Asset Number"
              placeholder='Auto paste asset number when scan'
              variant="outlined"
              size='small'
              inputRef={assetNumberRef}
              value={assetNumber}
              onChange={(e) => setAssetNumber(e.target.value)}
              onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                e.preventDefault();
                const pastedText = e?.clipboardData?.getData('text')?.trim();
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
