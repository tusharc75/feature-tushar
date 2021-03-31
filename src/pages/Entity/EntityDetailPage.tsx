import { useState, useEffect, useContext } from "react";
import { Grid, Box, Button, Typography, IconButton } from "@material-ui/core";
import { ControlPoint } from "@material-ui/icons";
import { Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import { startCase } from "lodash";
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

const UserDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user },
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [loading, setLoading] = useState(false);
  const [globalRoles, setGloabalRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [userFields, setUserFIelds] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([
    routes.entity,
  ]);
  const [entitiesPermissions, setEntitiesPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });

  useEffect(() => {
    if (id) {
      getEntityFields();
      fetchEntityData();
      fetchEntityRoles();
    }
  }, [id]);

  useEffect(() => {
    const data = user?.role?.sideBar;

    if (data) {
      const hasEntityPermission = data.find((d) => d.name == "Entity");
      if (hasEntityPermission) {
        setEntitiesPermissions({
          isCreate: hasEntityPermission.isCreate,
          isUpdate: hasEntityPermission.isUpdate,
          isRead: hasEntityPermission.isRead,
          isDelete: hasEntityPermission.isDelete,
        });
      }
    }
  }, [user]);

  const fetchEntityData = async () => {
    setLoading(true);
    try {
      const {
        data: { data },
      } = await axiosInstance().get(`/entity/${id}`);

      handleMainPoints(data);
      setHeadingLbl(data.entityName);
      setUserData(data);
      setCustomizedRoutes([routes.entity, { title: data.entityName }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchEntityRoles = () => {
    setRolesLoading(true);
    axiosInstance()
      .get(`/role?Entity=${id}`)
      .then(({ data: { data } }) => {
        setGloabalRoles(data);
        setRolesLoading(false);
      })
      .catch((err) => {
        setRolesLoading(false);
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
        setUserFIelds(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDeleteEntity = () => {
    if (id) {
      if (entitiesPermissions.isDelete) {
        axiosInstance()
          .put(`/entity/remove`, { ids: [id] })
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
          handleUpdate={handleUpdateEntity}
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
            mainPoints={mainPoints}
            showHeading={true}
          >
            {entitiesPermissions.isUpdate ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenUpdateDialog}
              >
                Edit
              </Button>
            ) : null}
            <Box component="span" marginX={1} />
            {entitiesPermissions.isDelete ? (
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
                  <Typography color="primary">Entity Users</Typography>
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
          </BoxWithBorder>
        </Container>
      </Layout>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this entity ?`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDeleteEntity}
        />
      ) : null}
    </>
  );
};

export default UserDetailsPage;
