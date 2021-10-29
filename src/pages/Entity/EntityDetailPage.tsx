import React, { useState, useEffect, useContext, Fragment } from "react";
import { Grid, Box, Button, Typography, IconButton, Paper, Dialog } from "@material-ui/core";
import { ControlPoint } from "@material-ui/icons";
import { Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import { useData } from "../../StateProvider/Provider";
import BoxWithBorder from "../../components/BoxWithBorder";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { FaEye } from 'react-icons/fa';
import {
  SET_USER,
  USER_LOADING,
  SET_SELECTED_ENTITY
} from "../../StateProvider/actionTypes";
import AssignUserDialog from "../../components/AssignRolesDialog/AssignEntityDialog";
import AssignedUsers from "./AssignedUsers";
import ManageEntity from "./ManageEntity";
import NewStepper from "../../components/Helpers/NewStepper";
import { isObjectEmpty } from "../../constants/helpers";
import DoaDialog from "../DoaSetup/ManageDoa/ManageDoaDialog";

const EntityDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions },
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
  const [userDeleteRec, setUserDeleteRec] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [showAssignUserDialog, setShowAssignUserDialog] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([
    routes.entity,
  ]);
  const showRecordsBeforeViewAll = 2;
  const [showUsers, setShowUsers] = useState(showRecordsBeforeViewAll);
  const [doa, setDoa] = useState<any[]>([]);
  const [doaCurrency, setDoaCurrency] = useState("");
  const [doaType, setDoaType] = useState(null);
  const [doaDialogOpen, setDoaDialogOpen] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);
  useEffect(() => {
    if (id) {
      getEntityFields();
      fetchEntityData();
      fetchEntityUser();
      fetchUsers();
      fetchDoa();
    }
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
        entities: userDeleteRec?.entities.filter(d => d.entity !== id),
        withoutRoleLookup: true
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

  const userDialogOpen = () => {
    setShowAssignUserDialog(true);
  };

  const userDialogClose = () => {
    setShowAssignUserDialog(false);
  };

  const fieldsToShowInDetailPage = entityFields.filter((field) => field.isRead);

  const fetchDoa = async () => {
    axiosInstance()
      .get(`/doa/${id}`)
      .then(({ data: { data } }) => {
        let doaData = [];

        data.doa.forEach((item) => {
          //  When the user set in doa was deleted, we are getting {} in array like this [{}]
          //  So added this check
          if (!isObjectEmpty(item)) {
            doaData.push({
              id: item.user?._id,
              name: [item.user?.firstName, item.user?.lastName].filter(f => f).join(" "),
              firstName: item.user?.firstName,
              lastName: item.user?.lastName,
              amount: item.amount,
            });
          }
        });

        setDoa(doaData);
        setDoaCurrency(data.doaCurrency)
        setDoaType(data.doaType)
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
        setDoa([]);
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

  return (
    <>
      {showAssignUserDialog && (
        <Dialog
          fullWidth
          maxWidth="sm"
          open={showAssignUserDialog}
          onClose={userDialogClose}
          aria-labelledby="assign-roles-dialog"
        >
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
        </Dialog>
      )}
      {openUpdateDialog && (
        <ManageEntity
          open={openUpdateDialog}
          close={closeUpdateDIalog}
          fetchData={() => {
            fetchEntityData();
          }}
          values={entityData}
          isNew={false}
        />
      )}
      <Fragment>

        <Grid container className="headerbox">
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
                    <DetailsPage data={entityData} fields={fieldsToShowInDetailPage} />
                  </>
                )}
              </Box>
              {
                <>
                  <Box>
                    <Box
                      width="100%"
                      padding={1}
                      bgcolor="grey.200"
                      display="flex"
                      justifyContent="space-between"
                    >
                      <Grid container>
                        <Grid item xs={8}>
                          <Box display="flex">
                            <Box padding="5px">
                              <Typography variant="subtitle2">
                                {"DOA Details "}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        <Grid item container xs={4} justify="flex-end">
                          {permissions.user.isUpdate && user?.user?.permissions?.doaSetup && (
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
                              Entity doesn't have any DOA
                            </Typography>
                          </Box>
                        )}
                      </BoxWithBorder>
                    </Grid>
                  </Grid>
                </>
              }
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} spacing={2}>
            <Paper style={{ overflow: 'hidden' }}>
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
                      type="entity"
                    />

                    <Box marginY={1} />
                    {
                      users.length > showRecordsBeforeViewAll &&
                      <Box className="btn-view gap-1" p={1} display="flex" justifyContent="center" alignItems="center"
                        onClick={() => history.push(`/user`, {
                          id: entityData._id,
                          name: entityData.entityName,
                          type: "entity",
                          text: "Entity"
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
            </Paper>
          </Grid>
        </Grid>

      </Fragment>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={
            userDeleteRec
              ? `Are you sure you want to un-assign user ${userDeleteRec.firstName} ${userDeleteRec.lastName}?`
              : `Are you sure you want to delete this entity ?`
          }
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={
            userDeleteRec
              ? unassignUserEntity
              : handleDeleteEntity
          }
        />
      ) : null}
      {doaDialogOpen && (
        <Dialog
          open={doaDialogOpen}
          onClose={() => {
            setDoaDialogOpen(false);
          }}
          scroll="body"
          maxWidth="md"
          fullWidth
        >
          <DoaDialog
            userList={userList}
            doa={doa}
            doaCurrency={doaCurrency}
            selectedEntity={[id]}
            open={doaDialogOpen}
            onSuccess={() => {
              setDoaDialogOpen(false);
              fetchDoa();
            }}
            onClose={() => {
              setDoaDialogOpen(false);
            }}
            doaType={doaType}
          />
        </Dialog>
      )}
    </>
  );
};

export default EntityDetailsPage;
