import { Box, useMediaQuery } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Skeleton } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import { ACTIVITY_RESOURCE, MATERIAL_TYPE, serviceMaster, sidebarResource } from '../../constants/helpers';
import ConfigureFields from './Fields';
import ManageServiceMaster from './ManageServiceMaster';
import Product from './Product';
import Steps from './Steps';
import LeadTime from 'src/components/LeadTime';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import Step from '../DynamicForm/Step';
import Grid from '@mui/material/Grid2';

const ServiceMasterDetailsPage = () => {
  const isMobile = useMediaQuery('(max-width:768px)');
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [resourceData, setResourceData] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);

  const [serviceMasterDetailData, setServiceMasterDetailData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openConfigureFields, setOpenConfigureFields] = useState(false);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchFields();
    fetchData();
    fetchPolicy();
  }, [id]);

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.serviceMaster}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

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
        history.push(`${routes.serviceMaster.path}`);
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
          <CustomBreadCrumbs
            routes={[
              { ...routes?.serviceMaster, title: resources?.serviceMaster?.titlePlural },
              { title: `${serviceMasterDetailData?.serviceName || ''}` }
            ]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {!serviceMasterDetailData ? (
              <Skeleton variant="text" width="150px" height="32px" />
            ) : (
              <>
                {permissions?.serviceMaster?.isUpdate && !isMobile && (
                  <ThemeButton
                    variant={'outlined'}
                    onClick={() => {
                      setOpenConfigureFields(true);
                    }}
                    mobileTooltip={'Configure Fields'}
                  >
                    {'Configure Fields'}
                  </ThemeButton>
                )}
                {permissions?.serviceMaster?.isUpdate && (
                  <ThemeButton
                    iconForMobile={<EditIcon />}
                    variant={'outlined'}
                    onClick={() => {
                      setOpenUpdateDialog(true);
                    }}
                    mobileTooltip={'Edit'}
                  >
                    {'Edit'}
                  </ThemeButton>
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
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0} label={<>Details</>} />
          <CustomTab value={1} label={<>Steps</>} />
          <CustomTab value={2} label={<>Consumables/Tools</>} />
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 3}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box className="form-v1">
            {loading || (!fields.length && serviceMasterDetailData != null) ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Grid>
            ) : (
              <>
                <DetailsPage data={serviceMasterDetailData} fields={fields} />
                <Box mb={2} mt={2}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 12, md: 6, lg: 6 }}>
                      <LeadTime referenceType={MATERIAL_TYPE.service} referenceId={id} referenceLabel={serviceMasterDetailData?.serviceName} />
                    </Grid>
                  </Grid>
                </Box>
              </>
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Steps serviceId={id} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Product id={id} />
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 3}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.serviceMaster}
                  data={serviceMasterDetailData}
                  allowedToEdit={permissions?.serviceMaster?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.serviceMaster?.titleSingular?.toLowerCase()} : ${serviceMasterDetailData?.serviceName} ?`}
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

      {openConfigureFields && (
        <ConfigureFields
          serviceId={id}
          handleClose={() => {
            setOpenConfigureFields(false);
          }}
          handleSucess={() => {
            setOpenConfigureFields(false);
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default ServiceMasterDetailsPage;
