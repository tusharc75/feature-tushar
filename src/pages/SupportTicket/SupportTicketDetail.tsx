import { Box, Button, Grid } from '@mui/material';
import { Edit } from '@mui/icons-material';
import queryString from 'query-string';
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
import { SUPPORT_TICKET_STATUS, checkIsAllowedToDelete, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import Comments from './Comments';
import ManageSupportTicket from './ManageSupportTicket';

const SupportTicketDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const toastConfig = useContext(CustomToastContext);
  const [supportTicketData, setSupportTicketData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const {
    state: { user, resources }
  }: any = useData();

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get(`${routes.supportTicket.path}/fields?brand=${user?.user?.brand}`)
      .then(({ data: { data } }) => {
        setFields(data?.filter((field) => field.isRead && field?.fieldData?.sectionName !== 'Internal Information'));
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
      const isAllowedToEdit =
        [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id) &&
        data?.status !== SUPPORT_TICKET_STATUS.completed;
      setAllowedToEdit(isAllowedToEdit);
      setAllowedToDelete(
        checkIsAllowedToDelete(user, sidebarResource.supportTicket, data.owner.optionValue) && data?.status !== SUPPORT_TICKET_STATUS.completed
      );
      setSupportTicketData(data);
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
          history.push(`${routes.supportTicket.path}`);
        })
        .catch((err) => {
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
    if (newValue === 0) {
      fetchData();
    }
  };

  const handleReopenStatus = () => {
    axiosInstance()
      .put(`${routes.supportTicket.path}/update-status`, {
        ticket: [
          {
            _id: supportTicketData._id,
            currentStatus: supportTicketData?.status
          }
        ],
        status: SUPPORT_TICKET_STATUS.inProgress,
        resolution: ''
      })
      .then(({ data: { data } }) => {
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status changed to ${SUPPORT_TICKET_STATUS.inProgress}`
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
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
          <CustomBreadCrumbs
            routes={[{ ...routes.supportTicket, title: resources?.supportTicket?.titlePlural }, { title: supportTicketData?.supportTicketNumber }]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {supportTicketData?.status === SUPPORT_TICKET_STATUS.completed && (
              <Button disabled={loading} variant={'outlined'} color="default" size="small" className="btn-outline-v1" onClick={handleReopenStatus}>
                {'Re-Open'}
              </Button>
            )}
            {allowedToEdit && (
              <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className={'btn-outline-v1'} onClick={handleOpenUpdateDialog}>
                {isMobile && !isTablet ? <Edit /> : 'Edit'}
              </Button>
            )}
            {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
          </Box>
        </Box>
      </Box>
      <Box className={'detail-container-v1'}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Details</CustomTab>
          <CustomTab value={1}>Activity</CustomTab>
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !fields?.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <>
                <DetailsPage data={supportTicketData} fields={fields} />
              </>
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {supportTicketData && <Comments uniqueId={id} />}
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.supportTicket?.titleSingular?.toLowerCase()} : ${supportTicketData?.supportTicketNumber} ?`}
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
