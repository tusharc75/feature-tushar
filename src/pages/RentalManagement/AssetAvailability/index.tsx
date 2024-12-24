import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, Typography } from '@mui/material';
import axiosInstance from 'src/axios/axiosInstance';
import { ACTIVITY_RESOURCE, CustomDialogTransition, rentalManagement } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import DashboardModal, { ModalHead } from 'src/components/DashboardModal';
import Skeleton from '@material-ui/lab/Skeleton';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { CreateTask } from 'src/components/Activity/Task/CreateTask';
import { isMobile, isTablet } from 'react-device-detect';
import { SerializedAssetAvailableIllustration } from 'src/assets/svg/svgIcons';
import { useData } from 'src/StateProvider/Provider';

interface CssObj {
  [index: string]: React.CSSProperties;
}

const styles: CssObj = {
  card: {
    border: '1px solid var(--common-border-color)',
    boxShadow: '0px 5.44444px 27.2222px rgba(0, 0, 0, 0.06)',
    borderRadius: '8px',
    padding: '16px 20px 20px',
    marginTop: 22,
    position: 'relative'
  },
  cardWithPb: {
    border: '1px solid var(--common-border-color)',
    boxShadow: '0px 5.44444px 27.2222px rgba(0, 0, 0, 0.06)',
    borderRadius: '8px',
    padding: '16px 20px 64px',
    marginTop: 22,
    position: 'relative'
  },
  minH: {
    minHeight: 250
  },
  typographyh: {
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: '1.14',
    marginBottom: '8px',
    color: 'var(--primary-text)'
  },
  typographyd: {
    fontSize: '13px',
    color: 'var(--dark-secondary-text)'
  },
  buttonContaier: {
    position: 'absolute',
    bottom: 20,
    right: 20
  }
};

const ShowProduct = ({ product, resources }) => {
  const [productHeader, setProductHeader] = useState(null);
  const findLabel = async () => {
    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: 'Product',
          fieldNames: ['productName']
        }
      ]
    });
    setProductHeader(data[0].fieldNames[0]);
  };

  useEffect(() => {
    findLabel();
  }, []);

  return (
    <div
      className="d-flex mt-3 flex-wrap pl-3 pr-3"
      style={{
        gap: 24,
        padding: '14px 20px',
        border: '1px solid var(--common-border-color)',
        borderRadius: '10px',
        boxShadow: '0px 5.44444px 27.2222px rgba(0, 0, 0, 0.06)'
      }}
    >
      <div>
        <Typography style={styles.typographyh}>{productHeader ? productHeader?.fieldLabel : 'Product Type'}</Typography>
        <Typography style={styles.typographyd}>{product?.productName}</Typography>
      </div>
      <div>
        <Typography style={styles.typographyh}>Requested Qty</Typography>
        <Typography style={styles.typographyd}>{product?.qty}</Typography>
      </div>
      <div>
        <Typography style={styles.typographyh}>Asset Available</Typography>
        <Typography style={styles.typographyd}>{product?.assetAvailable}</Typography>
      </div>
      {!product?.baseWarehouse && (
        <div>
          <Typography style={styles.typographyh}>{resources?.warehouse?.titleSingular}</Typography>
          <Typography style={styles.typographyd}>{product?.warehouse?.optionLabel}</Typography>
        </div>
      )}
    </div>
  );
};

