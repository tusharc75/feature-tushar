import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Typography, Tab, Tabs } from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { productAuction } from '../../constants/helpers';
import ManageProductAuction from './ManageProductAuction';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import { isMobile, isTablet } from 'react-device-detect';
import accountClass from '../Account/account.module.scss';
import DeleteButton from '../../components/Helpers/DeleteButton';
import Products from '../Packages/Products';
import { FaWpforms } from 'react-icons/fa';
import { camelCase } from 'lodash';
import BidsPage from './Bids';

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`main-tabpanel-${index}`} aria-labelledby={`main-tab-${index}`} {...other}>
      {children}
    </div>
  );
}

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`
  };
}

const ProductAuctionDetailsPage = () => {

  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
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
        setBids(data.bids);
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
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={[routes.productAuction, { title: `${productAuctionData?.auctionNumber}` }]} />
      </Grid>
      <Grid container spacing={1} className="detail-container">
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <Paper style={{ height: '650px' }}>
            <DetailsPageHeader heading={productAuctionData?.auctionNumber} mainPoints={null} showHeading={true}>
              {permissions?.product?.isUpdate && (
                <Button
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  color="primary"
                  size="small"
                  onClick={() => {
                    setOpenUpdateDialog(true);
                  }}
                  className={isMobile && !isTablet ? accountClass.mobile_button_layout : ''}
                  style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                >
                  {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                </Button>
              )}
              {permissions?.productAuction?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            </DetailsPageHeader>
            {/* <Box>
              {' '}
              {productAuctionData && fields.length ? (
                <DetailsPage data={productAuctionData} fields={fields} />
              ) : (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                  <CommonSkeleton lenArray={[...Array(7).keys()]} />
                </Grid>
              )}
            </Box> */}
            <Box>
              {productAuctionData && fields.length ? (
                <>
                  <Tabs
                    className="quote-tab"
                    value={tabValue}
                    onChange={handleMainTabChange}
                    textColor="primary"
                    TabIndicatorProps={{
                      style: {
                        display: 'none'
                      }
                    }}
                  >
                    <Tab
                      className={'tabLayout'}
                      style={{
                        background: tabValue === 1 ? 'white' : '',
                        color: tabValue === 1 ? '#163340' : '#163340'
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          <FaWpforms className="mr-1" fontSize="inherit" /> Header
                        </div>
                      }
                      {...a11yProps(0)}
                    />
                    <Tab
                      className={'tabLayout'}
                      style={{
                        background: tabValue === 2 ? 'white' : '',
                        color: tabValue === 2 ? 'blue' : '#163340'
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          <BiFoodMenu className="mr-1" fontSize="inherit" /> Bids
                        </div>
                      }
                      {...a11yProps(1)}
                    />
                    <div className={'uio'}> </div>
                  </Tabs>
                  <TabPanel value={tabValue} index={0}>
                    <DetailsPage data={productAuctionData} fields={fields} />
                  </TabPanel>
                  <TabPanel value={tabValue} index={1}>
                    <BidsPage bids={bids} />
                  </TabPanel>
                </>
              ) : (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                  <CommonSkeleton lenArray={[...Array(7).keys()]} />
                </Grid>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.productAuction?.title} ?`}
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
    </Fragment>
  );
};

export default ProductAuctionDetailsPage;
