import { Box, Button, Grid, } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { isMobile, isTablet } from 'react-device-detect';
import { BiEdit } from 'react-icons/bi';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import { useData } from 'src/StateProvider/Provider';
import { useParams, useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ManagePadMaster from './ManagePadMaster';
import { sidebarResource } from 'src/constants/helpers';

const PadMasterDetail = () => {
    const { id } = useParams();
    const history = useHistory();
    const toastConfig = useContext(CustomToastContext);
    const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.padMaster]);
    const [padMasterData, setPadMasterData] = useState(null);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [fields, setFields] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showConfirmBox, setShowConfirmBox] = useState(false);
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
          .get(`/field?resource=${sidebarResource.padMaster}`)
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
          } = await axiosInstance().get(`${routes.padMaster.path}/${id}`);
          setPadMasterData(data);
          setCustomizedRoutes([routes.padMaster, { title: data?.padName }]);
          setLoading(false);
        } catch (error) {
          toastConfig.setToastConfig(error);
        }
      };
    
      const handleDelete = () => {
        if (id) {
          axiosInstance()
            .put(`${routes?.padMaster?.path}/remove`, { ids: [id] })
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
  
  return (
    <Box className="main-container-v1">
    <Box className="headerbox-v1">
      <Box className="nav-v1">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </Box>
      <Box className="controls-v1">
        <Box className="control-buttons-v1">
          <>
            {permissions?.padMaster?.isUpdate  && (
              <Button
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                className="btn-outline-v1"
                onClick={handleOpenUpdateDialog}
              >
                {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
              </Button>
            )}
            {permissions?.padMaster?.isDelete  && (
              <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
            )}
          </>
        </Box>
      </Box>
    </Box>
    <Box className="detail-container-v1">
    <Box>
          {loading || !fields?.length ? (
            <Grid container spacing={2} style={{ padding: '8px' }}>
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            </Grid>
          ) : (
            <DetailsPage data={padMasterData} fields={fields} />
          )}
        </Box>
    </Box>
    {showConfirmBox && (
      <ConfirmationDialog
        open={showConfirmBox}
        message={`Are you sure you want to delete ${routes?.padMaster?.title?.toLowerCase()} ${padMasterData.padName} ?`}
        onClose={() => {
          setShowConfirmBox(false);
        }}
        onOk={handleDelete}
      />
    )}
    {openUpdateDialog && (
      <ManagePadMaster
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
  )
}

export default PadMasterDetail