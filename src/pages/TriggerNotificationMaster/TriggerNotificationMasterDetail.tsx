import { Box, Button, Grid } from '@material-ui/core';
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
import ManageTriggerNotificationMaster from './ManageTriggerNotificationMaster';

const TriggerNotificationMasterDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, resources }
  }: any = useData();

  const [triggerNotificationMasterData, setTriggerNotificationMasterData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.triggerNotificationMaster}`)
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
      } = await axiosInstance().get(`${routes.triggerNotificationMaster.path}/${id}`);
      setTriggerNotificationMasterData(data);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.triggerNotificationMaster?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);

          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.triggerNotificationMaster.path}`);
        })
        .catch((err) => {
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
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
          <CustomBreadCrumbs routes={[{ ...routes.triggerNotificationMaster, title: resources?.triggerNotificationMaster?.titlePlural }, { title: triggerNotificationMasterData?.resource }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.triggerNotificationMaster?.isUpdate && (
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                  {isMobile && !isTablet ? <Edit /> : 'Edit'}
                </Button>
              )}
              {permissions?.triggerNotificationMaster?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            </>
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>
            Header
          </CustomTab>
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !fields?.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={triggerNotificationMasterData} fields={fields} />
            )}
          </Box>
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.triggerNotificationMaster?.titleSingular?.toLowerCase()} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}

      {openUpdateDialog && (
        <ManageTriggerNotificationMaster
          isClone={false}
          id={id}
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

export default TriggerNotificationMasterDetail;
