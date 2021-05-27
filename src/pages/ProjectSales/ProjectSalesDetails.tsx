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
import { useParams, useHistory, useLocation } from "react-router-dom";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

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
import AssignDataDialog from "./AssignDataDialog";
import CustomerAccounts from "./CustomerAccounts";
import CustomNodalStructure from "../../components/CustomNodalStructure/CustomNodalStructure";
import { formatAmountWithCurrency } from "../../constants/helpers";

const ProjectSalesDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const { state } = useLocation();
  const {
    state: { user, permissions },
  }: any = useData();
  const [loading, setLoading] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [projectSalesData, setProjectSalesData] = useState(null);
  const [projectSalesFields, setProjectSalesFields] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [customerContacts, setCustomerContacts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState("");
  const [headingLbl, setHeadingLbl] = useState("");
  const [mainPoints, setMainPoints] = useState(null);
  const [deleteRec, setDeleteRec] = useState(null);
  const [removeUserRec, setRemoveUserRec] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState("");
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([
    routes.projectSales,
  ]);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [loadingGraphData, setLoadingGraphData] = useState(false);
  const [graphData, setGraphData] = useState({
    edges: [],
    nodes: [],
    colorPalette: null,
  });

  // useEffect(() => {
  //   if (!state) return;

  //   axiosInstance()
  //     .put(`/project-sales/add-user`, { user: [state.managerId], _id: id })
  //     .then(() => { })
  //     .catch((error) => {
  //       toastConfig.setToastConfig(error);
  //     });
  // }, []);

  useEffect(() => {
    //  When it is nodal structure tab
    initializeGraphData();

    return () => {
      setGraphData({ edges: [], nodes: [], colorPalette: null });
    };
  }, [currentTabIndex]);

  const initializeGraphData = () => {
    if (currentTabIndex === 1) {
      setLoadingGraphData(true);
      axiosInstance()
        .get(`/project-sales/nodal-structure/${id}`)
        .then(({ data }) => {
          setLoadingGraphData(false);
          setGraphData({
            nodes: data.data.nodes,
            edges: data.data.edges,
            colorPalette: data.colorPalette,
          });
        })
        .catch((error) => {
          setLoadingGraphData(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  /**
   * Get sales strategy data for paticular ID
   */
  const getSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { data },
      } = await axiosInstance().get(`/project-sales/${id}`);

      data.amount = formatAmountWithCurrency(data.currency, data.amount);
      data.value = formatAmountWithCurrency(data.currency, data.value);

      setProjectSalesData(data);
      setCurrentTabIndex(0);
      handleMainPoints(data);
      const name = data.projectName;

      setHeadingLbl(name);
      setCustomizedRoutes([routes.projectSales, { title: data.projectName }]);
      setTeamUsers(data.staticData?.user);
      setCustomerAccounts(data.staticData?.customerAccount);
      setOpportunities(data.staticData?.opportunity);
      setCustomerContacts(data.staticData?.customerContact);
      initializeGraphData();
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
      .then(({ data: { data } }) => {
        setProjectSalesFields(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      ["Project Name"]: data.projectName || "",
      ["End Date"]: data.endDate ? new Date(data.endDate).toDateString() : "",
      ["Value"]: data.value || "",
      ["Project Probability"]: data?.projectProbability
        ? `${data.projectProbability}%`
        : "",
      ["Opportunity Owner"]: data.opportunityOwner?.optionLabel || "",
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
   * Handle Remove Users
   */
  const handleRemoveUser = (rec) => {
    setRemoveUserRec(rec);
    setShowConfirmBox(true);
  };

  const RemoveUser = () => {
    if (removeUserRec) {
      const dataObj = {
        user: teamUsers
          .filter((user) => user._id !== removeUserRec._id)
          .map((user) => user._id),
        _id: id,
      };

      axiosInstance()
        .put(`/project-sales/add-user`, dataObj)
        .then(() => {
          getSalesData();
          setShowConfirmBox(false);
        })
        .catch((error) => {
          setShowConfirmBox(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  /**
   * Handle Open Users Dialog For Teams
   */
  const handleOpenDialog = (type: string, id: string = "") => {
    setOpenDialog(true);
    setDialogType(type);
    setCurrentAccountId(id);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogType("");
  };

  const getExisitingData = () => {
    switch (dialogType) {
      case "user":
        return teamUsers.length ? teamUsers.map((t) => t._id) : [];
      case "customer-account":
        return customerAccounts.length
          ? customerAccounts.map((t) => t._id)
          : [];
      case "customer-contact":
        return customerContacts.length
          ? customerContacts.map((t) => t._id)
          : [];
      case "opportunity":
        return opportunities.length ? opportunities.map((t) => t._id) : [];

      default:
        return [];
    }
  };

  const isTeamMember = Boolean(teamUsers.find((u) => u._id === user.user._id));
  const isManager =
    user.user._id === projectSalesData?.projectManager?.optionValue;

  return (
    <>
      {openUpdateDialog && (
        <UpdateDetailsDialog
          title={`Update ${projectSalesData?.projectName}`}
          openDialog={openUpdateDialog}
          onClose={closeUpdateDIalog}
          data={projectSalesData}
          fields={projectSalesFields}
          isUpdating={isUpdating}
          handleUpdate={handleUpdateProject}
          isProjectSales={true}
        />
      )}
      {openDialog && (
        <AssignDataDialog
          dialogOpen={openDialog}
          onSuccess={() => {
            handleCloseDialog();
            getSalesData();
          }}
          handleCloseDialog={handleCloseDialog}
          projectID={id}
          type={dialogType}
          existingData={getExisitingData}
          accountId={currentAccountId}
        />
      )}
      <Layout>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <div className="detail-container">
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
                    {(permissions?.projectSales.isUpdate && isTeamMember) ||
                      isManager ? (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpenUpdateDialog}
                      >
                        Edit
                      </Button>
                    ) : null}

                    <Box component="span" marginX={1} />

                    {permissions?.projectSales.isDelete && isManager ? (
                      <DeleteButton
                        text="Delete"
                        onClick={() => {
                          handleDeleteProject(id);
                        }}
                      />
                    ) : null}
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
                      <Tabs
                        className="oms-tab"
                        value={currentTabIndex}
                        onChange={(index, newValue) => {
                          setCurrentTabIndex(newValue);
                        }}
                        indicatorColor="primary"
                        textColor="primary"
                        aria-label="icon tabs example"
                      >
                        <Tab
                          label="Project Sales"
                          aria-controls="a11y-tabpanel-0"
                          id="a11y-tab-0"
                        />
                        <Tab
                          label="3D Graph"
                          aria-controls="a11y-tabpanel-1"
                          id="a11y-tab-1"
                        />
                      </Tabs>
                      {currentTabIndex === 0 && (
                        <Box>
                          <DetailsPage
                            data={projectSalesData}
                            fields={projectSalesFields}
                          />
                        </Box>
                      )}

                      {currentTabIndex === 1 && (
                        <Box>
                          <CustomNodalStructure
                            id={id}
                            graphData={graphData}
                            loadingGraphData={loadingGraphData}
                            onClick={(node) => {
                              if (node && routes[node.route]) {
                                history.push({
                                  pathname: `${routes[node.route].path}/${node.id
                                    }`,
                                });
                              }
                            }}
                          />
                        </Box>
                      )}
                    </>

                    // <Box>
                    //   <Box
                    //     width="100%"
                    //     padding={1}
                    //     bgcolor="grey.200"
                    //     display="flex"
                    //     justifyContent="space-between"
                    //   >
                    //     <Typography variant="subtitle2">
                    //       Project Sales
                    //     </Typography>
                    //   </Box>
                    //   <DetailsPage
                    //     data={projectSalesData}
                    //     fields={projectSalesFields}
                    //   />
                    // </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={12} md={4} lg={4}>
              <Paper>
                <Box style={{ padding: "0px", maxHeight: "450px" }}>
                  <Box
                    width="100%"
                    padding={1}
                    bgcolor="grey.200"
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography variant="subtitle2">Project Team</Typography>
                    {(permissions?.projectSales.isUpdate && isTeamMember) ||
                      isManager ? (
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleOpenDialog("user")}
                      >
                        <ControlPoint />
                      </IconButton>
                    ) : null}
                  </Box>
                  <Box padding={1}>
                    {loading ? (
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
                      <Box>
                        <TeamUsers
                          managerId={
                            projectSalesData.projectManager?.optionValue
                          }
                          permissions={permissions}
                          data={teamUsers}
                          removeUser={handleRemoveUser}
                        />
                        <Box marginY={1} />
                      </Box>
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
          <CustomerAccounts
            isTeamMember={isTeamMember}
            isManager={isManager}
            ownerId={projectSalesData?.projectManager?.optionValue}
            loading={loading}
            handleOpenDialog={handleOpenDialog}
            customerAccounts={customerAccounts}
            customerContacts={customerContacts}
            opportunities={opportunities}
            permissions={permissions?.projectSales}
            fetchProjectData={getSalesData}
            projectId={id}
            users={teamUsers}
          />
        </div>
      </Layout>

      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={
            deleteRec
              ? `Are you sure you want to delete this ${projectSalesData.projectName}`
              : removeUserRec
                ? `Are you sure you want to remove ${removeUserRec.firstName} ${removeUserRec.lastName}`
                : ""
          }
          onClose={() => {
            setShowConfirmBox(false);
            if (deleteRec) setDeleteRec(null);
            if (removeUserRec) setRemoveUserRec(null);
          }}
          onOk={deleteRec ? DeleteProject : removeUserRec ? RemoveUser : null}
        />
      ) : null}
    </>
  );
};

export default ProjectSalesDetails;
