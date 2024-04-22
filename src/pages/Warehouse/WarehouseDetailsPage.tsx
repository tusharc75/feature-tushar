import { Box, Button, Grid, Tab, Tabs } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { ACTIVITY_RESOURCE, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import ManageWarehouse from './ManageWarehouse';
import StorageLocation from './StorageLocation';
import Users from './Users';
import Step from '../DynamicForm/Step';

const WarehouseDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions, user }
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState('');
  const [loading, setLoading] = useState(false);
  const [warehouseData, setWarehouseData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [warehouseFields, setWarehouseFields] = useState([]);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.warehouse]);
  const [tabValue, setTabValue] = useState(0);
  const [resourceData, setResourceData] = useState(null);

  useEffect(() => {
    if (id) {
      getWarehouseFields();
      fetchWarehouseData();
      fetchPolicy();
    }
  }, [id]);

  const fetchWarehouseData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/warehouse/${id}`);
      setHeadingLbl(data.warehouseName);
      setWarehouseData(data);
      setCustomizedRoutes([routes.warehouse, { title: data.warehouseName }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getWarehouseFields = () => {
    axiosInstance()
      .get('/field?resource=Warehouse')
      .then(({ data }) => {
        setWarehouseFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.warehouse}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDeleteWarehouse = () => {
    if (id) {
      if (permissions?.warehouse?.isDelete) {
        axiosInstance()
          .put(`/warehouse/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);

            history.push(`${routes.warehouse.path}`);
          })
          .catch((err) => {
            setShowConfirmBox(false);
          });
      }
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
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {warehouseData ? (
              <>
                {permissions?.warehouse?.isUpdate && !warehouseData?.deleted && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    size="small"
                    className={'btn-outline-v1'}
                    onClick={handleOpenUpdateDialog}
                  >
                    {isMobile && !isTablet ? <Edit /> : 'Edit'}
                  </Button>
                )}
                {permissions?.warehouse?.isDelete && !warehouseData?.deleted && (
                  <span title={id ? "Primarily selected warehouse can't be deleted" : 'Permanently delete this warehouse'}>
                    <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                  </span>
                )}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton referenceId={warehouseData?._id} resource={ACTIVITY_RESOURCE.warehouse} resourceLabel={warehouseData?.warehouseName} />
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
          {permissions?.storageLocation?.isRead && user?.user?.brandPolicy?.storageLocation && (
            <Tab
              label={<div className="tab-font">{routes.storageLocation.title}</div>}
              value={1}
              aria-controls="a11y-tabpanel-1"
              id="a11y-tab-1"
              className={'tabLayout'}
            />
          )}
          {user?.user?.brandPolicy?.warehouseAccessByUser && (
            <Tab label={<div className="tab-font">Users</div>} value={2} aria-controls="a11y-tabpanel-2" id="a11y-tab-2" className={'tabLayout'} />
          )}
          {resourceData && resourceData?.steps?.length && (
            <Tab label={<div className="tab-font">Associations</div>} value={3} aria-controls="a11y-tabpanel-3" id="a11y-tab-3" className={'tabLayout'} />
          )}
        </Tabs>
        {tabValue === 0 && (
          <Box>
            {loading || !warehouseFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={warehouseData} fields={warehouseFields} />
            )}
          </Box>
        )}
        {tabValue === 1 && <StorageLocation warehouse={id} />}
        {tabValue === 2 && <Users warehouse={id} />}
        {tabValue === 3 && 
        <Step
        resourceData={resourceData}
        resourceId={id}
        resource={sidebarResource.warehouse}
        data={warehouseData}
        allowedToEdit={permissions?.warehouse?.isUpdate}
      />
        }
      </Box>
      {openUpdateDialog && (
        <ManageWarehouse
          open={openUpdateDialog}
          close={closeUpdateDialog}
          warehouseId={id}
          isClone={false}
          onSuccess={() => {
            fetchWarehouseData();
            closeUpdateDialog();
          }}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes.warehouse.title.toLowerCase()} ${headingLbl}?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDeleteWarehouse}
        />
      )}
    </Box>
  );
};

export default WarehouseDetailsPage;
