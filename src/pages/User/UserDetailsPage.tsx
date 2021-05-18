import { useState, useEffect, useContext } from "react";
import {
  Grid,
  Box,
  Button,
  Typography,
  FormControl,
  FormGroup,
  FormControlLabel,
  Switch,
  IconButton,
  Paper,
  Tooltip,
  Tabs,
  Tab
} from "@material-ui/core";
import DeleteButton from "../../components/Helpers/DeleteButton";
import { ControlPoint } from "@material-ui/icons";
import { Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import { startCase } from "lodash";
import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import routes from "../../components/Helpers/Routes";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import { useData } from "../../StateProvider/Provider";
import BoxWithBorder from "../../components/BoxWithBorder";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import UserRoles from "./UserRoles";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import AssignRolesDialog from "../../components/AssignRolesDialog/AssignRolesDialog";
import RoleEngine from "../../components/Shared/RoleEngine";
import NewStepper from "../../components/Helpers/NewStepper";
import DoaDialog from "../DoaSetup/ManageDoa/ManageDoaDialog";
import { userType } from "../../constants/helpers";
import OpportunityAccordionInUserDetail from "./OpportunityAccordionInUserDetail";
import LeadAccordionInUserDetailPage from "./LeadAccordionInUserDetailPage";
import AccountAccordionDetail from "./AccountAccordionInDetail";
import ContactAccordionInDetailPage from "./ContactAccordionInDetailPage";
import ManageUserDialog from "./ManageUserDialog";
import OrgChartContainer from "../../components/OrgChart/OrgChartContainer";
import FullScreenDialog from "../../components/Helpers/FullScreenDialog";
import QuickLinks, { IQuickLinks } from "../../components/QuickLinks/QuickLinks";
import { FcFlowChart } from 'react-icons/fc';
import AssignEntityDialog from "../../components/AssignRolesDialog/AssignEntityDialog";
import AssignedEntities from "./AssignedEntities";

const UserDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions },
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [loading, setLoading] = useState(false);
  const [globalRoles, setGloabalRoles] = useState([]);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  // const [userRelatedLoading, setUserRelatedLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [leadsRelatedData, setLeadsRelatedData] = useState(null);
  const [opportunityRelatedData, setOpportunityRelatedData] = useState(null);
  const [customerContactRelatedData, setCustomerContactRelatedData] = useState(null);
  const [customerAccountRelatedData, setCustomerAccountRelatedData] = useState(null);
  const [supplierAccountRelatedData, setSupplierAccountRelatedData] = useState(null);
  const [supplierContactRelatedData, setSupplierContactRelatedData] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [unionRoleData, setUnionRoleData] = useState(null);

  // const [isChangingPermission, setIsChangingPermission] = useState(false);
  const [hasPermissionToUpdateApprovalProcess] = useState(permissions.user.isUpdate && user?.user?.userType === userType.brandAdmin);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [deleteUserRec, setDeleteUserRec] = useState(undefined);
  const [roleDeleteRec, setRoleDeleteRec] = useState(undefined);
  const [userFields, setUserFIelds] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  // const [isUpdating, setUpdating] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.user]);
  const [doa, setDoa] = useState<any[]>([]);
  const [doaCurrency, setDoaCurrency] = useState("");
  const [doaDialogOpen, setDoaDialogOpen] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [orgChartData, setOrgChartData] = useState([])
  const [orgChartInFullScreenDialog, setOrgChartInFullScreenDialog] = useState(false);
  const [entities, setEntities] = useState<any[]>([])
  const showRecordsBeforeViewAll = 2;
  const [showEntities, setShowEntities] = useState(showRecordsBeforeViewAll);
  const [showAssignEntityDialog, setShowAssignEntityDialog] = useState(false);

  useEffect(() => {
    if (id) {
      getUserFields();
      fetchUserData();
      getRoleUnion();
      fetchDoa();
      fetchUsers()
      fetchUserRelatedDetail()
    }
    // eslint-disable-next-line
  }, [id]);

  const quickLinks: IQuickLinks[] = [
    {
      label: "Org Chart",
      onClick: () => {
        setOrgChartInFullScreenDialog(true);
      },
      icon: <FcFlowChart />,
      show: true,
      class: "account"
    },
  ].filter((d) => d.show);


  const fetchUserData = async () => {
    setLoading(true);
    try {
      const {
        data: { data },
      } = await axiosInstance().get(`/user/${id}`);
      handleMainPoints(data);
      const name = [data.firstName, data.lastName].filter((d) => d).join(" ");

      setHeadingLbl(name);
      setUserData(data);
      setEntities(data.entities.filter(e => e.role.length !== 0 || e.entity !== undefined))
      setGloabalRoles(data.role); 
      setCustomizedRoutes([
        routes.user,
        { title: `${data.firstName} ${data.lastName}` },
      ]);

      let orgChartData = [];

      if (data.parentHierarchy && data.parentHierarchy.length > 0) {
        data.parentHierarchy.forEach(d => {
          orgChartData.push({
            id: d._id,
            name: [d.firstName, d.lastName]
              .filter((d) => d)
              .join(" "),
            parentId: d.reportsTo ? d.reportsTo : 0,
            logo: d.avatar,
            email: d.email,
            phone: d.mobileNo,
            current: false
          })
        })
      }

      orgChartData.push({
        id: data._id,
        name: [data.firstName, data.lastName]
          .filter((d) => d)
          .join(" "),
        parentId: data.reportsTo ? data.reportsTo.optionValue : 0,
        logo: data.avatar,
        email: data.email,
        phone: data.mobileNo,
        current: true
      })

      setOrgChartData(orgChartData);

      setUserPermissions(data.permissions);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchDoa = async () => {
    setDoa([]);
    axiosInstance()
      .get(`/doa/${id}`)
      .then(({ data: { data, count } }) => {
        setDoa(
          data?.doa.map((item) => {
            return {
              id: item.user?._id,
              name: `${item.user.firstName} ${item.user.lastName}`,
              firstName: item.user.firstName,
              lastName: item.user.lastName,
              amount: item.amount,
            };
          })
        );
        setDoaCurrency(data?.doaCurrency)
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };

  const fetchUsers = () => {
    axiosInstance()
      .get("/user")
      .then(({ data: { data, count } }) => {
        getRows(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }

  const getRows = (data: []) => {
    const rows = data.length
      ? data.map((user: any) => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
      }))
      : [];

    setUserList(rows);
  };

  const fetchUserRelatedDetail = () => {
    // setUserRelatedLoading(true);
    axiosInstance()
      .get(`/user/related/${id}`)
      .then(({ data: { data } }) => {
        setCustomerAccountRelatedData(data["Customer Account"]);
        setCustomerContactRelatedData(data["Customer Contact"]);
        setSupplierAccountRelatedData(data["Supplier Account"]);
        setSupplierContactRelatedData(data["Supplier Contact"]);
        setLeadsRelatedData(data["Lead"]);
        setOpportunityRelatedData(data["Opportunity"]);
      })
      .catch((error) => {
        // setUserRelatedLoading(false);
        toastConfig.setToastConfig(error);
      })


  }

  const handleMainPoints = (data) => {
    let tempMp = {
      name: `${data.firstName} ${data.lastName}`,
      phone: data.phone || "",
      email: data.email || "",
    };
    setMainPoints(tempMp);
  };

  const getUserFields = () => {
    axiosInstance()
      .get("/field?resource=User")
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
      if (permissions.user.isDelete) {
        axiosInstance()
          .put(`/user/remove`, { ids: [deleteUserRec] })
          .then(({ data }) => {
            setShowConfirmBox(false);
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

  const getRoleUnion = () => {
    axiosInstance()
      .get(`/user/union-role/${id}`)
      .then(({ data: { data } }) => {
        setUnionRoleData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };
  /* Unassign role */
  const handleUnassignRole = (rec) => {
    setRoleDeleteRec(rec);
    setShowConfirmBox(true);
  };

  const unassignUserRole = () => {
    if (roleDeleteRec?._id) {
      const data = {
        user: id,
        roles: [roleDeleteRec?._id],
      };
      axiosInstance()
        .put("/user/un-assign-role", data)
        .then(() => {
          setShowConfirmBox(false);
          fetchUserData();
          setUnionRoleData(null);
          getRoleUnion();
          toastConfig.setToastConfig({
            message: "Successfully unassigned role",
            type: "success",
            open: true,
          });
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  };
  /**
   *  Permissions Change Handle
   */
  const handleChangePermissions = (e) => {
    setUserPermissions({
      ...userPermissions,
      [e.target.name]: e.target.checked,
    });
    const newData = {
      _id: id,
      ...userPermissions,
      [e.target.name]: e.target.checked,
    };
    // setHasPermissionToUpdateApprovalProcess(false);
    axiosInstance()
      .post("/user/permission-setup", newData)
      .then(({ data }) => {
        // setHasPermissionToUpdateApprovalProcess(permissions.user.isUpdate && user?.user?.userType === userType.brandAdmin);
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
      })
      .catch((err) => {
        // setHasPermissionToUpdateApprovalProcess(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenDialog = () => {
    setRolesDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setRolesDialogOpen(false);
  };

  return (
    <>
      {openUpdateDialog && (
        <ManageUserDialog open={openUpdateDialog} close={closeUpdateDialog} onSuccess={(permissions) => {
          setUserPermissions(permissions);
          setOpenUpdateDialog(false);
          fetchUserData();
        }} userId={userData._id} dataToUpdate={userData} isNew={false} />
      )}
      {rolesDialogOpen && (
        <AssignRolesDialog
          rolesDialogOpen={rolesDialogOpen}
          handleCloseDialog={handleCloseDialog}
          userIds={[id]}
          assignedRoles={globalRoles}
          onSuccess={() => {
            handleCloseDialog();
            fetchUserData();
            getRoleUnion();
          }}
        />
      )}
      {showAssignEntityDialog && (
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
        />
      )}
      <Layout>

        <Grid container direction="row">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8}>
            <Paper>
              {!userData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                    <Box marginX={1} />
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                  </Box>
                </div>
              ) : (
                <DetailsPageHeader
                  heading={headingLbl}
                  logo={userData?.avatar ? userData.avatar : undefined}
                  mainPoints={mainPoints}
                  showHeading={true}
                >
                  {permissions.user.isUpdate ? (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleOpenUpdateDialog}
                    >
                      Edit
                    </Button>
                  ) : null}
                  {permissions.user.isDelete ? (
                    <DeleteButton
                      text="Delete"
                      disabled={user?.user?._id === id}
                      onClick={() => handleDeleteUser(id)}
                    />
                  ) : null}
                </DetailsPageHeader>
              )}

              <Box style={{ padding: "8px", minHeight: "450px" }}>
                {loading || !userFields.length || !userData ? (
                  <Grid container spacing={2} style={{ padding: "8px" }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <>
                    <Tabs className="oms-tab" value={currentTabIndex}
                      onChange={(index, newValue) => {
                        setCurrentTabIndex(newValue);
                      }}
                      indicatorColor="primary"
                      textColor="primary"
                      aria-label="icon tabs example"
                    >
                      <Tab
                        label="Details"
                        aria-controls="a11y-tabpanel-0"
                        id="a11y-tab-0"
                      />
                      <Tab
                        label="Org Chart"
                        aria-controls="a11y-tabpanel-1"
                        id="a11y-tab-1"
                      />
                    </Tabs>
                    <Box hidden={currentTabIndex !== 0}>
                      <DetailsPage data={userData} fields={userFields} />
                    </Box>
                    <Box hidden={currentTabIndex !== 1}>
                      <OrgChartContainer data={orgChartData} onClick={(id) => {
                        history.push(`${routes.userDetail.path}/${id}`)
                      }} />
                    </Box>
                  </>
                )}
              </Box>

              <Box style={{ padding: "0px", minHeight: "300px" }}>
                <Box display="flex" padding={1} bgcolor="grey.200">
                  <Grid container>
                    <Grid item xs={8}>
                      <Box display="flex">
                        <Box padding="5px">
                          <Typography variant="subtitle2">
                            Assigned Global Roles ({globalRoles.length || "0"})
                      </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={4} container justify="flex-end">
                      {permissions.user.isUpdate && (
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={handleOpenDialog}
                        >
                          <ControlPoint />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Box>

                <Grid container style={{ padding: "8px" }} spacing={1}>
                  <Grid item xs={12} sm={12} md={4}>
                    <BoxWithBorder
                      style={{
                        padding: "0px",
                        height: "352px",
                      }}
                    >
                      {rolesLoading ? (
                        [1, 2].map((i) => (
                          <BoxWithBorder
                            key={i}
                            style={{ padding: "0px", margin: "8px" }}
                          >
                            <Box padding={1}>
                              <Skeleton
                                variant="text"
                                width="100px"
                                height="20px"
                              />
                              <Box marginTop={1} />
                              <Skeleton variant="text" width="100%" height="15px" />
                            </Box>
                          </BoxWithBorder>
                        ))
                      ) : !globalRoles.length ? (
                        <Box textAlign="center" marginTop={2}>
                          <Typography variant="body2">
                            User doesn't have any roles
                      </Typography>
                        </Box>
                      ) : (
                        <Box
                          style={{
                            width: "100%",
                            height: "100%",
                            overflowY: "auto",
                          }}
                        >
                          {userData && (
                            <UserRoles
                              permissions={permissions}
                              data={globalRoles}
                              unassignRole={handleUnassignRole}
                              loggedInUser={user?.user}
                              currentUserId={id}

                            />
                          )}
                        </Box>
                      )}
                    </BoxWithBorder>
                  </Grid>
                  <Grid item xs={12} sm={12} md={8} lg={8}>
                    <BoxWithBorder
                      style={{
                        padding: "0px",
                        height: "352px",
                      }}
                    >
                      <RoleEngine
                        field={unionRoleData ? unionRoleData.field : []}
                        resource={unionRoleData ? unionRoleData.resource : []}
                        isDisable={true}
                      />
                    </BoxWithBorder>
                  </Grid>
                </Grid>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                  <Box
                    width="100%"
                    padding={1}
                    bgcolor="grey.200"
                    display="flex"
                    justifyContent="space-between"
                  >
                    <Typography variant="subtitle2">
                      Assigned Entity ({entities?.length || 0})
                </Typography>
                    {permissions.entity.isUpdate && (
                      <IconButton
                        title="Assign entities"
                        color="primary"
                        size="small"
                        onClick={entityDialogOpen}
                      >
                        <ControlPoint />
                      </IconButton>
                    )}
                  </Box>
                  <Box padding={1}>
                    {loading ? (
                      <Box display="flex">
                        {[1, 2].map((i) => (
                          <BoxWithBorder
                            key={i}
                            style={{
                              padding: "8px",
                              margin: "8px",
                              width: "100%",
                            }}
                          >
                            <Box padding={1}>
                              <Skeleton
                                variant="text"
                                width="100px"
                                height="20px"
                              />
                              <Box marginTop={1} />
                              <Skeleton variant="text" width="100%" height="15px" />
                            </Box>
                          </BoxWithBorder>
                        ))}
                      </Box>
                    ) :
                      entities?.length ? (
                        <AssignedEntities
                          entities={entities}
                          permissions={permissions}
                          userId={id}
                          loggedInUser={user?.user}
                          onSuccess={() => {
                            fetchUserData();
                          }}

                        />


                      )
                        : (
                          <Box textAlign="center" padding={2}>
                            <Typography>No Entities </Typography>
                          </Box>
                        )
                    }
                  </Box>
                </Grid>
              </Grid>

              {
                user?.user?.permissions?.doaSetup && <>
                  <Box style={{ padding: "0px" }}>
                    <Box display="flex" padding={1}>
                      <Grid container>
                        <Grid item xs={8}>
                          <Box display="flex">
                            <Box padding="5px">
                              <Typography variant="subtitle2">
                                {"DOA Details of " +
                                  userData?.firstName +
                                  " " +
                                  userData?.lastName}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item container xs={4} justify="flex-end">
                          {permissions.user.isUpdate && (
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => setDoaDialogOpen(true)}
                            >
                              {doa.length > 0 ? "Edit DOA" : "Add DOA"}
                            </Button>
                          )}
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                  <Grid container style={{ padding: "8px" }} spacing={1}>
                    <Grid item xs={12} sm={12}>
                      <BoxWithBorder
                        style={{
                          padding: "0px",
                        }}
                      >
                        {doa.length > 0 ? (
                          <NewStepper
                            heading={" "}
                            steps={doa}
                            doaCurrency={doaCurrency}
                          />
                        ) : (
                          <Box textAlign="center" marginTop={2}>
                            <Typography variant="body2">
                              User doesn't have any DOA
                    </Typography>
                          </Box>
                        )}
                      </BoxWithBorder>
                    </Grid>
                  </Grid>
                </>
              }
              <OpportunityAccordionInUserDetail
                opportunities={[...opportunityRelatedData?.Owner ?? [], ...opportunityRelatedData?.Collaborator ?? []]}
                recordsPerLine={3}
                expanded={false}
                userId={id}
                onSuccess={() => {
                  fetchUserRelatedDetail()
                }}
              />
              <LeadAccordionInUserDetailPage
                leads={[...leadsRelatedData?.Owner ?? [], ...leadsRelatedData?.Collaborator ?? []]}
                recordsPerLine={3}
                expanded={false}
                userId={id}
                onSuccess={() => {
                  fetchUserRelatedDetail()
                }}
              />
              <AccountAccordionDetail
                type="customer"
                accounts={[...customerAccountRelatedData?.Owner ?? [], ...customerAccountRelatedData?.Collaborator ?? []]}
                recordsPerLine={3}
                expanded={false}
                userId={id}
                onSuccess={() => {
                  fetchUserRelatedDetail()
                }}
              />
              <AccountAccordionDetail
                type="supplier"
                accounts={[...supplierAccountRelatedData?.Owner ?? [], ...supplierAccountRelatedData?.Collaborator ?? []]}
                recordsPerLine={3}
                expanded={false}
                userId={id}
                onSuccess={() => {
                  fetchUserRelatedDetail()
                }}
              />
              <ContactAccordionInDetailPage
                type="customer"
                contacts={[...customerContactRelatedData?.Owner ?? [], ...customerContactRelatedData?.Collaborator ?? []]}
                recordsPerLine={3}
                expanded={false}
                userId={id}
                onSuccess={() => {
                  fetchUserRelatedDetail()
                }}
              />
              <ContactAccordionInDetailPage
                type="supplier"
                contacts={[...supplierContactRelatedData?.Owner ?? [], ...supplierContactRelatedData?.Collaborator ?? []]}
                recordsPerLine={3}
                expanded={false}
                userId={id}
                onSuccess={() => {
                  fetchUserRelatedDetail()
                }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4}>
            <Paper>
              <Box className="detailHeader">
                <h2 className="listingHeader single">Approval Process</h2>
              </Box>
              <Box padding={2}>
                <FormControl component="fieldset" fullWidth>
                  <FormGroup>
                    {loading ? (
                      [1, 2, 3, 4].map((i) => (
                        <Box
                          padding={1}
                          marginBottom={2}
                          display="flex"
                          key={i}
                        >
                          <Skeleton
                            style={{ borderRadius: 16 }}
                            width="30px"
                            height="30px"
                          />
                          <Box marginX={1} />
                          <Skeleton
                            variant="text"
                            width="80%"
                            height="30px"
                          />
                        </Box>

                      ))
                    ) : userPermissions ? (
                      Object.keys(userPermissions).map((key) => (
                        <Tooltip title={!hasPermissionToUpdateApprovalProcess ? `You do not have permission to update ${startCase(key)}` : ""}>
                          <FormControlLabel
                            key={key}
                            control={
                              <Switch
                                checked={userPermissions[key]}
                                name={key}
                                disabled={!hasPermissionToUpdateApprovalProcess}
                                onChange={handleChangePermissions}
                              />
                            }
                            label={key === "doaSetup" ? "DOA Setup" : startCase(key)}
                          />
                        </Tooltip>
                      ))
                    ) : (
                      <Typography>There are no permissions</Typography>
                    )}
                  </FormGroup>
                </FormControl>
              </Box>
            </Paper>

            <QuickLinks quickLinks={quickLinks} />

          </Grid>
        </Grid>
      </Layout>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          // message={`Are you sure you want to delete this User ?`}
          // onClose={() => setShowConfirmBox(false)}
          // onOk={handleDeleteUser}
          message={
            deleteUserRec
              ? `Are you sure you want to delete this User ${userData.firstName} ${userData.lastName}`
              : roleDeleteRec
                ? `Are you sure you want to unassign ${roleDeleteRec?.name} role from ${userData.firstName} ${userData.lastName}`
                : ""
          }
          onClose={() => {
            setShowConfirmBox(false);
            if (roleDeleteRec) setRoleDeleteRec(undefined);
            if (deleteUserRec) setDeleteUserRec(undefined);
          }}
          onOk={
            deleteUserRec ? DeleteUser : roleDeleteRec ? unassignUserRole : null
          }
        />
      ) : null}
      {doaDialogOpen && (
        <DoaDialog
          userList={userList}
          doa={doa}
          doaCurrency={doaCurrency}
          userSelected={id}
          open={doaDialogOpen}
          onSuccess={() => {
            setDoaDialogOpen(false);
            fetchDoa();
          }}
          onClose={() => {
            setDoaDialogOpen(false);
          }}
        />
      )}

      {
        orgChartInFullScreenDialog && <FullScreenDialog
          heading="Org Chart"
          open={orgChartInFullScreenDialog}
          close={() => {
            setOrgChartInFullScreenDialog(false);
          }}
        >
          <OrgChartContainer data={orgChartData} onClick={(id) => {
            setOrgChartInFullScreenDialog(false);
            history.push(`${routes.userDetail.path}/${id}`)
          }} />
        </FullScreenDialog>
      }
    </>
  );
};

export default UserDetailsPage;
