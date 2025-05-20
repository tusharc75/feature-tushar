import { Box } from '@mui/material';
import Dialog from '@mui/material/Dialog/Dialog';
import TextField from '@mui/material/TextField';
import { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, rentalManagement, serializedAsset } from '../../constants/helpers';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { FlipCameraIos } from '@mui/icons-material';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const AssignDialog = ({ onSuccess, onClose, selectedProducts, referenceData, type }) => {
  const toastConfig = useContext(CustomToastContext);

  const [assetNumber, setAssetNumber] = useState('');
  const assetNumberRef = useRef(null);
  const [products, setProducts] = useState(null);
  const [isAdding, setAdding] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [assetAssigned, setAssetAssigned] = useState(false);

  useEffect(() => {
    if (assetNumberRef.current) {
      assetNumberRef.current.focus();
    }
    setProducts(selectedProducts);
  }, []);

  useEffect(() => {
    // Checking if device has multiple cameras
    if (type === 'qr' && 'mediaDevices' in navigator) {
      navigator?.mediaDevices
        ?.enumerateDevices()
        .then((devices) => {
          const videoDevices = devices?.filter((device) => device?.kind === 'videoinput');
          setHasMultipleCameras(videoDevices?.length > 1);
        })
        .catch((err) => {
          console.error('Error checking cameras:', err);
          setHasMultipleCameras(false);
        });
    }
  }, [type]);

  // currently only for rental management
  const handleAddSerializedAsset = (asset) => {
    setAdding(true);
    const product = products?.find((e: any) => e.materialId === asset.product);
    const data = [
      {
        _id: product._id,
        inventory: asset._id,
        product: product.materialId
      }
    ];

    axiosInstance()
      .post(`${rentalManagement.api}/${referenceData._id}/inventory`, { products: data, withTransfer: false })
      .then(() => {
        setAdding(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Asset assigned successfully'
        });
        setAssetAssigned(true);
        product.realAssetAssignedQty++;
        const updatedProducts = products?.filter((e: any) => e.realAssetQty - e.realAssetAssignedQty > 0);
        if (updatedProducts?.length) {
          setProducts(updatedProducts);
          setAssetNumber('');
          assetNumberRef.current.focus();
        } else {
          onSuccess();
        }
      })
      .catch((error) => {
        setAdding(false);
        toastConfig.setToastConfig(error);
      });
  };

  const assignAssets = async (assetNumber: string) => {
    try {
      toastConfig.setToastConfig({
        message: 'Assigning assets...',
        type: 'info',
        open: true
      });
      let productIds = [];
      if (selectedProducts?.length > 0) {
        productIds = selectedProducts.map((m) => m?.id);
      }
      let queryString = `?assetNumber=${assetNumber}&products=${JSON.stringify(productIds)}`;

      const response = await axiosInstance().get(`${serializedAsset.api}/find-using-asset-number${queryString}`);
      const asset = response?.data?.data;
      if (asset) {
        handleAddSerializedAsset(asset);
      }
    } catch (error: any) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleScanResult = (err, result) => {
    if (result && result?.text) {
      setAssetNumber(result?.text);
      assignAssets(result?.text);
    }
  };

  const toggleCamera = () => setFacingMode(facingMode === 'environment' ? 'user' : 'environment');

  return (
    <Fragment>
      <Dialog TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} maxWidth="xs" fullWidth>
        <CustomDialogHeader
          showRequiredLabel={false}
          title={`Scan ${type === 'qr' ? 'QR' : 'RFID'}`}
          onClose={() => {
            if (assetAssigned) {
              onSuccess();
            } else {
              onClose();
            }
          }}
        ></CustomDialogHeader>
        <CustomDialogContent isFooterPresent={false}>
          <Box pt={1} pb={1} className="main-container-v1">
            <Box display="flex" alignItems="center">
              <TextField
                disabled={isAdding}
                autoFocus
                margin="dense"
                fullWidth
                label="Asset Number"
                placeholder="Auto paste asset number when scan"
                variant="outlined"
                size="small"
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

            {type === 'qr' && (
              <Box mt={2} position="relative">
                <BarcodeScannerComponent width="100%" height="100%" onUpdate={handleScanResult} facingMode={facingMode} />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2
                  }}
                >
                  {hasMultipleCameras && (
                    <ThemeButton buttonType="theme" onClick={toggleCamera} startIcon={<FlipCameraIos />}>
                      Switch
                    </ThemeButton>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </CustomDialogContent>
      </Dialog>
    </Fragment>
  );
};

export default AssignDialog;
