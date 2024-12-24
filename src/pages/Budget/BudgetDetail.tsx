import { Box, Button, Grid } from '@mui/material';
import { Edit } from '@mui/icons-material';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import { ACTIVITY_RESOURCE, sidebarResource } from '../../constants/helpers';
import ManageBudgetDialog from './ManageBudgetDialog';

const BudgetDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, resources }
  }: any = useData();

  const [customizedRoutes, setCustomizedRoutes] = useState<any>([{ ...routes.budget, title: resources?.budget?.titlePlural }]);
  const [budgetData, setBudgetData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.budget}`)
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
      } = await axiosInstance().get(`${routes?.budget?.path}/${id}`);
      setBudgetData(data);
      setCustomizedRoutes([{ ...routes.budget, title: resources?.budget?.titlePlural }, { title: data?.name }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.budget?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowDeleteConfirmBox(false);

          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.budget.path}`);
        })
        .catch((err) => {
          setShowDeleteConfirmBox(false);
        });
    } else {
      setShowDeleteConfirmBox(false);
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
              {permissions?.budget?.isUpdate && (
                <Button
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  size="small"
                  onClick={handleOpenUpdateDialog}
                  className={'btn-outline-v1'}
                >
                  {isMobile && !isTablet ? <Edit /> : 'Edit'}
                </Button>
              )}
              {permissions?.budget?.isDelete && <DeleteButton text="Delete" onClick={() => setShowDeleteConfirmBox(true)} />}
              <ActivityButton referenceId={budgetData?._id} resource={ACTIVITY_RESOURCE.budget} resourceLabel={budgetData?.name} />
            </>
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {loading || !fields?.length ? (
          <Grid container spacing={2} style={{ padding: '8px' }}>
            <CommonSkeleton lenArray={[...Array(7).keys()]} />
          </Grid>
        ) : (
          <DetailsPage data={budgetData} fields={fields} />
        )}
      </Box>
      {openUpdateDialog && (
        <ManageBudgetDialog
          open={openUpdateDialog}
          isClone={false}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
          budgetId={id}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${deleteRecord ? `${resources?.budget?.titleSingular?.toLowerCase()} : ${deleteRecord?.name}` : `selected ${resources?.budget?.titlePlural?.toLowerCase()}`} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </Box>
  );
};

export default BudgetDetail;
