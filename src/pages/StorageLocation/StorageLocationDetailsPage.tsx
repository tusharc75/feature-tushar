import { useState, useEffect, useContext } from 'react';
import { Grid, Box, Button, Typography } from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { storageLocation } from '../../constants/helpers';
import ManageStorageLocation from './ManageStorageLocation';
import { BiEdit } from 'react-icons/bi';
import { isMobile, isTablet } from 'react-device-detect';
import DeleteButton from '../../components/Helpers/DeleteButton';

const StorageLocationDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();

  const [storageLocationData, setStorageLocationData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    fetchFields();
    fetchData();
  }, [id]);

  const fetchFields = () => {
    axiosInstance()
      .get(`/field?resource=${storageLocation.resource}`)
      .then(({ data }) => {
        setFields(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    axiosInstance()
      .get(`${storageLocation.api}/${id}`)
      .then(({ data: { data } }) => {
        setStorageLocationData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${storageLocation.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.storageLocation, { title: storageLocationData?.storageLocationName }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.storageLocation?.isUpdate && (
              <Button
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                onClick={() => {
                  setOpenUpdateDialog(true);
                }}
                className={'btn-outline-v1'}
              >
                {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
              </Button>
            )}
            {permissions?.storageLocation?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
          </Box>
        </Box>
      </Box>
      <Box className='detail-container-v1'>
        <Box>
          {storageLocationData && fields.length ? (
            <DetailsPage data={storageLocationData} fields={fields} />
          ) : (
            <Grid container spacing={2} style={{ padding: '8px' }}>
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            </Grid>
          )}
        </Box>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.storageLocation?.title} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageStorageLocation
          isClone={false}
          storageLocationId={id}
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

export default StorageLocationDetailsPage;
