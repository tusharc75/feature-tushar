import React, { useState, useEffect, useContext } from "react";
import { Grid, Box, Button, Typography, IconButton, Container, Paper } from "@material-ui/core";
import { ControlPoint } from "@material-ui/icons";
import { Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";

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
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { FaEye } from 'react-icons/fa';
import {
  SET_USER,
  USER_LOADING,
  SET_SELECTED_ENTITY,
} from "../../StateProvider/actionTypes";
import AssignUserDialog from "../../components/AssignRolesDialog/AssignEntityDialog";
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
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [entityData, setEntityData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [entityFields, setEntityFIelds] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [deleteRoleRec, setDeleteRoleRec] = useState(null);
  const [userDeleteRec, setUserDeleteRec] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [showAssignUserDialog, setShowAssignUserDialog] = useState(false);
  const [openRolesDialog, setOpenRolesDialog] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([
    routes.entity,
  ]);
  const showRecordsBeforeViewAll = 2;
  const [showUsers, setShowUsers] = useState(showRecordsBeforeViewAll);
  const [showRegionalRoles, setShowRegionalRoles] = useState(showRecordsBeforeViewAll);

  useEffect(() => {
    if (id) {
      getEntityFields();
      fetchEntityData();
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

  const fetchEntityUser = () => {
    setUsersLoading(true);
    axiosInstance()
      .get(`/user?filterById=[{"field": "entities.entity", "term": "${id}"}]`)
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

  const handleUnassignUser = (rec) => {
    setUserDeleteRec(rec);
    setShowConfirmBox(true);
  };

  const unassignUserEntity = () => {
    if (userDeleteRec?._id) {
      const data = {
        user: userDeleteRec?._id,
        entities: userDeleteRec?.entities.filter(d => d.entity !== id)
      };
      axiosInstance()
        .put("/user/assign-entity", data)
        .then(() => {
          setShowConfirmBox(false);

          if ((showUsers - 1) >= 2) {
            setShowUsers(showUsers - 1)
          }

          fetchEntityUser();
          toastConfig.setToastConfig({
            message: "Successfully unassigned user",
            type: "success",
            open: true,
          });
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
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

  const userDialogOpen = () => {
    setShowAssignUserDialog(true);
  };

  const userDialogClose = () => {
    setShowAssignUserDialog(false);
  };

  return (
    <>
      {showAssignUserDialog && (
        <AssignUserDialog
          entitiesDialogOpen={showAssignUserDialog}
          handleCloseDialog={userDialogClose}
          type="user"
          ids={[id]}
          assignedEntity={users}
          regionalRole={false}
          onSuccess={() => {
            fetchEntityUser();
            userDialogClose();
          }}
        />
      )}
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
      <Layout>

        <Grid container direction="row">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
            <Paper>
              {!entityData ? (
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
                  mainPoints={mainPoints}
                  showHeading={true}
                >
                  {permissions?.entity?.isUpdate && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleOpenUpdateDialog}
                    >
                      Edit
                    </Button>
                  )}
                  {/* <Box component="span" marginX={1} />
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
                  )} */}
                </DetailsPageHeader>
              )}


              <Box>
                {loading || !entityFields.length ? (
                  <Grid container spacing={2} style={{ padding: "8px" }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <>
                    <Box
                      width="100%"
                      padding={1}
                      bgcolor="grey.200"
                      display="flex"
                      justifyContent="space-between"
                    >
                      <Typography variant="subtitle2">
                        Entity Detail
                  </Typography>
                    </Box>
                    <DetailsPage data={entityData} fields={entityFields} />
                  </>
                )}
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
                      Assigned Users ({users.length || 0})
                </Typography>
                    {permissions.entity.isUpdate && (
                      <IconButton
                        title="Assign users"
                        color="primary"
                        size="small"
                        onClick={userDialogOpen}
                      >
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
                          user={users.slice(0, showUsers)}
                          unassignEntity={handleUnassignUser}
                          selectedEntity={null}
                          type="entity"
                        />

                        <Box marginY={1} />
                        {
                          users.length > showRecordsBeforeViewAll &&
                          <Box className="btn-view gap-1" p={1} display="flex" justifyContent="center" alignItems="center"
                            onClick={() => history.push(`/user`, {
                              id: entityData._id,
                              name: entityData.entityName,
                              type: "entity"
                            })}>
                            <FaEye /> View All &#8599;
                          </Box>
                        }
                      </>
                    ) : (
                      <Box textAlign="center" padding={2}>
                        <Typography>No Users </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

      </Layout>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={
            userDeleteRec
              ? `Are you sure you want to un-assign user ${userDeleteRec.firstName} ${userDeleteRec.lastName}?`
              : `Are you sure you want to delete this entity ?`
          }
          onClose={() => {
            setDeleteRoleRec(null);
            setShowConfirmBox(false);
          }}
          onOk={
            userDeleteRec
              ? unassignUserEntity
              : handleDeleteEntity
          }
        />
      ) : null}
    </>
  );
};

export default EntityDetailsPage;
