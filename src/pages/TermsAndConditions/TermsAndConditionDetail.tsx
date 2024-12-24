import { Box, Button, Grid } from '@mui/material';
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
import { checkIsAllowedToDelete, checkIsAllowedToEdit, sidebarResource, termsAndCondition } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import ManageTermsAndCondition from './ManageTermsAndCondition';

const TermsAndConditionDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [termsAndConditionData, setTermsAndConditionData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const {
    state: { permissions, user, resources }
  }: any = useData();
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([
    { ...routes.termsAndConditions, title: resources?.termsAndConditions?.titlePlural }
  ]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.termsAndConditions}`)
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
      } = await axiosInstance().get(`${termsAndCondition.api}/${id}`);

      setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.termsAndConditions, data));
      setAllowedToDelete(
        permissions?.termsAndConditions?.isDelete && checkIsAllowedToDelete(user, sidebarResource.termsAndConditions, data.owner.optionValue)
      );

      setTermsAndConditionData(data);
      setCustomizedRoutes([{ ...routes.termsAndConditions, title: resources?.termsAndConditions?.titlePlural }, { title: data?.name }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${termsAndCondition.api}/remove`, { ids: [id] })
      .then(({ data }) => {
        setShowConfirmBox(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        history.push(routes.termsAndConditions.path);
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
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.termsAndConditions?.isUpdate && allowedToEdit && (
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                  {isMobile && !isTablet ? <Edit /> : 'Edit'}
                </Button>
              )}
              {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
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
            <DetailsPage data={termsAndConditionData} fields={fields} />
          )}
        </Box>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.termsAndConditions?.titleSingular?.toLowerCase()} : ${termsAndConditionData.name} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageTermsAndCondition
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

export default TermsAndConditionDetail;
