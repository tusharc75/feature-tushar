import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ManageWarehouse from './ManageWarehouse';
import DeleteButton from '../../components/Helpers/DeleteButton';
import { BiEdit } from 'react-icons/bi';
import { isMobile, isTablet } from 'react-device-detect';
import { MdDelete } from 'react-icons/md';

const WarehouseDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState('');
  const [loading, setLoading] = useState(false);
  const [warehouseData, setWarehouseData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [warehouseFields, setWarehouseFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [addressResource, setAddressResource] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.warehouse]);

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

      handleMainPoints(data);
      setHeadingLbl(data.warehouseName);
      setWarehouseData(data);
      setAddressResource({ id: data._id });

      setCustomizedRoutes([routes.warehouse, { title: data.warehouseName }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      name: `${data.warehouseName}`,
      taxJurisdiction: data.taxJurisdiction || ''
    };
    setMainPoints(tempMp);
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
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {warehouseData && <DetailsPageHeader heading={headingLbl} mainPoints={mainPoints} showHeading={true} />}
        <Box>
          {loading || !warehouseFields.length ? (
            <Grid container spacing={2} style={{ padding: '8px' }}>
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            </Grid>
          ) : (
            <DetailsPage data={warehouseData} fields={warehouseFields} />
          )}
        </Box>
      </Box>
      {openUpdateDialog && (
        <ManageWarehouse
          open={openUpdateDialog}
          close={closeUpdateDialog}
          fetchData={() => {
            fetchWarehouseData();
          }}
          addressResource={addressResource}
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