export default function AssetAvailability({ rentalId, handleClose }) {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { resources }
  }: any = useData();

  const [modalContent, setModalContent] = useState<ModalHead | null>({
    title: 'Checking Assets Availability',
    icon: <Skeleton variant="circle" width={32} height={32} />
  });

  const [products, setProducts] = useState(null);
  const [canFulfil, setCanFulfil] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [taskDialog, setTaskDialog] = useState(false);

  useEffect(() => {
    setModalContent({
      title: 'Checking Assets Availability',
      icon: <Skeleton variant="circle" width={32} height={32} />
    });
    setCanFulfil(null);
    axiosInstance()
      .get(`${rentalManagement.api}/automation/check-asset-availability/${rentalId}`)
      .then(({ data: { data } }) => {
        const rows: any = data;
        setProducts(rows);
        if (
          (rows?.length > 0 &&
            rows?.filter((e) => e.baseWarehouse)?.length === rows?.filter((e) => e.baseWarehouse && e.qty <= e.assetAvailable)?.length) ||
          rows?.length === 0
        ) {
          setCanFulfil(true);
        } else {
          setCanFulfil(false);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [rentalId]);

  useEffect(() => {
    if (canFulfil) {
      setModalContent({
        title: `${resources?.serializedAsset?.titleSingular} Available`,
        icon: <CheckCircleIcon color="secondary" />
      });
    } else if (canFulfil === false) {
      setModalContent({
        title: `Unable to fulfill ${resources?.serializedAsset?.titleSingular} requirement(s) from this ${resources?.warehouse?.titleSingular}.`,
        icon: <ErrorIcon color="error" />
      });
    } else {
      setModalContent({
        title: 'Checking Assets Availability',
        icon: <Skeleton variant="circle" width={32} height={32} />
      });
    }
  }, [canFulfil]);

  return (
    <DashboardModal
      dialogProps={{
        maxWidth: 'md',
        fullScreen: isMobile
      }}
      open={true}
      modalHead={{ ...modalContent, fullScreenOption: true }}
      handleClose={handleClose}
    >
      {products && canFulfil !== null ? (
        canFulfil ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <SerializedAssetAvailableIllustration />
            <Typography style={{ fontSize: '16px', fontWeight: '500', marginTop: '20px', lineHeight: '1.8' }}>
              {resources?.serializedAsset?.titlePlural} are available for all the products.
              <br /> Job can be fulfilled.
            </Typography>
          </div>
        ) : (
          <Box>
            <div className="mt-2">
              {products
                ?.filter((e) => e.baseWarehouse && e.qty > e.assetAvailable)
                ?.map((product) => <ShowProduct key={product._id} product={product} resources={resources} />)}
            </div>
            {products?.filter((e) => !e.baseWarehouse)?.length > 0 && (
              <Box pt={3} style={{ ...styles.cardWithPb, ...styles.minH }}>
                <Typography
                  style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    background: '#FFAE00',
                    padding: '2px 15px',
                    borderRadius: '8px',
                    maxWidth: 'max-content',
                    color: '#fff'
                  }}
                >{`${resources?.serializedAsset?.titlePlural} are available in other ${resources?.warehouse?.titlePlural}`}</Typography>
                <div className="mt-2">
                  {products
                    ?.filter((e) => !e.baseWarehouse)
                    ?.map((product) => <ShowProduct key={product._id} product={product} resources={resources} />)}
                  <div className="mt-3" style={{ ...styles.buttonContaier }}>
                    <Button
                      size="small"
                      variant={'contained'}
                      color="primary"
                      onClick={() => {
                        setTaskDialog(true);
                      }}
                    >
                      Create Task
                    </Button>
                  </div>
                </div>
              </Box>
            )}
          </Box>
        )
      ) : (
        <div className="mt-2" style={{ maxWidth: 'calc(100% - 8px)' }}>
          <CommonSkeleton lenArray={[...Array(2).keys()]} sm={12} md={false} />
        </div>
      )}
      {taskDialog && (
        <Dialog
          open={taskDialog}
          TransitionComponent={CustomDialogTransition}
          fullScreen={fullScreen || isMobile || isTablet}
          aria-taskDialog="customized-dialog-title"
          maxWidth={'md'}
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              setTaskDialog(false);
            }
          }}
          fullWidth
        >
          <CreateTask
            taskId={null}
            handleClose={() => {
              setTaskDialog(false);
              setFullScreen(false);
            }}
            defaultName="Assets Transfer Request"
            defaultDescription={`Transfer Request for following products - ${products
              ?.filter((e) => !e.baseWarehouse)
              ?.map((e) => `${e.productName}-${e.qty}`)
              ?.toString()}`}
            relatedTo={[
              {
                type: ACTIVITY_RESOURCE.rentalManagement,
                referenceId: rentalId,
                access: true
              }
            ]}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
          />
        </Dialog>
      )}
    </DashboardModal>
  );
}
