import { Box, Button, Grid, Paper } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import ManageContactUs from './ManageContactUs';

const BlogDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.contactUs]);
  const [contactUsData, setContactUsData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const {
    state: { permissions, resources }
  }: any = useData();

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get('/field?resource=Contact Us')
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
      } = await axiosInstance().get(`/contact-us/${id}`);
      setContactUsData(data);
      setCustomizedRoutes([{ ...routes.contactUs, title: resources?.contactUs?.titlePlural }, { title: data?.name }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      if (permissions?.blog?.isDelete) {
        axiosInstance()
          .put(`/contact-us/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);

            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data?.message
            });
            history.push(`${routes.contactUs.path}`);
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
          <Box className="controls-buttons-v1">
            <>
              <Button
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                className="btn-outline-v1"
                onClick={handleOpenUpdateDialog}
                style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
              >
                {isMobile && !isTablet ? <Edit /> : 'Edit'}
              </Button>

              <Box component="span" marginX={1} />

              <span title={id ? "Primarily selected  can't be deleted" : 'Permanently delete'}>
                <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
              </span>
            </>
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Paper>
          <Box>
            {loading || !fields?.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={contactUsData} fields={fields} />
            )}
          </Box>
        </Paper>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.contactUs?.titleSingular?.toLowerCase()} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageContactUs
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

export default BlogDetail;
