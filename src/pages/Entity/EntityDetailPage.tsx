import { useState, useEffect, useContext } from "react";
import { Grid, Box, Button, Typography, IconButton } from "@material-ui/core";
import { ControlPoint } from "@material-ui/icons";
import { Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";

import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import Container from "../../components/Container";
import routes from "../../components/Helpers/Routes";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import UpdateDetailsDialog from "../../components/Shared/UpdateDetailsDialog";
import { useData } from "../../StateProvider/Provider";
import BoxWithBorder from "../../components/BoxWithBorder";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import DeleteButton from "../../components/Helpers/DeleteButton";
import Roles from "./Roles";
import {
  SET_USER,
  USER_LOADING,
  SET_SELECTED_ENTITY,
} from "../../StateProvider/actionTypes";
import AssignRolesDialog from "../../components/AssignRolesDialog/AssignEntityDialog";
import AssignedUsers from "./AssignedUsers";

const EntityDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions, selectedEntity },
    dispatch,
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [entityData, setEntityData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [entityFields, setEntityFIelds] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [deleteRoleRec, setDeleteRoleRec] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openRolesDialog, setOpenRolesDialog] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([
    routes.entity,
  ]);

  useEffect(() => {
    if (id) {
      getEntityFields();
      fetchEntityData();
      fetchEntityRoles();
      fetchEntityUser();
    }
    // eslint-disable-next-line
  }, [id]);

  const fetchEntityData = async () => {
    setLoading(true);
    try {
      const {
        data: { data },
      } = await axiosInstance().get(`/entity/${id}`);

      handleMainPoints(data);
      setHeadingLbl(data.entityName);
      setEntityData(data);
      setCustomizedRoutes([routes.entity, { title: data.entityName }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchEntityRoles = () => {
    setRolesLoading(true);
    axiosInstance()
      .get(`/role?entity=${id}`)
      .then(({ data: { data } }) => {
        setRoles(data.slice(0, 4));
        setRolesLoading(false);
      })
      .catch((err) => {
        setRolesLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const fetchEntityUser = () => {
    setUsersLoading(true);
    axiosInstance()
      .get(`/entity/user/${id}`)
      .then(({ data: { data } }) => {
        setUsers(data);
        setUsersLoading(false);
      })
      .catch((err) => {
        setUsersLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      name: `${data.entityName}`,
      taxJurisdiction: data.taxJurisdiction || "",
    };
    setMainPoints(tempMp);
  };

  const getEntityFields = () => {
    axiosInstance()
      .get("/field?resource=Entity")
      .then(({ data }) => {
        setEntityFIelds(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDeleteEntity = () => {
    if (id) {
      if (permissions?.entity?.isDelete) {
        axiosInstance()
          .put(`/entity/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);
            fetchUserData();
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

  const fetchUserData = () => {
    dispatch({ type: USER_LOADING, payload: true });
    axiosInstance()
      .get("/user/me")
      .then(({ data: response }) => {
        const { data } = response;
        dispatch({ type: SET_USER, payload: data });
        if (data?.role?.selectedEntity?._id) {
          dispatch({
            type: SET_SELECTED_ENTITY,
            payload: data.role.selectedEntity._id,
          });
        }
        dispatch({ type: USER_LOADING, payload: false });
      })
      .catch((err) => {
        localStorage.setItem("token", "");
        dispatch({ type: USER_LOADING, payload: false });
      });
  };

  const handleUpdateEntity = (values) => {
    setUpdating(true);

    axiosInstance()
      .put(`/entity`, { _id: id, ...values })
      .then(({ data }) => {
        fetchEntityData();
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        setUpdating(false);
        closeUpdateDIalog();
        fetchUserData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setUpdating(false);
      });
  };

  const handleUnassignRole = (roleRec) => {
    setShowConfirmBox(true);
    setDeleteRoleRec(roleRec);
  };

  const unassignRole = () => {
    if (deleteRoleRec && deleteRoleRec._id) {
      axiosInstance()
        .put(`/entity/remove-role`, { entities: [id], role: deleteRoleRec._id })
        .then(({ data }) => {
          fetchEntityRoles();
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setShowConfirmBox(false);
          fetchUserData();
        })
        .catch((error) => {
          setShowConfirmBox(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDIalog = () => {
    setOpenUpdateDialog(false);
  };

  const handleOpenRolesDialog = () => {
    setOpenRolesDialog(true);
  };

  const closeRolesDIalog = () => {
    setOpenRolesDialog(false);
  };

  return (
    <>
      {openUpdateDialog && (
        <UpdateDetailsDialog
          title="Update"
          openDialog={openUpdateDialog}
          onClose={closeUpdateDIalog}
          data={entityData}
          fields={entityFields}
          isUpdating={isUpdating}
          handleUpdate={handleUpdateEntity}
        />
      )}
      {openRolesDialog && (
        <AssignRolesDialog
          entitiesDialogOpen={openRolesDialog}
          handleCloseDialog={closeRolesDIalog}
          type="role"
          ids={[id]}
          onSuccess={() => {
            fetchEntityRoles();
            closeRolesDIalog();
          }}
        />
      )}
      <Layout>
        <Grid container direction="row">
          <Grid item xs={12}>
            <CustomBreadCrumbs routes={customizedRoutes} />
          </Grid>
        </Grid>
        {!entityData ? (
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
            mainPoints={mainPoints}
            showHeading={true}
          >
            {permissions?.entity?.isUpdate && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenUpdateDialog}
              >
                Edit
              </Button>
            )}
            <Box component="span" marginX={1} />

            {permissions?.entity?.isDelete && (
              <span
                title={
                  selectedEntity === id
                    ? "Primarily selected entity can't be deleted"
                    : "Permanently delete this entity"
                }
              >
                <DeleteButton
                  disabled={selectedEntity === id}
                  text="Delete"
                  onClick={() => setShowConfirmBox(true)}
                />
              </span>
            )}
          </DetailsPageHeader>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={8} lg={8}>
            <Container styles={{ borderRadius: "8px" }}>
              <Box style={{ padding: "8px", minHeight: "450px" }}>
                {loading || !entityFields.length ? (
                  <Grid container spacing={2} style={{ padding: "8px" }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <DetailsPage data={entityData} fields={entityFields} />
                )}
              </Box>
            </Container>
            <Box marginY={2} />
            <Container>
              <Box
                width="100%"
                padding={1}
                bgcolor="grey.200"
                display="flex"
                justifyContent="space-between"
              >
                <Typography variant="subtitle2">
                  Assigned Users ({users.length || 0})
                </Typography>
                {permissions.entity.isUpdate && (
                  <IconButton title="Assign users" color="primary" size="small">
                    <ControlPoint />
                  </IconButton>
                )}
              </Box>
              <Box padding={1}>
                {usersLoading ? (
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
                ) : users.length ? (
                  <>
                    <AssignedUsers
                      permissions={permissions}
                      data={users.slice(0, 2)}
                      unassignUser={() => {}}
                    />

                    <Box marginY={1} />
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => history.push("/user")}
                    >
                      View All
                    </Button>
                  </>
                ) : (
                  <Box textAlign="center" padding={2}>
                    <Typography>No Users </Typography>
                  </Box>
                )}
              </Box>
            </Container>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4}>
            <Container styles={{ borderRadius: "8px" }}>
              <Box style={{ padding: "0px", maxHeight: "450px" }}>
                <Box
                  width="100%"
                  padding={1}
                  bgcolor="grey.200"
                  display="flex"
                  justifyContent="space-between"
                >
                  <Typography variant="subtitle2">
                    Assigned Regional Roles ({roles.length || 0})
                  </Typography>

                  <IconButton
                    disabled={!permissions.role.isUpdate}
                    color="primary"
                    size="small"
                    onClick={handleOpenRolesDialog}
                  >
                    <ControlPoint />
                  </IconButton>
                </Box>
                <Box padding={1}>
                  {rolesLoading ? (
                    [1, 2].map((i) => (
                      <BoxWithBorder key={i} style={{ marginBottom: "8px" }}>
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
                  ) : roles.length ? (
                    <>
                      <Roles
                        permissions={permissions}
                        data={roles}
                        unassignRole={handleUnassignRole}
                      />
                      <Box marginY={1} />
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => history.push("/role")}
                      >
                        View All
                      </Button>
                    </>
                  ) : (
                    <Box textAlign="center" padding={2}>
                      No Assigned Roles
                    </Box>
                  )}
                </Box>
              </Box>
            </Container>
          </Grid>
        </Grid>
      </Layout>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={
            deleteRoleRec
              ? `Are you sure you want to un-assign role ${deleteRoleRec.name} from entity ${entityData.entityName}`
              : `Are you sure you want to delete this entity ?`
          }
          onClose={() => {
            setDeleteRoleRec(null);
            setShowConfirmBox(false);
          }}
          onOk={deleteRoleRec ? unassignRole : handleDeleteEntity}
        />
      ) : null}
    </>
  );
};

export default EntityDetailsPage;
