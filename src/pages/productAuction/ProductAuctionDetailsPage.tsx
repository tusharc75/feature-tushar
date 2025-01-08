import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import EditIcon from '@mui/icons-material/Edit';
import { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import { ACTIVITY_RESOURCE, productAuction } from '../../constants/helpers';
import BidsPage from './Bids';
import ManageProductAuction from './ManageProductAuction';

const ProductAuctionDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [productAuctionData, setProductAuctionData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [bids, setBids] = useState([]);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    fetchFields();
    fetchData();
  }, [id]);

  const fetchFields = () => {
    axiosInstance()
      .get(`/field?resource=${productAuction.resource}`)
      .then(({ data }) => {
        setFields(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    axiosInstance()
      .get(`${productAuction.api}/${id}`)
      .then(({ data: { data } }) => {
        setProductAuctionData(data);
        {
          data?.bids && setBids(data?.bids);
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${productAuction.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes.productAuction.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs
            routes={[{ ...routes.productAuction, title: resources?.productAuction?.titlePlural }, { title: `${productAuctionData?.auctionNumber}` }]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.product?.isUpdate && (
                <ThemeButton
                  iconForMobile={<EditIcon />}
                  onClick={() => {
                    setOpenUpdateDialog(true);
                  }}
                  mobileTooltip={'Edit'}
                >
                  {'Edit'}
                </ThemeButton>
              )}
              {permissions?.productAuction?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            </>
            <ActivityButton
              referenceId={productAuctionData?._id}
              resource={ACTIVITY_RESOURCE.productAuction}
              resourceLabel={productAuctionData?.auctionNumber}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {productAuctionData && fields.length ? (
          <>
            <CustomTabs value={tabValue} onChange={handleMainTabChange}>
              <CustomTab value={0}>Header</CustomTab>
              <CustomTab value={1}>Bids</CustomTab>
            </CustomTabs>
            <TabPanel value={tabValue} index={0}>
              <DetailsPage data={productAuctionData} fields={fields} />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <BidsPage bids={bids} />
            </TabPanel>
          </>
        ) : (
          <div className="p-2">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </div>
        )}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.productAuction?.titleSingular?.toLowerCase()} : ${productAuctionData?.auctionNumber || ''} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageProductAuction
          isClone={false}
          productAuctionId={id}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default ProductAuctionDetailsPage;
