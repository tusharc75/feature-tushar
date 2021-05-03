import { useState, useContext, useCallback, useEffect } from "react";
import {
  Grid,
  Paper,
  Box,
  Button,
  Typography,
  IconButton,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { ControlPoint } from "@material-ui/icons";
import { useParams, useHistory } from "react-router-dom";

import TeamUsers from "./TeamUsers";
import Layout from "../../components/Layout";
import axiosInstance from "../../axios/axiosInstance";
import { useData } from "../../StateProvider/Provider";
import routes from "../../components/Helpers/Routes";
import BoxWithBorder from "../../components/BoxWithBorder";
import DetailsPage from "../../components/Shared/DetailsPage";
import DeleteButton from "../../components/Helpers/DeleteButton";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import UpdateDetailsDialog from "../../components/Shared/UpdateDetailsDialog";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import AssignTeamUsers from "./AssignTeamUsers";
import CustomerStrategy from "./CustomerStrategy";

const ProjectSalesDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions },
  }: any = useData();
  const [loading, setLoading] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [projectSalesData, setProjectSalesData] = useState(null);
  const [projectSalesFields, setProjectSalesFields] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [teamUsersLoading, setTeamUsersLoading] = useState(false);
  const [headingLbl, setHeadingLbl] = useState("");
  const [mainPoints, setMainPoints] = useState(null);
  const [deleteRec, setDeleteRec] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openUsersDialog, setOpenUsersDialog] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([
    routes.projectSales,
  ]);

  /**
   * Get sales strategy data for paticular ID
   */
  const getSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { data },
      } = await axiosInstance().get(`/project-sales/${id}`);

      handleMainPoints(data);
      const name = data.projectName;
      setHeadingLbl(name);
      setProjectSalesData(data);
      setCustomizedRoutes([routes.projectSales, { title: data.projectName }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  }, [id]);

  useEffect(() => {
    getSalesData();
    getProjectFields();
  }, [id]);

  const getProjectFields = () => {
    axiosInstance()
      .get("/field?resource=Project Sales")
      .then(({ data }) => {
        setProjectSalesFields(data.data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      projectName: data.projectName || "",
      endDate: new Date(data.endDate).toDateString() || "",
      value: data.value || "",
      projectProbability: `${data.projectProbability}` || "",
      opportunityOwner: data.opportunityOwner?.optionLabel || "",
    };
    setMainPoints(tempMp);
  };

  /**
   * Handle updating the project data
   * @param values
   */
  const handleUpdateProject = (values) => {
    setUpdating(true);

    axiosInstance()
      .put(`/project-sales`, { ...values, _id: id })
      .then(({ data }) => {
        getSalesData();
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

  /**
   * Update Dialog For Sales Data
   */
  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDIalog = () => {
    setOpenUpdateDialog(false);
  };

  /**
   * Handle Delete Sales Data
   * @param id
   */
  const handleDeleteProject = (id) => {
    setDeleteRec(id);
    setShowConfirmBox(true);
  };

  const DeleteProject = () => {
    if (deleteRec) {
      axiosInstance()
        .put(`/project-sales/remove`, { ids: [deleteRec] })
        .then(({ data }) => {
          setShowConfirmBox(false);
          history.goBack();
        })
        .catch((err) => {
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  /**
   * Handle Open Users Dialog For Teams
   */
  const handleOpenUserDialog = () => {
    setOpenUsersDialog(true);
  };

  const handleCloseUserDialog = () => {
    setOpenUsersDialog(false);
  };

  return (
    <>
      {openUpdateDialog && (
        <UpdateDetailsDialog
          title="Update"
          openDialog={openUpdateDialog}
          onClose={closeUpdateDIalog}
          data={projectSalesData}
          fields={projectSalesFields}
          isUpdating={isUpdating}
          handleUpdate={handleUpdateProject}
        />
      )}
      {openUsersDialog && (
        <AssignTeamUsers
          usersDialogOpen={openUsersDialog}
          onSuccess={() => {}}
          handleCloseDialog={handleCloseUserDialog}
          ids={[id]}
        />
      )}
      <Layout>
        <CustomBreadCrumbs routes={customizedRoutes} />

        <div className="detail-container">
          {" "}
          <Grid container spacing={1}>
            <Grid item xs={12} sm={12} md={8} lg={8}>
              <Paper>
                {!projectSalesData ? (
                  <Box padding={1}>
                    <Skeleton variant="text" width="150px" height="30px" />
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
                  </Box>
                ) : (
                  <DetailsPageHeader
                    heading={headingLbl}
                    logo={undefined}
                    mainPoints={mainPoints}
                    showHeading={true}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleOpenUpdateDialog}
                    >
                      Edit
                    </Button>

                    <Box component="span" marginX={1} />

                    <DeleteButton
                      text="Delete"
                      onClick={() => {
                        handleDeleteProject(id);
                      }}
                    />
                  </DetailsPageHeader>
                )}
                <Box>
                  {loading ||
                  !projectSalesFields.length ||
                  !projectSalesData ? (
                    <Grid container spacing={2} style={{ padding: "16px" }}>
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
                          Sales Strategy
                        </Typography>
                      </Box>
                      <DetailsPage
                        data={projectSalesData}
                        fields={projectSalesFields}
                      />
                    </>
                  )}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={12} md={4} lg={4}>
              <Paper style={{ overflow: "hidden" }}>
                <Box style={{ padding: "0px", maxHeight: "450px" }}>
                  <Box
                    width="100%"
                    padding={1}
                    bgcolor="grey.200"
                    display="flex"
                    justifyContent="space-between"
                  >
                    <Typography variant="subtitle2">Project Team</Typography>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={handleOpenUserDialog}
                    >
                      <ControlPoint />
                    </IconButton>
                  </Box>
                  <Box padding={1}>
                    {teamUsersLoading ? (
                      [1, 2].map((i) => (
                        <BoxWithBorder key={i} style={{ marginBottom: "8px" }}>
                          <Box padding={1}>
                            <Skeleton
                              variant="text"
                              width="100px"
                              height="20px"
                            />
                            <Box marginTop={1} />
                            <Skeleton
                              variant="text"
                              width="100%"
                              height="15px"
                            />
                          </Box>
                        </BoxWithBorder>
                      ))
                    ) : teamUsers.length ? (
                      <>
                        <TeamUsers permissions={permissions} data={teamUsers} />
                        <Box marginY={1} />
                      </>
                    ) : (
                      <Box textAlign="center" padding={2}>
                        No Users
                      </Box>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          <Box my={1} />
          <CustomerStrategy />
        </div>
      </Layout>

      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={
            deleteRec
              ? `Are you sure you want to delete this sales strategy ${projectSalesData.projectName}`
              : ""
          }
          onClose={() => {
            setShowConfirmBox(false);
            if (deleteRec) setDeleteRec(null);
          }}
          onOk={deleteRec ? DeleteProject : null}
        />
      ) : null}
    </>
  );
};

export default ProjectSalesDetails;
