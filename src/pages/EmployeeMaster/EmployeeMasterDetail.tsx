import { Box, Button, Dialog, Grid } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ActivityButton from 'src/components/Activity/ActivityButton';
import AssignEntityDialog from 'src/components/AssignRolesDialog/AssignEntityDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import { ACTIVITY_RESOURCE, CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import History from './History';
import ManageEmployeeMaster from './ManageEmployeeMaster';
import Step from '../DynamicForm/Step';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';

const EmployeeMasterDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [employeeMasterData, setEmployeeMasterData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [showAssignEntityDialog, setShowAssignEntityDialog] = useState(false);
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [roleAccessOfLoggedInUser, setRoleAccessOfLoggedInUser] = useState([]);
  const { isOffline } = useContext(CustomOfflineContext);
  const [resourceData, setResourceData] = useState(null);

  const {
    state: { permissions, user, resources }
  }: any = useData();

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
      fetchLoggedInUserRole();
      fetchPolicy();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.employeeMaster}`)
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
      } = await axiosInstance().get(`${routes?.employeeMaster?.path}/${id}`);
      setEmployeeMasterData(data);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.employeeMaster}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.employeeMaster?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);

          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.employeeMaster.path}`);
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

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
    if (newValue === 0) {
      fetchData();
    }
  };

  const fetchLoggedInUserRole = async () => {
    let roleIds = [];
    await axiosInstance()
      .get(`/user/${user.user?._id}`)
      .then(({ data: { data } }) => {
        data.entities.map((item) => {
          item.role.forEach((role) => {
            if (roleIds.includes(role?._id)) {
            } else {
              roleIds.push(role?._id);
            }
          });
        });
        setRoleAccessOfLoggedInUser(roleIds);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs
            routes={[{ ...routes.employeeMaster, title: resources?.employeeMaster?.titlePlural }, { title: employeeMasterData?.employeeNumber }]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {employeeMasterData?.userId ? (
                <Button
                  variant={'outlined'}
                  size="small"
                  onClick={() => {
                    window.open(`${routes.userDetail.path}/${employeeMasterData?.userId}`);
                  }}
                  className={'btn-outline-v1'}
                >
                  View User
                </Button>
              ) : (
                permissions?.employeeMaster?.isUpdate && (
                  <HtmlTooltip title="Give Portal Access" arrow placement="top">
                    <Button
                      size="small"
                      variant={'outlined'}
                      disabled={false}
                      onClick={() => {
                        setShowAssignEntityDialog(true);
                      }}
                      className={'btn-outline-v1'}
                    >
                      Give Portal Access
                    </Button>
                  </HtmlTooltip>
                )
              )}
              {permissions?.employeeMaster?.isUpdate && (
                <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpenUpdateDialog} tooltip={'Edit'}>
                  {'Edit'}
                </ThemeButton>
              )}
              {permissions?.employeeMaster?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            </>
            <ActivityButton
              referenceId={employeeMasterData?._id}
              resource={ACTIVITY_RESOURCE.employeeMaster}
              resourceLabel={employeeMasterData?.employeeNumber}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0} label={'Details'} />
          <CustomTab value={1} label={'History'} />
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 3}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          {loading || !fields?.length ? (
            <Grid container spacing={2} style={{ padding: '8px' }}>
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            </Grid>
          ) : (
            <DetailsPage data={employeeMasterData} fields={fields} />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <History id={id} />
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 3}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.employeeMaster}
                  data={employeeMasterData}
                  allowedToEdit={permissions?.employeeMaster?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.employeeMaster?.titleSingular?.toLowerCase()} : ${employeeMasterData?.employeeNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageEmployeeMaster
          id={id}
          isClone={false}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
        />
      )}
      {showAssignEntityDialog && (
        <Dialog
          fullWidth
          fullScreen={isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          maxWidth="xs"
          open={showAssignEntityDialog}
          onClose={() => {
            setShowAssignEntityDialog(false);
          }}
          aria-labelledby="assign-roles-dialog"
        >
          <AssignEntityDialog
            entitiesDialogOpen={showAssignEntityDialog}
            handleCloseDialog={() => {
              setShowAssignEntityDialog(false);
            }}
            type="entity"
            ids={[id]}
            assignedEntity={[]}
            isRenderedFromContact={true}
            regionalRole={false}
            onSuccess={() => {
              setShowAssignEntityDialog(false);
              fetchData();
            }}
            roleAccessIds={roleAccessOfLoggedInUser}
            contactResource={'employeeMaster'}
          />
        </Dialog>
      )}
    </Box>
  );
};

export default EmployeeMasterDetail;
