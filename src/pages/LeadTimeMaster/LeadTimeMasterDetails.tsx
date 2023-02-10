import { useState, useEffect, useContext } from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs, useMediaQuery, Typography, IconButton } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import DetailsPageHeader from 'src/components/DetailsPageHeader';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { useData } from 'src/StateProvider/Provider';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { sidebarResource, serializedAsset, leadTimeMaster } from 'src/constants/helpers';
import ManageLeadTimeMaster from './ManageLeadTimeMaster';
import queryString from 'query-string';
import { BiEdit } from 'react-icons/bi';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import { camelCase } from 'lodash';
import { isMobile, isTablet } from 'react-device-detect';
import accountClass from '../Account/account.module.scss';

const LeadTimeMasterDetails = () => {
  const renderedFrom = camelCase(routes?.leadTimeMasterDetail.title);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();

  const parsed = queryString.parse(history.location.search);
  const { openEdit, tab }: any = parsed;
  const {
    state: { user, permissions }
  }: any = useData();

  const [leadTimeMasterData, setLeadTimeMasterData] = useState(null);

  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [lTMFields, setLTMFields] = useState([]);

  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [locationKeys, setLocationKeys] = useState([]);

  useEffect(() => {
    return history.listen((location) => {
      const { tab }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key]);
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys);
          // Handle forward event
          setTabValue(tab ? parseInt(tab) : 1);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setTabValue(tab ? parseInt(tab) : 1);
        }
      }
    });
  }, [locationKeys]);

  useEffect(() => {
    if (id) {
      fetchLeadTimeMasterData();
    }
  }, [id]);

  useEffect(() => {
    getResourceFields();
    fetchAssetStatusRights();
  }, []);

  const getResourceFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.leadTimeMaster}`)
      .then(({ data: { data } }) => {
        setLTMFields(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchAssetStatusRights = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}&view=true`)
      .then(({ data }) => {
        if (data.data && data.data.length) {
          data.data.some((o) => {
            if (o?.fieldData?.fieldName === 'status') {
              return true;
            }
          });
        }
      })
      .catch((err) => {});
  };

  const fetchLeadTimeMasterData = () => {
    axiosInstance()
      .get(`${leadTimeMaster.api}/${id}`)
      .then(({ data: { data } }) => {
        setLeadTimeMasterData({ ...data });
        const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
        if (permissions?.leadTimeMaster?.isUpdate && openEdit === 'true') {
          setOpenUpdateDialog(true);
          const params = new URLSearchParams();
          params.delete('openEdit');
          history.push({ search: params.toString() });
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${leadTimeMaster.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.leadTimeMaster, { title: leadTimeMasterData?.leadTimeName }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
              <>
                {permissions?.leadTimeMaster?.isUpdate && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    className={'btn-outline-v1'}
                    size="small"
                    onClick={handleOpenUpdateDialog}
                  >
                    {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                  </Button>
                )}
                {permissions?.leadTimeMaster?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </>
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={12} md={8}>
            <div>
              <Paper style={{ height: '80vh' }}>
                {leadTimeMasterData ? (
                  <DetailsPageHeader heading={leadTimeMasterData?.leadTimeName} mainPoints={null} showHeading={true}>
                    {permissions?.leadTimeMaster?.isUpdate && (
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        color="primary"
                        size="small"
                        onClick={handleOpenUpdateDialog}
                        className={isMobile && !isTablet ? accountClass.mobile_button_layout : ''}
                        style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                      >
                        {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                      </Button>
                    )}
                    {permissions?.leadTimeMaster?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
                  </DetailsPageHeader>
                ) : (
                  <Skeleton variant="text" width="150px" height="40px" />
                )}
                <Box>
                  {' '}
                  {leadTimeMasterData && lTMFields.length ? (
                    <DetailsPage data={leadTimeMasterData} fields={lTMFields} />
                  ) : (
                    <Grid container spacing={2} style={{ padding: '8px' }}>
                      <CommonSkeleton lenArray={[...Array(7).keys()]} />
                    </Grid>
                  )}
                </Box>
              </Paper>
            </div>
            <Box my={1} />
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Paper style={{ overflow: 'hidden' }}>
              <Box padding={1} bgcolor="grey.200" display="flex" justifyContent="space-between" alignItems="center">
                <Box display={'flex'}>
                  <Box>
                    <Typography variant="subtitle2">Lead Time</Typography>
                  </Box>
                </Box>
              </Box>
              {leadTimeMasterData?.steps?.length ? (
                <Box p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
                  <Grid container>
                    <Grid item xs={2}>
                      <Typography variant="body1">#</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body1">Status</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body1">Days</Typography>
                    </Grid>
                  </Grid>
                </Box>
              ) : null}
              {leadTimeMasterData?.steps?.length ? (
                leadTimeMasterData?.steps?.map((steps, index) => (
                  <Box key={index} bgcolor="white" p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
                    <Grid container>
                      <Grid item xs={2}>
                        <Typography variant="body2">{index + 1}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">{steps?.leadTimeStatus || ''}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2">{steps?.days || 0}</Typography>
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
              {leadTimeMasterData?.steps?.length ? (
                <Box p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
                  <Grid container>
                    <Grid item xs={2}>
                      <Typography variant="body2"></Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                        Total
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2">{leadTimeMasterData?.leadTimeDays || 0}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              ) : null}
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this  ${leadTimeMasterData?.leadTimeName} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageLeadTimeMaster
          isClone={false}
          leadTimeMasterId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchLeadTimeMasterData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </Box>
  );
};

export default LeadTimeMasterDetails;
