import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Grid, Box, Button, Paper, Tabs, Tab } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import { camelCase } from 'lodash';
import { FaWpforms } from 'react-icons/fa';
import { BiFoodMenu, BiPackage } from 'react-icons/bi';

import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import DetailsPageHeader from 'src/components/DetailsPageHeader';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { packages } from 'src/constants/helpers';
import ManagePackageDialog from './ManagePackageDialog';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import Products from './Products';
import Services from './Services';
import Packages from './Packages';
import LeadTimeMaster from '../../components/LeadTime';
import { RiShoppingBag3Fill } from 'react-icons/ri';
import { MdMiscellaneousServices } from 'react-icons/md';

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

const PackageDetails = () => {
  const renderedFrom = camelCase(routes?.packages.title);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const [headingLabel, setHeadingLabel] = useState('');
  const [packagesLoading, setPackagesLoading] = useState(false);

  const [packageData, setPackageData] = useState(null);

  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [packageFields, setPackageFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);

  const [tabValue, setTabValue] = useState(0);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    newValue === 1 && fetchPackage();
  };

  useEffect(() => {
    if (id) {
      fetchPackage();
    }
  }, [id]);

  const getRessourceFields = () => {
    setPackagesLoading(true);
    axiosInstance()
      .get('/field?resource=Packages')
      .then(({ data: { data } }) => {
        setPackageFields(data);
        setPackagesLoading(false);
      })
      .catch((err) => {
        setPackagesLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPackage = () => {
    setPackagesLoading(true);
    axiosInstance()
      .get(`${packages.api}/${id}`)
      .then(({ data: { data } }) => {
        setPackageData(data);
        setHeadingLabel(data.packageName);
        setCustomizedRoutes([routes.packages, { title: data.packageName }]);
        getRessourceFields();
      })
      .catch((err) => {
        setPackagesLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${packages.api}/remove`, { ids: [id] })
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
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </Grid>
      <Grid container spacing={1} className="detail-container">
        <Grid item xs={12} sm={12} md={permissions?.leadTimeMaster?.isRead ? 8 : 12} lg={permissions?.leadTimeMaster?.isRead ? 8 : 12}>
          <Paper>
            {!packageData ? (
              <div>
                <Skeleton variant="text" width="150px" height="40px" />
                <Box display="flex">
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  <Box marginX={1} />
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                </Box>
              </div>
            ) : (
              <DetailsPageHeader heading={headingLabel} mainPoints={mainPoints} showHeading={true}>
                {permissions?.packages?.isUpdate && (
                  <Button variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                    Edit
                  </Button>
                )}
                {permissions?.packages?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </DetailsPageHeader>
            )}

            <Box>
              {packagesLoading || !packageFields.length ? (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                  <CommonSkeleton lenArray={[...Array(7).keys()]} />
                </Grid>
              ) : (
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
                        color: '#163340'
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          <MdMiscellaneousServices className="mr-1" fontSize="inherit" />
                          individual Services
                        </div>
                      }
                      {...a11yProps(1)}
                    />
                    <Tab
                      className={'tabLayout'}
                      style={{
                        background: tabValue === 2 ? 'white' : '',
                        color: '#163340'
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          <RiShoppingBag3Fill className="mr-1" fontSize="inherit" />
                          individual Products
                        </div>
                      }
                      {...a11yProps(2)}
                    />
                    <Tab
                      className={'tabLayout'}
                      style={{
                        background: tabValue === 2 ? 'white' : '',
                        color: '#163340'
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          <BiPackage className="mr-1" fontSize="inherit" /> Sub Packages
                        </div>
                      }
                      {...a11yProps(3)}
                    />
                    <div className={'uio'}> </div>
                  </Tabs>

                  <TabPanel value={tabValue} index={0}>
                    <DetailsPage data={packageData} fields={packageFields} />
                  </TabPanel>
                  <TabPanel value={tabValue} index={1}>
                    {tabValue === 1 && <Services packageData={packageData} packageId={id} />}
                  </TabPanel>
                  <TabPanel value={tabValue} index={2}>
                    {tabValue === 2 && <Products packageData={packageData} packageId={id} />}
                  </TabPanel>
                  <TabPanel value={tabValue} index={3}>
                    {tabValue === 3 && <Packages packageData={packageData} packageId={id} />}
                  </TabPanel>
                </>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={12} md={4} lg={4}>
          {permissions?.leadTimeMaster?.isRead && (
            <Box mb={2}>
              <LeadTimeMaster Id={id} type={'package'} />
            </Box>
          )}
        </Grid>
      </Grid>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this package: ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManagePackageDialog
          open={openUpdateDialog}
          isClone={false}
          packageId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchPackage();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </>
  );
};

export default PackageDetails;
