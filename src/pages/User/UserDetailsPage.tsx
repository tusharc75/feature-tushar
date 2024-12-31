import { ControlPoint, Edit } from '@mui/icons-material';
import { Skeleton, Theme } from '@mui/material';
import { Box, Dialog, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { makeStyles } from '@mui/styles';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { FcFlowChart } from 'react-icons/fc';
import { RiSettingsFill } from 'react-icons/ri';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';
import { GeneratePasswordIcon, ResetPasswordIcon } from 'src/assets/svg/svgIcons';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import QuotesInAccordion from 'src/components/QuotesInAccordion/QuotesInAccordion';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import AssignEntityDialog from '../../components/AssignRolesDialog/AssignEntityDialog';
import AssignRolesDialog from '../../components/AssignRolesDialog/AssignRolesDialog';
import BoxWithBorder from '../../components/BoxWithBorder';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import FullScreenDialog from '../../components/Helpers/FullScreenDialog';
import routes from '../../components/Helpers/Routes';
import OrgChartContainer from '../../components/OrgChart/OrgChartContainer';
import QuickLinks, { IQuickLinks } from '../../components/QuickLinks/QuickLinks';
import ResourceTransferDialog from '../../components/ResourceTransferDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import {
  ACTIVITY_RESOURCE,
  checkSuperAdminAccess,
  CustomDialogTransition,
  customerAccount,
  customerContact,
  displayDate,
  lead,
  opportunity,
  quoteBuilder,
  sidebarResource,
  supplierAccount,
  supplierContact,
  userType
} from '../../constants/helpers';
import AccountAccordionDetail from './AccountAccordionInDetail';
import AssignedEntities from './AssignedEntities';
import ContactAccordionInDetailPage from './ContactAccordionInDetailPage';
import GenerateAutoPassword from './GenerateAutoPassword';
import LeadAccordionInUserDetailPage from './LeadAccordionInUserDetailPage';
import ManageUserDialog from './ManageUserDialog';
import OpportunityAccordionInUserDetail from './OpportunityAccordionInUserDetail';
import UserSession from './UserSession';

import { isMobile, isTablet } from 'react-device-detect';

const useStyles = makeStyles((theme: Theme) => ({
  dataValue: {
    fontWeight: 500,
    color: theme.palette.primary.main
  },
  detailLabel: {
    fontSize: '0.8rem',
    fontWeight: 'normal',
    color: '#656464'
  }
}));

const UserDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const { id } = useParams();
  const history = useHistory();
  const queryParameter = useLocation().search;
  const userSetup = new URLSearchParams(queryParameter).get('userSetup');
  const { tab }: any = queryString.parse(history.location.search);
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [loading, setLoading] = useState(false);
  const [globalRoles, setGloabalRoles] = useState([]);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [leadsRelatedData, setLeadsRelatedData] = useState(null);
  const [opportunityRelatedData, setOpportunityRelatedData] = useState(null);
  const [customerContactRelatedData, setCustomerContactRelatedData] = useState(null);
  const [customerAccountRelatedData, setCustomerAccountRelatedData] = useState(null);
  const [supplierAccountRelatedData, setSupplierAccountRelatedData] = useState(null);
  const [supplierContactRelatedData, setSupplierContactRelatedData] = useState(null);
  const [quotesRelatedData, setQuotesRelatedData] = useState(null);
  const [entityAccess, setEntityAccess] = useState([]);
  const [roleAccessOfLoggedInUser, setRoleAccessOfLoggedInUser] = useState([]);

  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [deleteUserRec, setDeleteUserRec] = useState(undefined);
  const [roleDeleteRec, setRoleDeleteRec] = useState(undefined);
  const [userFields, setUserFIelds] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([{ ...routes.user, title: resources?.user?.titlePlural }]);
  const [orgChartData, setOrgChartData] = useState([]);
  const [orgChartInFullScreenDialog, setOrgChartInFullScreenDialog] = useState(false);
  const [entities, setEntities] = useState<any[]>([]);
  const [showAssignEntityDialog, setShowAssignEntityDialog] = useState(false);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allUsers, setAllUsers] = useState([]);
  const [generateAutoPassword, setGenerateAutoPassword] = useState(false);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  useEffect(() => {
    if (id) {
      getUserFields();
      fetchUserData();
      fetchUserRelatedDetail();
    }
  }, [id]);

  useEffect(() => {
    fetchAllUsers();
    fetchLoggedInUserEntities();
    fetchLoggedInUserRole();
  }, []);

  useEffect(() => {
    if (roleAccessOfLoggedInUser?.length && userSetup === 'true') {
      setShowAssignEntityDialog(true);
    }
  }, [id, roleAccessOfLoggedInUser]);

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

  const fetchLoggedInUserEntities = async () => {
    const entityIds = user.entity?.map((e) => e._id);
    setEntityAccess(entityIds);
  };

  const fetchAllUsers = () => {
    axiosInstance()
      .get(`/user`)
      .then(({ data: { data, count } }) => {
        let tempAllUsers = data.map((o) => ({ optionValue: o?._id, optionLabel: o?.concatedName }));
        setAllUsers(tempAllUsers);
      });
  };

  const quickLinks: IQuickLinks[] = [
    {
      label: 'Org Chart',
      onClick: () => {
        setOrgChartInFullScreenDialog(true);
      },
      icon: <FcFlowChart size={42} />,
      show: true,
      class: 'account'
    }
  ].filter((d) => d.show);

  const fetchUserData = async () => {
    setLoading(true);

    await axiosInstance()
      .get(`/user/${id}`)
      .then(({ data: { data } }) => {
        if (data?.hideEmail) {
          data.email = null;
        }
        handleMainPoints(data);
        const name = [data.firstName, data.lastName].filter((d) => d).join(' ');
        setUserData(data);
        setEntities(data.entities.filter((e) => e.role.length !== 0 || e.entity !== undefined));
        setGloabalRoles(data.role);
        setCustomizedRoutes([{ ...routes.user, title: resources?.user?.titlePlural }, { title: `${data.firstName} ${data.lastName}` }]);
        let orgChartData = [];
        if (data.parentHierarchy && data.parentHierarchy.length > 0) {
          data.parentHierarchy.forEach((d) => {
            orgChartData.push({
              id: d._id,
              name: [d.firstName, d.lastName].filter((d) => d).join(' '),
              parentId: d.reportsTo ? d.reportsTo : 0,
              logo: d.avatar,
              email: d.email,
              phone: d.mobileNo,
              current: false
            });
          });
        }

        orgChartData.push({
          id: data._id,
          name: [data.firstName, data.lastName].filter((d) => d).join(' '),
          parentId: data.reportsTo ? data.reportsTo.optionValue : 0,
          logo: data.avatar,
          email: data.email,
          phone: data.mobileNo,
          current: true
        });

        setOrgChartData(orgChartData);

        setLoading(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchUserRelatedDetail = () => {
    // setUserRelatedLoading(true);
    axiosInstance()
      .get(`/user/related/${id}`)
      .then(({ data: { data } }) => {
        setCustomerAccountRelatedData(data['Customer Account']);
        setCustomerContactRelatedData(data['Customer Contact']);
        setSupplierAccountRelatedData(data['Supplier Account']);
        setSupplierContactRelatedData(data['Supplier Contact']);
        setLeadsRelatedData(data['Lead']);
        setOpportunityRelatedData(data['Opportunity']);
        setQuotesRelatedData(data['Quotes']);
      })
      .catch((error) => {
        // setUserRelatedLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      name: `${data.firstName} ${data.lastName}`,
      phone: data.mobileNo || '',
      email: data?.email || ''
    };
    setMainPoints(tempMp);
  };

  const getUserFields = () => {
    axiosInstance()
      .get('/field?resource=User')
      .then(({ data }) => {
        setUserFIelds(data.data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDeleteUser = (id) => {
    setDeleteUserRec(id);
    setShowConfirmBox(true);
  };

  const DeleteUser = () => {
    if (deleteUserRec) {
      if (permissions?.user?.isDelete) {
        axiosInstance()
          .put(`/user/remove`, { ids: [deleteUserRec] })
          .then(({ data }) => {
            setShowConfirmBox(false);
            history.push(`${routes.user.path}`);
          })
          .catch((err) => {
            setShowConfirmBox(false);
          });
      }
    } else {
      setShowConfirmBox(false);
    }
  };

  // const handleUpdateUser = (values) => {
  //   setUpdating(true);

  //   axiosInstance()
  //     .put(`/user`, { ...values, _id: id })
  //     .then(({ data }) => {
  //       fetchUserData();
  //       toastConfig.setToastConfig({
  //         open: true,
  //         type: "success",
  //         message: data.message,
  //       });
  //       setUserPermissions(data.permissions);
  //       setUpdating(false);
  //       closeUpdateDialog();
  //     })
  //     .catch((error) => {
  //       toastConfig.setToastConfig(error);
  //       setUpdating(false);
  //     });
  // };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };

  const entityDialogOpen = () => {
    setShowAssignEntityDialog(true);
  };

  const entityDialogClose = () => {
    setShowAssignEntityDialog(false);
  };

  const unassignUserRole = () => {
    if (roleDeleteRec?._id) {
      const data = {
        user: id,
        roles: [roleDeleteRec?._id]
      };
      axiosInstance()
        .put('/user/un-assign-role', data)
        .then(() => {
          setShowConfirmBox(false);
          fetchUserData();
          toastConfig.setToastConfig({
            message: 'Role unassigned successfully',
            type: 'success',
            open: true
          });
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  };

  const handleOpenDialog = () => {
    setRolesDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setRolesDialogOpen(false);
  };

  const handleResetPassword = async () => {
    axiosInstance()
      .post(`/user/forget-password`, {
        email: userData.email
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          message: data.message,
          type: 'success',
          open: true
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <>
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs routes={customizedRoutes} />
          </Box>
          <Box className="controls-v1">
            <Box className="control-buttons-v1">
              {permissions?.role?.isUpdate && permissions?.entity?.isUpdate && (
                <span className="max-[768px]:hidden">
                  <ThemeButton iconForMobile={<RiSettingsFill />} mobileTooltip="Assign Entity/Role" onClick={entityDialogOpen}>
                    Assign Entity/Role
                  </ThemeButton>
                </span>
              )}
              {user?.user?.userType === userType.brandAdmin && (
                <ThemeButton
                  iconForMobile={<GeneratePasswordIcon size={20} />}
                  onClick={() => {
                    setGenerateAutoPassword(true);
                  }}
                  mobileTooltip="Generate Password"
                >
                  Generate Password
                </ThemeButton>
              )}
              {permissions?.user?.isUpdate && (
                <ThemeButton mobileTooltip="Reset Password" iconForMobile={<ResetPasswordIcon />} onClick={handleResetPassword}>
                  Reset Password
                </ThemeButton>
              )}
              {permissions?.user?.isUpdate ? (
                <ThemeButton
                  iconForMobile={<Edit />}
                  onClick={handleOpenUpdateDialog}
                  disabled={
                    userData?.userType === userType.brandAdmin
                      ? checkSuperAdminAccess(user, sidebarResource.user) || user?.user?._id === id
                        ? false
                        : true
                      : false
                  }
                  mobileTooltip={'Edit'}
                >
                  Edit
                </ThemeButton>
              ) : null}
              {permissions?.user?.isDelete ? (
                <DeleteButton
                  text={'Delete'}
                  disabled={user?.user?._id === id || userData?.userType === userType.brandAdmin}
                  onClick={() => handleDeleteUser(true)}
                />
              ) : null}
              <ActivityButton
                referenceId={userData?._id}
                resource={ACTIVITY_RESOURCE.user}
                resourceLabel={`${userData?.firstName} ${userData?.lastName}`}
              />
            </Box>
          </Box>
        </Box>
        <Box className={`detail-container-v1`}>
          <Box>
            <Box style={{ padding: '8px', minHeight: '450px' }}>
              {loading || !userFields.length || !userData ? (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Grid>
              ) : (
                <>
                  <CustomTabs value={tabValue} onChange={handleMainTabChange}>
                    <CustomTab value={0} label={'Details'} />
                    <CustomTab value={1} label={'Org Chart'} />
                    {userData?.proxyDOA?.optionValue && <CustomTab value={2} label={'DOA Proxy'} />}
                    <CustomTab value={3} label={'User Session'} />
                    <CustomTab value={4} label={'Assigned Entity'} />
                  </CustomTabs>
                  <TabPanel value={tabValue} index={0}>
                    <DetailsPageHeader logo={userData?.avatar ? userData.avatar : undefined} mainPoints={mainPoints} />
                    <DetailsPage data={userData} fields={userFields} />
                  </TabPanel>
                  <TabPanel value={tabValue} index={1}>
                    <OrgChartContainer
                      data={orgChartData}
                      onClick={(id) => {
                        history.push(`${routes.userDetail.path}/${id}`);
                      }}
                    />
                  </TabPanel>
                  <TabPanel value={tabValue} index={2}>
                    {userData?.proxyDOA ? (
                      <TableContainer>
                        <Table aria-label="DOA Proxy Table" size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>
                                <h4 title="assignedTo" className={classes.detailLabel}>
                                  Assigned To
                                </h4>
                              </TableCell>

                              <TableCell align="center">
                                <h4 title="startDate" className={classes.detailLabel}>
                                  Start Date
                                </h4>
                              </TableCell>

                              <TableCell align="center">
                                <h4 title="endDate" className={classes.detailLabel}>
                                  End Date
                                </h4>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow key={userData.proxyDOA?.user}>
                              <TableCell>
                                <Link
                                  className="link"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  to={`${routes.userDetail.path}/${userData.proxyDOA?.user}`}
                                >
                                  {userData.proxyDOA?.user}
                                </Link>
                              </TableCell>
                              <TableCell align="center">
                                <span className={classes.dataValue}>{displayDate(userData?.proxyDOA?.startDate)}</span>
                              </TableCell>
                              <TableCell align="center">
                                <span className={classes.dataValue}>{displayDate(userData?.proxyDOA?.endDate)}</span>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : null}
                  </TabPanel>
                  <TabPanel value={tabValue} index={3}>
                    <UserSession id={id} />
                  </TabPanel>
                  <TabPanel value={tabValue} index={4}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
                        <div className="relative flex justify-between rounded-t bg-[var(--dark-secondary,var(--accordion-expanded-summary-bg,#EFFBF9))] px-7 py-4">
                          <h6 className="text-sm font-semibold leading-[1.05] ">Assigned Entity ({entities?.length || 0})</h6>
                          {permissions?.entity?.isUpdate && permissions?.role?.isUpdate && (
                            <span className="absolute right-7 top-[50%] [transform:translateY(-50%)]">
                              <IconButton title="Assign entities" color="primary" size="small" onClick={entityDialogOpen}>
                                <ControlPoint />
                              </IconButton>
                            </span>
                          )}
                        </div>
                        <div className="pt-3">
                          {loading ? (
                            <Box display="flex">
                              {[1, 2].map((i) => (
                                <BoxWithBorder
                                  key={i}
                                  style={{
                                    padding: '8px',
                                    margin: '8px',
                                    width: '100%'
                                  }}
                                >
                                  <Box padding={1}>
                                    <Skeleton variant="text" width="100px" height="20px" />
                                    <Box marginTop={1} />
                                    <Skeleton variant="text" width="100%" height="15px" />
                                  </Box>
                                </BoxWithBorder>
                              ))}
                            </Box>
                          ) : entities?.length ? (
                            <AssignedEntities
                              entities={entities}
                              permissions={permissions}
                              userId={id}
                              loggedInUser={user?.user}
                              onSuccess={() => {
                                fetchUserData();
                              }}
                              entityAccessIds={entityAccess}
                              roleAccessIds={roleAccessOfLoggedInUser}
                            />
                          ) : (
                            <Box textAlign="center" padding={2}>
                              <Typography>No Entities </Typography>
                            </Box>
                          )}
                        </div>
                      </Grid>
                    </Grid>
                  </TabPanel>
                </>
              )}
            </Box>
            <div className="pt-3">
              <QuickLinks quickLinks={quickLinks} />
              {permissions?.[opportunity.opportunityResource]?.isRead && (
                <Box mb={2}>
                  <OpportunityAccordionInUserDetail
                    opportunities={[...(opportunityRelatedData?.Owner ?? []), ...(opportunityRelatedData?.Collaborator ?? [])]}
                    recordsPerLine={3}
                    expanded={false}
                    userId={id}
                    onSuccess={() => {
                      fetchUserRelatedDetail();
                    }}
                    isAllowedToEdit={false}
                  />
                </Box>
              )}
              {permissions?.[lead.leadResource]?.isRead && (
                <Box mb={2}>
                  <LeadAccordionInUserDetailPage
                    leads={[...(leadsRelatedData?.Owner ?? []), ...(leadsRelatedData?.Collaborator ?? [])]}
                    recordsPerLine={3}
                    expanded={false}
                    userId={id}
                    onSuccess={() => {
                      fetchUserRelatedDetail();
                    }}
                    isAllowedToEdit={false}
                  />
                </Box>
              )}
              {permissions?.[customerAccount.accountResource]?.isRead && (
                <Box mb={2}>
                  <AccountAccordionDetail
                    type="customer"
                    accounts={[...(customerAccountRelatedData?.Owner ?? []), ...(customerAccountRelatedData?.Collaborator ?? [])]}
                    recordsPerLine={3}
                    expanded={false}
                    userId={id}
                    onSuccess={() => {
                      fetchUserRelatedDetail();
                    }}
                    isAllowedToEdit={false}
                  />
                </Box>
              )}
              {permissions?.[supplierAccount.accountResource]?.isRead && (
                <Box mb={2}>
                  <AccountAccordionDetail
                    type="supplier"
                    accounts={[...(supplierAccountRelatedData?.Owner ?? []), ...(supplierAccountRelatedData?.Collaborator ?? [])]}
                    recordsPerLine={3}
                    expanded={false}
                    userId={id}
                    onSuccess={() => {
                      fetchUserRelatedDetail();
                    }}
                    isAllowedToEdit={false}
                  />
                </Box>
              )}
              {permissions?.[customerContact.contactResource]?.isRead && (
                <Box mb={2}>
                  <ContactAccordionInDetailPage
                    type="customer"
                    contacts={[...(customerContactRelatedData?.Owner ?? []), ...(customerContactRelatedData?.Collaborator ?? [])]}
                    recordsPerLine={3}
                    expanded={false}
                    userId={id}
                    onSuccess={() => {
                      fetchUserRelatedDetail();
                    }}
                    isAllowedToEdit={false}
                  />
                </Box>
              )}
              {permissions?.[supplierContact.contactResource]?.isRead && (
                <Box mb={2}>
                  <ContactAccordionInDetailPage
                    type="supplier"
                    contacts={[...(supplierContactRelatedData?.Owner ?? []), ...(supplierContactRelatedData?.Collaborator ?? [])]}
                    recordsPerLine={3}
                    expanded={false}
                    userId={id}
                    onSuccess={() => {
                      fetchUserRelatedDetail();
                    }}
                    isAllowedToEdit={false}
                  />
                </Box>
              )}
              {permissions?.[quoteBuilder.qbResource]?.isRead && (
                <QuotesInAccordion
                  recordsPerLine={3}
                  quotes={[...(quotesRelatedData?.Owner ?? []), ...(quotesRelatedData?.Collaborator ?? [])]}
                  expanded={false}
                  fetchData={() => fetchUserRelatedDetail()}
                  quoteBuilderPermission={permissions?.[quoteBuilder.qbResource]}
                  allowedToEdit={false}
                />
              )}
            </div>
          </Box>
        </Box>
      </Box>
      {openUpdateDialog && (
        <ManageUserDialog
          open={openUpdateDialog}
          close={closeUpdateDialog}
          onSuccess={(obj) => {
            setOpenUpdateDialog(false);
            fetchUserData();
          }}
          userId={userData?._id}
          dataToUpdate={userData}
          isNew={false}
        />
      )}
      {rolesDialogOpen && (
        <Dialog
          TransitionComponent={CustomDialogTransition}
          fullWidth
          maxWidth="xs"
          open={rolesDialogOpen}
          onClose={handleCloseDialog}
          aria-labelledby="assign-roles-dialog"
        >
          <AssignRolesDialog
            rolesDialogOpen={rolesDialogOpen}
            handleCloseDialog={handleCloseDialog}
            userIds={[id]}
            assignedRoles={globalRoles}
            onSuccess={() => {
              handleCloseDialog();
              fetchUserData();
            }}
          />
        </Dialog>
      )}
      {showAssignEntityDialog && (
        <Dialog
          fullWidth
          fullScreen={isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          maxWidth="xs"
          open={showAssignEntityDialog}
          onClose={entityDialogClose}
          aria-labelledby="assign-roles-dialog"
        >
          <AssignEntityDialog
            entitiesDialogOpen={showAssignEntityDialog}
            handleCloseDialog={entityDialogClose}
            type="entity"
            ids={[id]}
            assignedEntity={entities}
            regionalRole={false}
            onSuccess={() => {
              fetchUserData();
              entityDialogClose();
            }}
            roleAccessIds={roleAccessOfLoggedInUser}
          />
        </Dialog>
      )}
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={
            deleteUserRec
              ? `Are you sure you want to delete this User ${userData.firstName} ${userData.lastName} ?`
              : roleDeleteRec
                ? `Are you sure you want to unassign ${roleDeleteRec?.name} role from ${userData.firstName} ${userData.lastName} ?`
                : ''
          }
          onClose={() => {
            setShowConfirmBox(false);
            if (roleDeleteRec) setRoleDeleteRec(undefined);
            if (deleteUserRec) setDeleteUserRec(undefined);
          }}
          onOk={deleteUserRec ? DeleteUser : roleDeleteRec ? unassignUserRole : null}
        />
      ) : null}
      {orgChartInFullScreenDialog && (
        <FullScreenDialog
          heading="Org Chart"
          open={orgChartInFullScreenDialog}
          close={() => {
            setOrgChartInFullScreenDialog(false);
          }}
        >
          <OrgChartContainer
            data={orgChartData}
            onClick={(id) => {
              setOrgChartInFullScreenDialog(false);
              history.push(`${routes.userDetail.path}/${id}`);
            }}
          />
        </FullScreenDialog>
      )}
      {showConfirmBox && deleteUserRec ? (
        <ResourceTransferDialog
          open={showConfirmBox}
          resource="User"
          fromResource={[userData]}
          allResourceData={allUsers}
          onClose={() => setShowConfirmBox(false)}
          handleDelete={() => {
            setShowConfirmBox(false);
            history.push(routes.user.path);
          }}
        />
      ) : null}
      {generateAutoPassword && (
        <GenerateAutoPassword
          onClose={() => {
            setGenerateAutoPassword(false);
          }}
          ids={[userData?._id]}
        />
      )}
    </>
  );
};

export default UserDetailsPage;
