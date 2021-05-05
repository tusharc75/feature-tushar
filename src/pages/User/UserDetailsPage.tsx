import React, { useState, useEffect, useContext } from "react";
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
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Tooltip,
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
import UpdateDetailsDialog from "../../components/Shared/UpdateDetailsDialog";
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
import ProductBuilderInAccordion from "../../components/ProductBuilderInAccordion/ProductBuilderInAccordion";
import OpportunityAccordionInUserDetail from "./OpportunityAccordionInUserDetail";
import LeadAccordionInUserDetailPage from "./LeadAccordionInUserDetailPage";
import AccountAccordionDetail from "./AccountAccordionInDetail";
import ContactAccordionInDetailPage from "./ContactAccordionInDetailPage";

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
  const [userRelatedLoading, setUserRelatedLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [leadsRelatedData, setLeadsRelatedData] = useState(null);
  const [opportunityRelatedData, setOpportunityRelatedData] = useState(null);
  const [customerContactRelatedData, setCustomerContactRelatedData] = useState(null);
  const [customerAccountRelatedData, setCustomerAccountRelatedData] = useState(null);
  const [supplierAccountRelatedData, setSupplierAccountRelatedData] = useState(null);
  const [supplierContactRelatedData, setSupplierContactRelatedData] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [unionRoleData, setUnionRoleData] = useState(null);

  const [isChangingPermission, setIsChangingPermission] = useState(false);
  const [hasPermissionToUpdateApprovalProcess, setHasPermissionToUpdateApprovalProcess] = useState(permissions.user.isUpdate && user?.user?.userType === userType.brandAdmin);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [deleteUserRec, setDeleteUserRec] = useState(undefined);
  const [roleDeleteRec, setRoleDeleteRec] = useState(undefined);
  const [userFields, setUserFIelds] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.user]);
  const [doa, setDoa] = useState<any[]>([]);
  const [doaCurrency, setDoaCurrency] = useState("");
  const [doaDialogOpen, setDoaDialogOpen] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      getUserFields();
      fetchUserData();
      getRoleUnion();
      fetchUserRoles();
      fetchDoa();
      fetchUsers()
      fetchUserRelatedDetail()
    }
    // eslint-disable-next-line
  }, [id]);

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
      setCustomizedRoutes([
        routes.user,
        { title: `${data.firstName} ${data.lastName}` },
      ]);
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

  const fetchUserRoles = () => {
    setRolesLoading(true);
    axiosInstance()
      .get(`/role?user=${id}`)
      .then(({ data: { data } }) => {
        setGloabalRoles(data.filter((d) => d?.type === 1)); // global role --- type 1
        setRolesLoading(false);
      })
      .catch((error) => {
        setRolesLoading(false);
        toastConfig.setToastConfig(error);
      });
  };
  const fetchUserRelatedDetail = () => {
    setUserRelatedLoading(true);
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
        setUserRelatedLoading(false);
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

  const handleUpdateUser = (values) => {
    setUpdating(true);

    axiosInstance()
      .put(`/user`, { ...values, _id: id })
      .then(({ data }) => {
        fetchUserData();
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        setUserPermissions(data.permissions);
        setUpdating(false);
        closeUpdateDIalog();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setUpdating(false);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDIalog = () => {
    setOpenUpdateDialog(false);
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
        .post("/role/un-assign-role", data)
        .then(() => {
          setShowConfirmBox(false);
          fetchUserData();
          fetchUserRoles();
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
        <UpdateDetailsDialog
          title="Update"
          openDialog={openUpdateDialog}
          onClose={closeUpdateDIalog}
          data={userData}
          fields={userFields}
          isUpdating={isUpdating}
          handleUpdate={handleUpdateUser}
        />
      )}
      {rolesDialogOpen && (
        <AssignRolesDialog
          rolesDialogOpen={rolesDialogOpen}
          handleCloseDialog={handleCloseDialog}
          userIds={[id]}
          assignedRoles={globalRoles}
          onSuccess={() => {
            handleCloseDialog();
            getRoleUnion();
            fetchUserRoles();
          }}
        />
      )}
      <Layout>

        <Grid container direction="row">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
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
                      onClick={handleOpenUpdateDialog}
                    >
                      Edit
                    </Button>
                  ) : null}
                  <Box component="span" marginX={1} />

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
                  <DetailsPage data={userData} fields={userFields} />
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
                      <TableContainer style={{ height: "352px" }}>
                        <Table
                          stickyHeader
                          aria-label="roles"
                          className="roles-table"
                        >
                          <TableHead>
                            <TableRow>
                              <TableCell>Names</TableCell>
                              <TableCell>Read</TableCell>
                              <TableCell>Create</TableCell>
                              <TableCell>Update</TableCell>
                              <TableCell>Delete</TableCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            <RoleEngine
                              field={unionRoleData ? unionRoleData.field : []}
                              resource={unionRoleData ? unionRoleData.resource : []}
                              isDisable={true}
                            />
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </BoxWithBorder>
                  </Grid>
                </Grid>
              </Box>

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
                        <Grid item xs={4} container justify="flex-end">
                          {permissions.user.isUpdate && (
                            <Button
                              variant="contained"
                              color="primary"
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
                opportunities={(opportunityRelatedData?.Owner && opportunityRelatedData?.Collaborator) ? [...opportunityRelatedData?.Owner, ...opportunityRelatedData?.Collaborator] : opportunityRelatedData?.Owner}
                recordsPerLine={2}
                expanded={false}
              />
              <LeadAccordionInUserDetailPage
                leads={(leadsRelatedData?.Owner && leadsRelatedData?.Collaborator) ? [...leadsRelatedData?.Owner, ...leadsRelatedData?.Collaborator] : leadsRelatedData?.Owner}
                recordsPerLine={2}
                expanded={false}
              />
              <AccountAccordionDetail
                type="customer"
                account={(customerAccountRelatedData?.Owner && customerAccountRelatedData?.Collaborator) ? [...customerAccountRelatedData.Owner, ...customerAccountRelatedData.Collaborator] : customerAccountRelatedData?.Owner}
                recordsPerLine={2}
                expanded={false}
              />
              <AccountAccordionDetail
                type="supplier"
                account={(supplierAccountRelatedData?.Owner && supplierAccountRelatedData?.Collaborator) ? [...supplierAccountRelatedData.Owner, ...supplierAccountRelatedData.Collaborator] : supplierAccountRelatedData?.Owner}
                recordsPerLine={2}
                expanded={false}
              />
              <ContactAccordionInDetailPage
                type="customer"
                contact={(customerContactRelatedData?.Owner && customerContactRelatedData?.Collaborator) ? [...customerContactRelatedData.Owner, ...customerContactRelatedData.Collaborator] : customerContactRelatedData?.Owner}
                recordsPerLine={2}
                expanded={false}
              />
              <ContactAccordionInDetailPage
                type="supplier"
                contact={(supplierContactRelatedData?.Owner && supplierContactRelatedData?.Collaborator) ? [...supplierContactRelatedData.Owner, ...supplierContactRelatedData.Collaborator] : supplierContactRelatedData?.Owner}
                recordsPerLine={2}
                expanded={false}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} spacing={2}>
            <Paper>
              <Box width="100%" padding={1} bgcolor="grey.200">
                <Typography color="primary">Approval Process</Typography>
              </Box>

              <Box padding={1}>
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
                            label={key == "doaSetup" ? "DOA Setup" : startCase(key)}
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
    </>
  );
};

export default UserDetailsPage;
