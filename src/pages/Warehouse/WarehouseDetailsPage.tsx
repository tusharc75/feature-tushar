import { useState, useEffect, useContext } from 'react';
import { Grid, Box, Button, Tabs, Tab } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ManageWarehouse from './ManageWarehouse';
import DeleteButton from '../../components/Helpers/DeleteButton';
import { BiEdit } from 'react-icons/bi';
import { isMobile, isTablet } from 'react-device-detect';
import { ACTIVITY_RESOURCE, warehouse } from 'src/constants/helpers';
import ActivityButton from 'src/components/Activity/ActivityButton';
import StorageLocation from './StorageLocation';
import Users from './Users';

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

  useEffect(() => {
    if (id) {
      getWarehouseFields();
      fetchWarehouseData();
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

  const handleDeleteWarehouse = () => {
    if (id) {
      if (permissions?.warehouse?.isDelete) {
        axiosInstance()
          .put(`/warehouse/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);

            history.goBack();
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
                {permissions?.warehouse?.isUpdate && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    size="small"
                    className={'btn-outline-v1'}
                    onClick={handleOpenUpdateDialog}
                  >
                    {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
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
            <ActivityButton 
              referenceId={warehouseData?._id} 
              resource={ACTIVITY_RESOURCE.warehouse} 
              resourceLabel={warehouseData?.warehouseName}
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
          {(permissions?.storageLocation?.isRead && user?.user?.brandPolicy?.storageLocation) && (
            <Tab
              label={<div className="tab-font">{routes.storageLocation.title}</div>}
              value={1}
              aria-controls="a11y-tabpanel-1"
              id="a11y-tab-1"
              className={'tabLayout'}
            />
          )}
          {user?.user?.brandPolicy?.warehouseAccessByUser &&
            <Tab
              label={<div className="tab-font">Users</div>}
              value={2}
              aria-controls="a11y-tabpanel-2"
              id="a11y-tab-2" className={'tabLayout'} />
          }
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
