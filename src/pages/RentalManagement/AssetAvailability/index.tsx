import React, { useContext, useEffect, useState } from 'react';
import { Dialog, IconButton, Typography } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CloseIcon from '@material-ui/icons/Close';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import DashboardModal, { ModalContent } from 'src/components/DashboardModal';
import Skeleton from '@material-ui/lab/Skeleton';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const typographyh: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  lineHeight: '1.14',
  marginBottom: '8px'
};
const typographyd: React.CSSProperties = {
  fontSize: '13px'
};

export default function AssetAvailability({ rentalId, handleAssetAvailabilityClose }) {
  const toastConfig = useContext(CustomToastContext);
  const [modalContent, setModalContent] = useState<ModalContent | null>({
    title: 'Checking Assets Availability',
    icon: <Skeleton variant="circle" width={32} height={32} />
  });
  const [asset, setAsset] = useState(null);
  const [availableAssets, setAvailableAssets] = useState(null);

  const handleCloseHelperModal = () => {
    setModalContent({ title: 'Checking Assets Availability', icon: <Skeleton variant="circle" width={32} height={32} /> });
    handleAssetAvailabilityClose();
  };

  useEffect(() => {
    axiosInstance()
      .get(`/rental-management/automation/check-asset-availability/${rentalId}`)
      .then((data: { data }) => {
        const assets = data?.data?.data;
        const fetchedAvailableAssets = [];
        const fetchedAssets = [];
        assets.map((_asset) => {
          if (_asset?.availableAssets >= _asset?.qty) {
            fetchedAvailableAssets.push(_asset);
            // setAvailableAssets([...availableAssets, _asset]);
          } else {
            fetchedAssets.push(_asset);
            // setAsset([...asset, _asset]);
          }
        });
        setAvailableAssets(fetchedAvailableAssets);
        setAsset(fetchedAssets);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [rentalId]);

  useEffect(() => {
    if (availableAssets?.length > 0 && asset?.length === 0) {
      setModalContent({
        title: 'Serialized Assets Available',
        icon: <CheckCircleIcon color="secondary" />
      });
    }
    if (asset?.length > 0) {
      setModalContent({
        title: 'Serialized Assets not Available',
        icon: <ErrorIcon color="error" />
      });
    }
  }, [asset, availableAssets]);

  return (
    <DashboardModal modalContent={modalContent} handleClose={handleCloseHelperModal} style={{ position: 'relative' }}>
      {asset === null && availableAssets === null && (
        <>
          <div className="mt-2" style={{ maxWidth: 'calc(100% - 8px)' }}>
            <CommonSkeleton lenArray={[...Array(2).keys()]} sm={12} md={false} />
          </div>
        </>
      )}
      {asset?.length > 0 ? (
        <>
          <Typography style={{ fontSize: '13px', fontWeight: '500' }}>Serialized Assets are not available for following products</Typography>
          <div className="mt-2">
            {asset?.map((_asset) => {
              return (
                <>
                  <div
                    className="d-flex pl-3 pr-3 mt-3"
                    style={{
                      padding: '14px 20px',
                      border: '1px solid var(--common-border-color)',
                      borderRadius: '10px',
                      boxShadow: '0px 5.44444px 27.2222px rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    <div>
                      <Typography style={typographyh}>Product Name</Typography>
                      <Typography style={typographyd}>{_asset?.product?.productName}</Typography>
                    </div>
                    <div className="ml-4">
                      <Typography style={typographyh}>Qty</Typography>
                      <Typography style={typographyd}>{_asset?.qty}</Typography>
                    </div>
                    <div className="ml-4">
                      <Typography style={typographyh}>Asset Status</Typography>
                      <Typography style={typographyd}>{_asset?.availableAssets}</Typography>
                    </div>
                  </div>
                </>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {availableAssets?.length > 0 && asset?.length === 0 && (
            <Typography style={{ fontSize: '13px', fontWeight: '500' }}>
              Serialized Assets are available for all the products. Rental job can be fulfilled
            </Typography>
          )}
        </>
      )}
    </DashboardModal>
  );
}
