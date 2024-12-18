import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import ManageInventoryCycle from './ManageInventoryCycle';
import { useTableReducer } from 'src/components/CustomReactTable';

const InventoryCycleDetailPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions, resources }
  }: any = useData();
  const { state } = useTableReducer();
  const { selectedRecords } = state;
  const [headingLbl, setHeadingLbl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([]);

  const [formsData, setFormsData] = useState([]);
  const [inventoryCycleData, setInventoryCycleData] = useState(null);

  useEffect(() => {
    if (id) {
      getInventoryCycleFields();
      fetchInventoryCycleData();
    }
  }, [id]);

  const getInventoryCycleFields = () => {
    axiosInstance()
      .get('/field?resource=Inventory Cycle')
      .then(({ data }) => {
        setFormsData(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchInventoryCycleData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/inventory-cycle/${id}`);
      setHeadingLbl(data.cycleCode);
      setInventoryCycleData(data);
      setCustomizedRoutes([{ ...routes?.inventoryCycle, title: resources?.inventoryCycle?.titlePlural }, { title: data.cycleCode }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDeleteInventoryCycle = () => {
    if (id) {
      axiosInstance()
        .put(`/inventory-cycle/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);
          history.push(`${routes.inventoryCycle.path}`);
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
            {inventoryCycleData ? (
              <>
                {permissions?.inventoryCycle?.isUpdate && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    className={'btn-outline-v1'}
                    size="small"
                    onClick={handleOpenUpdateDialog}
                  >
                    {isMobile ? <Edit /> : 'Edit'}
                  </Button>
                )}
                {permissions?.inventoryCycle?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={12} md={12} lg={12} spacing={2}>
            <Box>
              {loading || !formsData.length ? (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                  <CommonSkeleton lenArray={[...Array(7).keys()]} />
                </Grid>
              ) : (
                <DetailsPage data={inventoryCycleData} fields={formsData} />
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {openUpdateDialog && (
        <ManageInventoryCycle
          isUpdateDisabled={false}
          inventoryCycleId={id}
          isClone={false}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            fetchInventoryCycleData();
            closeUpdateDialog();
          }}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${selectedRecords?.length ? `${resources?.inventoryCycle?.titleSingular?.toLowerCase()} : ${headingLbl}` : `selected ${resources?.inventoryCycle?.titlePlural?.toLowerCase()}`} ?`}              
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDeleteInventoryCycle}
        />
      )}
    </Box>
  );
};

export default InventoryCycleDetailPage;
