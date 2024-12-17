import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import Alerts from './Alerts';
import IotDataPoints from './IotDataPoints';
import ManageDeviceTemplates from './ManageDeviceTemplates';
import Rules from './Rules';

export default function DeviceTemplatesDetails() {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions, resources }
  }: any = useData();

  const [customizedRoutes, setCustomizedRoutes] = useState<any>([{ ...routes.deviceTemplates, title: resources?.deviceTemplates?.titlePlural }]);
  const [loading, setLoading] = useState(false);
  const [deviceTemplatesData, setDeviceTemplatesData] = useState(null);
  const [fields, setFields] = useState([]);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.deviceTemplates.path}/${id}`);
      setDeviceTemplatesData(data);
      setCustomizedRoutes([{ ...routes.deviceTemplates, title: resources?.deviceTemplates?.titlePlural }, { title: data.templateName }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchFields = () => {
    axiosInstance()
      .get('/field?resource=Device Templates')
      .then(({ data }) => {
        setFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDelete = () => {
    if (id) {
      if (permissions?.deviceTemplates?.isDelete) {
        axiosInstance()
          .put(`${routes.deviceTemplates.path}/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);
            history.push(`${routes.deviceTemplates.path}`);
          })
          .catch((err) => {
            setShowConfirmBox(false);
          });
      }
    } else {
      setShowConfirmBox(false);
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
            {deviceTemplatesData ? (
              <>
                {permissions?.deviceTemplates?.isUpdate && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    size="small"
                    className={'btn-outline-v1'}
                    onClick={() => {
                      setOpenUpdateDialog(true);
                    }}
                  >
                    {isMobile && !isTablet ? <Edit /> : 'Edit'}
                  </Button>
                )}
                {permissions?.warehouse?.isDelete && (
                  <span title={id ? "Primarily selected warehouse can't be deleted" : 'Permanently delete this warehouse'}>
                    <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                  </span>
                )}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0} label={'Details'} />
          <CustomTab value={1} label={resources?.iotDataPoints?.titlePlural} />
          <CustomTab value={2} label={'Rules'} />
          <CustomTab value={3} label={'Alerts'} />
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !fields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={deviceTemplatesData} fields={fields} />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <IotDataPoints deviceTemplate={id} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Rules deviceTemplate={id} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <Alerts deviceTemplate={id} />
        </TabPanel>
      </Box>
      {openUpdateDialog && (
        <ManageDeviceTemplates
          open={openUpdateDialog}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          deviceTemplatesId={id}
          isClone={false}
          onSuccess={() => {
            fetchData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.deviceTemplates?.titleSingular.toLowerCase()} ${deviceTemplatesData?.templateName}?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </Box>
  );
}
