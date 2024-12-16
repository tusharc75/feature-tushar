import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
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
import { ACTIVITY_RESOURCE, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import Competencies from './Competencies';
import ManageCompetencyType from './ManageCompetencyType';
import Step from '../DynamicForm/Step';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { useTableReducer } from 'src/components/CustomReactTable';

const CompetencyMasterDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const { state } = useTableReducer();
  const { selectedRecords } = state;
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.blog]);
  const [competencyMasterData, setCompetencyMasterData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const { isOffline } = useContext(CustomOfflineContext);
  const [resourceData, setResourceData] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const {
    state: { permissions, resources }
  }: any = useData();

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
      fetchPolicy();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get('/field?resource=Competency Type')
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
      } = await axiosInstance().get(`/competency-type/${id}`);
      setCompetencyMasterData(data);
      setCustomizedRoutes([{ ...routes.competencyType, title: resources?.competencyType?.titlePlural }, { title: data?.competencyType }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      if (permissions?.competencyType?.isDelete) {
        axiosInstance()
          .put(`/competency-type/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowDeleteConfirmBox(false);

            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data?.message
            });
            history.push(`${routes.competencyType.path}`);
          })
          .catch((err) => {
            setShowDeleteConfirmBox(false);
          });
      }
    } else {
      setShowDeleteConfirmBox(false);
    }
  };

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.competencyType}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
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
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.competencyType?.isUpdate && (
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                  {isMobile && !isTablet ? <Edit /> : 'Edit'}
                </Button>
              )}
              {permissions?.competencyType?.isDelete && <DeleteButton text="Delete" onClick={() => setShowDeleteConfirmBox(true)} />}
            </>
            <ActivityButton
              referenceId={competencyMasterData?._id}
              resource={ACTIVITY_RESOURCE.competencyType}
              resourceLabel={competencyMasterData?.competencyType}
            />
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0} label={'Details'} />
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 3}>{tab?.tabName}</CustomTab>)}
          {permissions?.competencies?.isRead && <CustomTab value={1} label={resources?.competencies?.titlePlural} />}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !fields?.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={competencyMasterData} fields={fields} />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Competencies competencyType={id} />
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
                  resource={sidebarResource.competencyType}
                  data={competencyMasterData}
                  allowedToEdit={permissions?.competencyType?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${selectedRecords?.length ? `${resources?.competencyType?.titleSingular?.toLowerCase()} :
            ${competencyMasterData.accountNumber}` : resources?.competencyType?.titlePlural?.toLowerCase()} ?`}
          onClose={() => {
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageCompetencyType
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

export default CompetencyMasterDetail;
