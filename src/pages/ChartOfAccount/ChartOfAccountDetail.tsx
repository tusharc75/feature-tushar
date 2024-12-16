import { Box, Button, Grid } from '@material-ui/core';
import Step from '../DynamicForm/Step';
import { Edit } from '@material-ui/icons';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import ManageChartOfAccount from './ManageChartOfAccount';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { useTableReducer } from 'src/components/CustomReactTable';

const ChartOfAccountDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const { state } = useTableReducer();
  const toastConfig = useContext(CustomToastContext);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.chartOfAccount]);
  const [chartOfAccountData, setChartOfAccountData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const { selectedRecords } = state;
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const { isOffline } = useContext(CustomOfflineContext);
  const [resourceData, setResourceData] = useState(null);
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
      .get(`/field?resource=${sidebarResource?.chartOfAccount}`)
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
      } = await axiosInstance().get(`${routes.chartOfAccount.path}/${id}`);
      setChartOfAccountData(data);
      setCustomizedRoutes([{ ...routes.chartOfAccount, title: resources?.chartOfAccount?.titlePlural }, { title: data?.accountNumber }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      if (permissions?.chartOfAccount?.isDelete) {
        axiosInstance()
          .put(`${routes.chartOfAccount.path}/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowDeleteConfirmBox(false);
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data?.message
            });
            history.push(`${routes.chartOfAccount.path}`);
          })
          .catch((err) => {
            setShowDeleteConfirmBox(false);
          });
      }
    } else {
      setShowDeleteConfirmBox(false);
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

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.chartOfAccount}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
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
              {permissions?.chartOfAccount?.isUpdate && (
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                  {isMobile && !isTablet ? <Edit /> : 'Edit'}
                </Button>
              )}
              {permissions?.chartOfAccount?.isDelete && <DeleteButton text="Delete" onClick={() => setShowDeleteConfirmBox(true)} />}
            </>
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0} label={'Details'} />
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 3}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel index={tabValue} value={0}>
          <Box>
            {loading || !fields?.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={chartOfAccountData} fields={fields} />
            )}
          </Box>
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
                  resource={sidebarResource.chartOfAccount}
                  data={chartOfAccountData}
                  allowedToEdit={permissions?.chartOfAccount?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${selectedRecords?.length ? `${resources?.chartOfAccount?.titleSingular?.toLowerCase()} :
             ${chartOfAccountData.accountNumber}` : resources?.chartOfAccount?.titlePlural?.toLowerCase()} ?`}
          onClose={() => {
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageChartOfAccount
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

export default ChartOfAccountDetail;
