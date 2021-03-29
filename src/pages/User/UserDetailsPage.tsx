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
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@material-ui/core";
import { ControlPoint } from "@material-ui/icons";
import { Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import { capitalize, startCase } from "lodash";
import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import Container from "../../components/Container";
import routes from "../../components/Helpers/Routes";
import CustomToast from "../../components/Helpers/CustomToast";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import UpdateDetailsDialog from "../../components/Shared/UpdateDetailsDialog";
import { useData } from "../../StateProvider/Provider";
import { removeEmptyKeys } from "../../constants/helpers";
import BoxWithBorder from "../../components/BoxWithBorder";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import UserRoles from "./UserRoles";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";

const UserDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext)

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user },
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [alertData, setAlertData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [globalRoles, setGloabalRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [isChangingPermission, setChangingPermission] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [userFields, setUserFIelds] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.user]);
  const [usersPermissions, setUsersPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });

  useEffect(() => {
    if (id) {
      getUserFields();
      fetchUserData();
      fetchUserRoles();
    }
  }, [id]);

  useEffect(() => {
    const data = user?.role?.sideBar;

    if (data) {
      const hasUsersPermission = data.find((d) => d.name == "User");
      if (hasUsersPermission) {
        setUsersPermissions({
          isCreate: hasUsersPermission.isCreate,
          isUpdate: hasUsersPermission.isUpdate,
          isRead: hasUsersPermission.isRead,
          isDelete: hasUsersPermission.isDelete,
        });
      }
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const {
        data: { data },
      } = await axiosInstance().get(`/user/${id}`);

      handleMainPoints(data);
      let name = capitalize(data.firstName || "") + " ";
      name = name + capitalize(data.lastName || "");

      setHeadingLbl(name);
      setUserData(data);
      setCustomizedRoutes([
        routes.user,
        { title: `${data.firstName} ${data.lastName}` },
      ]);
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchUserRoles = () => {
    setRolesLoading(true);
    axiosInstance()
      .get(`/role?User=${id}`)
      .then(({ data: { data } }) => {
        setGloabalRoles(data);
        setRolesLoading(false);
      })
      .catch((err) => {
        setRolesLoading(false);
        console.log(err);
      });
  };

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
      });
  };

  const handleDeleteUser = () => {
    if (id) {
      if (usersPermissions.isDelete) {
        axiosInstance()
          .put(`/user/remove`, { ids: [id] })
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
      .put(`/user/${id}`, values)
      .then(({ data }) => {
        fetchUserData();
        toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
        setUserPermissions(data.permissions);
        setUpdating(false);
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
    setChangingPermission(true);
    axiosInstance()
      .post("/user/permission-setup", newData)
      .then(({ data }) => {
        setChangingPermission(false);
        toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
      }).catch((err) => {
        setChangingPermission(false);
        toastConfig.setToastConfig(err);
      });
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

      <Layout>
        <Grid container direction="row">
          <Grid item xs={12} className="pl-2">
            <CustomBreadCrumbs routes={customizedRoutes} />
          </Grid>
        </Grid>
        {!userData ? (
          <Container>
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
          </Container>
        ) : (
          <DetailsPageHeader
            heading={headingLbl}
            logo={userData?.avatar ? userData.avatar : undefined}
            mainPoints={mainPoints}
            showHeading={true}
          >
            {usersPermissions.isUpdate ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenUpdateDialog}
              >
                Edit
              </Button>
            ) : null}
            <Box component="span" marginX={1} />
            {usersPermissions.isDelete ? (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setShowConfirmBox(true)}
              >
                Delete
              </Button>
            ) : null}
          </DetailsPageHeader>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={8} lg={8}>
            <Container styles={{ padding: "8px" }}>
              <BoxWithBorder style={{ padding: "8px", minHeight: "450px" }}>
                {loading || !userFields.length ? (
                  <Grid container spacing={2} style={{ padding: "8px" }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <DetailsPage data={userData} fields={userFields} />
                )}
              </BoxWithBorder>
            </Container>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4}>
            <Container styles={{ padding: "8px" }}>
              <BoxWithBorder style={{ padding: "0px", minHeight: "450px" }}>
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
                          <FormControlLabel
                            key={key}
                            control={
                              <Switch
                                checked={userPermissions[key]}
                                name={key}
                                disabled={isChangingPermission}
                                onChange={handleChangePermissions}
                              />
                            }
                            label={startCase(key)}
                          />
                        ))
                      ) : (
                        <Typography>There are no permissions</Typography>
                      )}
                    </FormGroup>
                  </FormControl>
                </Box>
              </BoxWithBorder>
            </Container>
          </Grid>
        </Grid>
        <Box marginY={1} />
        <Container styles={{ padding: "8px" }}>
          <BoxWithBorder style={{ padding: "0px", minHeight: "300px" }}>
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
                  <IconButton color="primary" size="small">
                    <ControlPoint />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>

            <Grid container style={{ padding: "10px" }} spacing={1}>
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
                        styles={{ padding: "0px", margin: "8px 8px" }}
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
                        <UserRoles data={globalRoles} unassignRole={() => { }} />
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
                  <TableContainer>
                    <Table stickyHeader aria-label="roles">
                      <TableHead>
                        <TableRow>
                          <TableCell>Names</TableCell>
                          <TableCell>Read</TableCell>
                          <TableCell>Create</TableCell>
                          <TableCell>Update</TableCell>
                          <TableCell>Delete</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody></TableBody>
                    </Table>
                  </TableContainer>
                </BoxWithBorder>
              </Grid>
            </Grid>
          </BoxWithBorder>
        </Container>
      </Layout>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this User ?`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDeleteUser}
        />
      ) : null}
    </>
  );
};

export default UserDetailsPage;
