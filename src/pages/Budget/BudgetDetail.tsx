import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
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
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.budget]);
  const [budgetData, setBudgetData] = useState(null);
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
      setCustomizedRoutes([routes.budget, { title: data?.name }]);
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
          setShowConfirmBox(false);

          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.budget.path}`);
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
              {permissions?.budget?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
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
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes?.budget?.title?.toLowerCase()} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </Box>
  );
};

export default BudgetDetail;
