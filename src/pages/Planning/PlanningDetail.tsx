import { Box, Button, Grid } from '@mui/material';
import { Edit } from '@material-ui/icons';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import { ACTIVITY_RESOURCE, PLANNING_STATUS, checkIsAllowedToDelete, checkIsAllowedToEdit, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import Step from '../DynamicForm/Step';
import ManagePlanning from './ManagePlanning';
import Material from './Material';

const PlanningDetail = () => {
  const renderedFrom = camelCase(sidebarResource.planning);

  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, resources }
  }: any = useData();
  const [planningData, setPlanningData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [showConverConfirmBox, setShowConverConfirmBox] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [reserveAssetWarning, setReserveAssetWarning] = useState(false);
  const [resourceData, setResourceData] = useState(null);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
      fetchPolicy();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get('/field?resource=Planning')
      .then(({ data }) => {
        setFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.planning.path}/${id}`);
      var isAllowedToEdit = checkIsAllowedToEdit(user, sidebarResource.planning, data);
      if (data?.status === PLANNING_STATUS.converted) {
        isAllowedToEdit = false;
      }
      setAllowedToEdit(isAllowedToEdit);
      setAllowedToDelete(
        permissions?.planning?.isDelete && checkIsAllowedToDelete(user, sidebarResource.planning, data.owner.optionValue) && data?.canDelete
      );
      setPlanningData(data);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.planning}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.planning?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);

          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.planning.path}`);
        })
        .catch((err) => {
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  const handleConvert = () => {
    axiosInstance()
      .post(`${routes?.planning?.path}/convert-planning`, { id: planningData?._id })
      .then(({ data }) => {
        setShowConverConfirmBox(false);
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ ...routes.planning, title: resources?.planning?.titlePlural }, { title: planningData?.planningNumber }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.planning?.isUpdate && allowedToEdit && !planningData?.canDelete && planningData?.status != PLANNING_STATUS.converted && (
                <Button
                  variant={'contained'}
                  className="btn-outline-v1"
                  onClick={() => {
                    setShowConverConfirmBox(true);
                  }}
                >
                  {'Convert'}
                </Button>
              )}
              {permissions?.planning?.isUpdate && allowedToEdit && (
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                  {isMobile && !isTablet ? <Edit /> : 'Edit'}
                </Button>
              )}
              {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              <ActivityButton referenceId={planningData?._id} resource={ACTIVITY_RESOURCE.planning} resourceLabel={planningData?.planningNumber} />
            </>
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <CustomTabs value={tabValue} onChange={handleMainTabChange} textColor="primary">
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          {resourceData && resourceData?.tabs?.length && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 2}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !fields?.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={planningData} fields={fields} />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {planningData && (
            <Material
              renderedFrom={`${renderedFrom}_grid-1`}
              allowedToEdit={allowedToEdit && permissions?.planning?.isUpdate ? true : false}
              planningData={planningData}
              fetchPlanningData={fetchData}
              setReserveAssetWarning={setReserveAssetWarning}
            />
          )}
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 2}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.planning}
                  data={planningData}
                  allowedToEdit={permissions?.planning?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.planning?.titleSingular?.toLowerCase()} : ${planningData?.planningNumber || ''} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {showConverConfirmBox && (
        <ConfirmationDialog
          open={true}
          message={
            reserveAssetWarning
              ? 'Asset(s) are not available, should we allow to convert without asset(s) ?'
              : `Are you sure you want to convert planning  ${planningData?.planningNumber} ?`
          }
          onClose={() => {
            setShowConverConfirmBox(false);
          }}
          onOk={handleConvert}
        />
      )}
      {openUpdateDialog && (
        <ManagePlanning
          id={id}
          isClone={false}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default PlanningDetail;
