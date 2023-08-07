import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Tabs, Tab } from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { ACTIVITY_RESOURCE, serviceMaster } from '../../constants/helpers';
import ManageServiceMaster from './ManageServiceMaster';
import { BiEdit } from 'react-icons/bi';
import { isMobile, isTablet } from 'react-device-detect';
import DeleteButton from '../../components/Helpers/DeleteButton';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import LeadTimeMaster from '../../components/LeadTime';
import Steps from './Steps';
import Product from './Product';
import { Skeleton } from '@material-ui/lab';
import ActivityButton from 'src/components/Activity/ActivityButton';

const ServiceMasterDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();

  const [serviceMasterDetailData, setServiceMasterDetailData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchFields();
    fetchData();
  }, [id]);

  const fetchFields = () => {
    axiosInstance()
      .get(`/field?resource=${serviceMaster.resource}`)
      .then(({ data }) => {
        setFields(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    setLoading(true);
    axiosInstance()
      .get(`${serviceMaster.api}/${id}`)
      .then(({ data: { data } }) => {
        setServiceMasterDetailData(data);
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${serviceMaster.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };
  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.serviceMaster, { title: `${serviceMasterDetailData?.serviceName || ''}` }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {!serviceMasterDetailData ? (
              <Skeleton variant="text" width="150px" height="32px" />
            ) : (
              <>
                {permissions?.product?.isUpdate && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    size="small"
                    className={'btn-outline-v1'}
                    onClick={() => {
                      setOpenUpdateDialog(true);
                    }}
                  >
                    {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                  </Button>
                )}
                {permissions?.serviceMaster?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </>
            )}
            <ActivityButton 
              referenceId={serviceMasterDetailData?._id} 
              resource={ACTIVITY_RESOURCE.serviceMaster} 
              resourceLabel={serviceMasterDetailData?.serviceName}
              />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Tabs
          className="new-tab-container-v1"
          value={tabValue}
          onChange={handleMainTabChange}
          textColor="primary"
          TabIndicatorProps={{
            style: {
              height: 0
            }
          }}
        >
          <Tab label={<div className="tab-font">Details</div>} value={0} aria-controls="a11y-tabpanel-0" id="a11y-tab-0" className={'tabLayout'} />
          <Tab label={<div className="tab-font">Steps</div>} value={1} aria-controls="a11y-tabpanel-1" id="a11y-tab-1" className={'tabLayout'} />
          <Tab
            label={<div className="tab-font">Consumables/Tools</div>}
            value={2}
            aria-controls="a11y-tabpanel-2"
            id="a11y-tab-2"
            className={'tabLayout'}
          />
        </Tabs>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            {tabValue === 0 && (
              <Box className="form-v1">
                {loading || (!fields.length && serviceMasterDetailData != null) ? (
                  <Grid container spacing={2} style={{ padding: '8px' }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <>
                    <DetailsPage data={serviceMasterDetailData} fields={fields} />
                    {permissions?.leadTimeMaster?.isRead && (
                      <Box mb={2} mt={2}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <LeadTimeMaster Id={id} type={'service'} />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
            {tabValue === 1 && <Steps serviceId={id} />}
            {tabValue === 2 && <Product id={id} />}
          </Grid>
        </Grid>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.serviceMaster?.title} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageServiceMaster
          isClone={false}
          serviceMasterId={id}
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

export default ServiceMasterDetailsPage;
