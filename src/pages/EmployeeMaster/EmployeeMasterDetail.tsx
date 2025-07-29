import { Box, Dialog } from '@mui/material';
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
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import { ACTIVITY_RESOURCE, CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import History from './History';
import ManageEmployeeMaster from './ManageEmployeeMaster';
import Step from '../DynamicForm/Step';
import TechnicianUnavailability from 'src/pages/TechnicianUnavailability';
import { getResourcePolicy } from 'src/pages/DynamicForm/helper';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';

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
  const [resourcePolicyData, setResourcePolicyData] = useState(null);
  const [unavailabilityFields, setUnavailabilityFields] = useState(null);

  const {
    state: { permissions, user, resources }
  }: any = useData();

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
      fetchLoggedInUserRole();
      fetchPolicy();
      fetchUnavailabilityFields();
    }
  }, [id]);

  const fetchUnavailabilityFields = async () => {
    const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource.technicianUnavailability, permissions?.technicianUnavailability?.isUpdate);
    setUnavailabilityFields(fieldsDataForRead);
  };

  const fetchFields = async () => {
    const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource.employeeMaster, permissions?.employeeMaster?.isUpdate);
    setFields(fieldsDataForRead);
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
    const data = await getResourcePolicy(user, permissions, sidebarResource.employeeMaster);
    setResourcePolicyData(data);
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
                <ThemeButton
                  onClick={() => {
                    window.open(`${routes.userDetail.path}/${employeeMasterData?.userId}`);
                  }}
                  iconForMobile={false}
                >
                  View User
                </ThemeButton>
              ) : (
                permissions?.employeeMaster?.isUpdate && (
                  <ThemeButton
                    onClick={() => {
                      setShowAssignEntityDialog(true);
                    }}
                    iconForMobile={false}
                  >
                    Give Portal Access
                  </ThemeButton>
                )
              )}
              {permissions?.employeeMaster?.isUpdate && (
                <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpenUpdateDialog} mobileTooltip={'Edit'}>
                  Edit
                </ThemeButton>
              )}
              {permissions?.employeeMaster?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            </>
            <ActivityButton
              referenceId={employeeMasterData?._id}
              resource={ACTIVITY_RESOURCE.employeeMaster}
              resourceLabel={employeeMasterData?.employeeNumber}
              resourceData={employeeMasterData}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0} label={'Details'} />
          {unavailabilityFields?.length > 0 && <CustomTab value={1} label={'Unavailability'} />}
          <CustomTab value={2} label={'History'} />
          {resourcePolicyData &&
            resourcePolicyData?.tabs?.length > 0 &&
            resourcePolicyData?.tabs?.map((tab, i) => <CustomTab value={i + (unavailabilityFields?.length > 0 ? 3 : 2)}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          {loading || !fields?.length ? (
            <div className="p-2">
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </div>
          ) : (
            <DetailsPage data={employeeMasterData} fields={fields} resource={sidebarResource?.employeeMaster} referenceId={employeeMasterData?._id} />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <TechnicianUnavailability id={id} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <History id={id} />
        </TabPanel>
        {resourcePolicyData &&
          resourcePolicyData?.tabs?.length > 0 &&
          resourcePolicyData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 3}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourcePolicyData?._id}
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
