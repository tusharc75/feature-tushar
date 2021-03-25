import { useState, useEffect } from "react";
import { Grid, Box, Button } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import { capitalize } from "lodash";
import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import Container from "../../components/Container";
import routes from "../../components/Helpers/Routes";
import CustomToast from "../../components/Helpers/CustomToast";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import CustomHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import UpdateDetailsDialog from "../../components/Shared/UpdateDetailsDialog";
import { useData } from "../../StateProvider/Provider";
import { removeEmptyKeys } from "../../constants/helpers";
import { CustomEventEmitter } from './../../axios/events';

const UserDetailsPage = () => {
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user },
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [alertData, setAlertData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [userFields, setUserFIelds] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.user]);
  const [usersPermissions, setUsersPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });

  useEffect(() => {
    if (id) {
      fetchUserData();
      getUserFields();
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
      handleAllowToEditList(data);
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

  const handleMainPoints = (data) => {
    let tempMp = {
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

  const handleAllowToEditList = (userDetails: any) => {
    const userId = user?.user?._id;
    let allowToEdit = false;

    if (userId) {
      allowToEdit = usersPermissions.isUpdate ? true : false;

      if (allowToEdit) setAllowedToEdit(allowToEdit);
    }
  };

  const handleDeleteUser = () => {
    if (id) {
      if (usersPermissions.isDelete) {
        axiosInstance()
          .delete(`/user/${id}`)
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
        CustomEventEmitter.dispatch("show-toast", { type: "success", errorMsg: "Successfully saved" });
        setUpdating(false);
      })
      .catch((err) => {
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
          <CustomHeader
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
          </CustomHeader>
        )}

        <div>
          <Grid
            container
            spacing={2}
            style={{ minHeight: "calc(100vh - 200px)" }}
          >
            <Grid item xs={12} sm={12} md={8} lg={8}>
              <Container>
                {loading ? (
                  <Grid container spacing={2}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <Grid item sm={6} md={6}>
                        <Skeleton variant="text" width="100px" height="16px" />
                        <Box marginY={1} />
                        <Skeleton width="100%" height="50px" />
                      </Grid>
                    ))}
                  </Grid>
                ) : !userFields.length ? (
                  <Box
                    height="100%"
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <p>No Fields</p>
                  </Box>
                ) : (
                  <DetailsPage data={userData} fields={userFields} />
                )}
              </Container>
            </Grid>
            <Grid item xs={12} sm={12} md={4} lg={4}>
              <Container>
                <p>Some Data</p>
              </Container>
            </Grid>
          </Grid>
        </div>
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
