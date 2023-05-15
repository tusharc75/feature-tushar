import { Box, Button, Grid } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Skeleton } from '@material-ui/lab';
import { isMobile, isTablet } from 'react-device-detect';
import { BiEdit } from 'react-icons/bi';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import { useData } from 'src/StateProvider/Provider';
import { useParams, useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ManageSupportTicket from './ManageSupportTicket';

const SupportTicketDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.supportTicket]);
  const [supportTicketData, setSupportTicketData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const {
    state: { permissions, user }
  }: any = useData();

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get('/field?resource=Support Ticket')
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
      } = await axiosInstance().get(`/support-ticket/${id}`);
      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      setAllowedToEdit(isAllowedToEdit);
      setAllowedToDelete(data?.owner?.optionValue === user?.user?._id);
      setSupportTicketData(data);
      setCustomizedRoutes([routes.supportTicket, { title: data?.supportTicketNumber }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`/support-ticket/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);

          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.goBack();
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

  return (<Box className="main-container-v1">
    <Box className="headerbox-v1">
      <Box className="nav-v1">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </Box>
      <Box className="controls-v1">
        <Box className="control-buttons-v1">
          {permissions?.supportTicket?.isUpdate && allowedToEdit && (
            <Button
              variant={isMobile && !isTablet ? 'text' : 'contained'}
              className={'btn-outline-v1'}
              onClick={handleOpenUpdateDialog}
            >
              {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
            </Button>
          )}
          {permissions?.supportTicket?.isDelete && allowedToDelete &&
            <DeleteButton
              text="Delete" onClick={() => setShowConfirmBox(true)} />}
        </Box>
      </Box>
    </Box>
    <Box className={'detail-container-v1'}>
      <Box>
        {loading || !fields?.length ? (
          <Grid container spacing={2} style={{ padding: '8px' }}>
            <CommonSkeleton lenArray={[...Array(7).keys()]} />
          </Grid>
        ) : (
          <DetailsPage data={supportTicketData} fields={fields} />
        )}
      </Box>
    </Box>
    {showConfirmBox && (
      <ConfirmationDialog
        open={showConfirmBox}
        message={`Are you sure you want to delete ${routes?.supportTicket?.title?.toLowerCase()} ?`}
        onClose={() => {
          setShowConfirmBox(false);
        }}
        onOk={handleDelete}
      />
    )}
    {openUpdateDialog && (
      <ManageSupportTicket
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

export default SupportTicketDetail;
