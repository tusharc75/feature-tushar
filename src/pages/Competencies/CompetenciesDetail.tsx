import { Box, Button, Grid } from '@material-ui/core';
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
import ManageCompetencies from './ManageCompetencies';
import { useTableReducer } from 'src/components/CustomReactTable';

const CompetenciesDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const { state } = useTableReducer();
  const { selectedRecords } = state;
  const [competenciesData, setCompetenciesData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const {
    state: { permissions, resources }
  }: any = useData();
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([{ ...routes.competencies, title: resources?.competencies?.titlePlural }]);
  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get('/field?resource=Competencies')
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
      } = await axiosInstance().get(`${routes.competencies.path}/${id}`);
      setCompetenciesData(data);
      setCustomizedRoutes([{ ...routes.competencies, title: resources?.competencies?.titlePlural }, { title: data?.competencyName }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.competencies?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowDeleteConfirmBox(false);

          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.competencies.path}`);
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
              {permissions?.competencies?.isUpdate && (
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                  {isMobile && !isTablet ? <Edit /> : 'Edit'}
                </Button>
              )}
              {permissions?.competencies?.isDelete && <DeleteButton text="Delete" onClick={() => setShowDeleteConfirmBox(true)} />}
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
            <DetailsPage data={competenciesData} fields={fields} />
          )}
        </Box>
      </Box>
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${selectedRecords?.length ? `${resources?.competencies?.titleSingular?.toLowerCase()} :
            ${competenciesData.competencyName}` : resources?.competencies?.titlePlural?.toLowerCase()} ?`}
          onClose={() => {
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageCompetencies
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

export default CompetenciesDetail;
