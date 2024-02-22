import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import ManageAccountsReceivable from './ManageAccountsReceivable';

const AccountsReceivableDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.accountsReceivable?.title);
  const {
    state: { permissions, user }
  }: any = useData();

  const [accountReceivableData, setAccountReceivableData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    try {
      let data;
      const response = await axiosInstance().get(`/field?resource=${sidebarResource?.accountsReceivable}`);
      data = response?.data?.data;
      setFields(data?.filter((field) => field.isRead));
    } catch (err) {
      toastConfig.setToastConfig(err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let data;
      const response = await axiosInstance().get(`${routes.accountsReceivable.path}/${id}`);
      data = response?.data?.data;
      setAccountReceivableData(data);
      let isAllowedToEdit = false;
      if (user?.role?.selectedEntity?.superAdminAccess) {
        isAllowedToEdit = true;
      }
      setAllowedToEdit(permissions?.accountsReceivable?.isUpdate && isAllowedToEdit);
      setAllowedToDelete(permissions?.accountsReceivable?.isDelete && data?.canDelete);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.accountsReceivable?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.accountsReceivable.path}`);
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

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.accountsReceivable, { title: accountReceivableData?.arNumber }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {allowedToEdit && (
              <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                {isMobile && !isTablet ? <Edit /> : 'Edit'}
              </Button>
            )}
            {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        {loading || !fields?.length ? (
          <Grid container spacing={2} style={{ padding: '8px' }}>
            <CommonSkeleton lenArray={[...Array(7).keys()]} />
          </Grid>
        ) : (
          <DetailsPage data={accountReceivableData} fields={fields} />
        )}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes?.accountsReceivable?.title?.toLowerCase()} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageAccountsReceivable
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

export default AccountsReceivableDetail;
