import { Box, Button, Grid, Menu, MenuItem, Paper, Typography } from '@material-ui/core';
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
import ManageCompetencyMaster from './ManageCompetencyMaster';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { ACTIVITY_RESOURCE } from 'src/constants/helpers';

const CompetencyMasterDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.blog]);
  const [competencyMasterData, setCompetencyMasterData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const {
    state: { permissions }
  }: any = useData();

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get('/field?resource=Competency Master')
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
      } = await axiosInstance().get(`/competency-master/${id}`);
      setCompetencyMasterData(data);
      setCustomizedRoutes([routes.competencyMaster, { title: data?.competencyType }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      if (permissions?.competencyMaster?.isDelete) {
        axiosInstance()
          .put(`/competency-master/remove`, { ids: [id] })
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
          <Box className="control-buttons-v1">
            <>
              {permissions?.competencyMaster?.isUpdate && (
                <Button
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  className="btn-outline-v1"
                  onClick={handleOpenUpdateDialog}
                  style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                >
                  {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                </Button>
              )}
              {permissions?.competencyMaster?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            </>
            <ActivityButton referenceId={competencyMasterData?._id} resource={ACTIVITY_RESOURCE.competencyMaster} />
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <Grid container spacing={1}>
          <Grid item xs={12} sm={12} md={8}>
            <Paper>
              <Box>
                {loading || !fields?.length ? (
                  <Grid container spacing={2} style={{ padding: '8px' }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <DetailsPage data={competencyMasterData} fields={fields} />
                )}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Paper style={{ overflow: 'hidden' }}>
              <Box padding={1} bgcolor="grey.200" display="flex" justifyContent="space-between" alignItems="center">
                <Box display={'flex'}>
                  <Box>
                    <Typography variant="subtitle2">Competency</Typography>
                  </Box>
                </Box>
              </Box>
              {competencyMasterData?.competency?.length ? (
                <Box p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
                  <Grid container>
                    <Grid item xs={2}>
                      <Typography variant="body1">Index</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body1">Name</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1">Description</Typography>
                    </Grid>
                  </Grid>
                </Box>
              ) : null}
              {competencyMasterData?.competency?.length ? (
                competencyMasterData?.competency?.map((steps, index) => (
                  <Box key={index} bgcolor="white" p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
                    <Grid container>
                      <Grid item xs={2}>
                        <Typography variant="body2">{index + 1}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2">{steps?.name || ''}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">{steps?.description || 0}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))
              ) : (
                <Box bgcolor="white" p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
                  <Grid container>
                    <Grid item xs={6} justifyContent={'center'}>
                      <Typography variant="body2">No Data Found</Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes?.competencyMaster?.title?.toLowerCase()} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageCompetencyMaster
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

export default CompetencyMasterDetail;
