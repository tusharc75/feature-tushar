import React, { useState, useEffect, useContext } from "react";
import { Box, Button, Grid } from "@material-ui/core";
import { useHistory, useParams, Link } from "react-router-dom";
import { Skeleton } from "@material-ui/lab";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import Container from "../../components/Container";
import Layout from "../../components/Layout";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import axiosInstance from "./../../axios/axiosInstance";
import { leadPage } from "../../routes/Lead";
import routes from "../../components/Helpers/Routes";
import { useData } from "../../StateProvider/Provider";
import { SVG } from "../../assets";
import Activity from "../../components/Activity";
import UpdateDetailsDialog from "../../components/Shared/UpdateDetailsDialog";
import { getObjKeysWithValues, removeEmptyKeys } from "../../constants/helpers";
import DeleteButton from "../../components/Helpers/DeleteButton";
import styles from "./LeadDetailsPage.module.scss"
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import ManageLeadDialog from "./ManageLeadDialog/ManageLeadDialog";

const LeadDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user },
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [loading, setLoading] = useState(true);
  const [leadData, setLeadData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [leadFields, setLeadFIelds] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [isUpdating, setUpdating] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.lead]);
  const [leadsPermissions, setLeadsPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });

  let { id } = useParams();

  // useEffect(() => {
  //   if (id && user) {
  //     fetchLeadData();
  //   }
  // }, [id]);

  useEffect(() => {
    const data = user?.role?.sideBar;

    if (data) {
      const hasLeadsPermission = data.find((d) => d.name == "Lead");
      if (hasLeadsPermission) {
        setLeadsPermissions({
          isCreate: hasLeadsPermission.isCreate,
          isUpdate: hasLeadsPermission.isUpdate,
          isRead: hasLeadsPermission.isRead,
          isDelete: hasLeadsPermission.isDelete,
        });
      }
    }

    fetchLeadData();
  }, [user]);

  const fetchLeadData = async () => {
    axiosInstance().get(`/lead/${id}`).then(({ data: { data } }) => {
      handleMainPoints(data);
      let name = [data.firstName, data.middleName, data.lastName].filter(d => d).join(" ");

      if (data?.salutation?.optionLabel) {
        name = data.salutation.optionLabel + name;
      }
      setHeadingLbl(name);
      const userId = user?.user?._id;

      setAllowedToEdit([...data.collaborator, data.owner].some(d => d.optionValue == userId));
      setAllowedToDelete([data.owner].some(d => d.optionValue == userId));
      setLeadData(data);
      getLeadFields();
      setCustomizedRoutes([
        routes.lead,
        { title: name },
      ]);
    });
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      company: data.company || "",
      title: data.title || "",
      phone: data.phone || "",
      email: data.email || "",
    };
    setMainPoints(tempMp);
  };

  const getLeadFields = () => {
    axiosInstance()
      .get("/field?resource=Lead")
      .then(({ data }) => {
        setLeadFIelds(data.data);
        setLoading(false);
      });
  };

  const handleDeleteLead = () => {
    if (leadData?._id) {
      axiosInstance()
        .put(`/lead/remove`, { ids: [leadData._id] })
        .then(({ data }) => {
          toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
          goBackToListing();
          setShowConfirmBox(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error)
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };
  const goBackToListing = () => {
    history.push({
      pathname: leadPage.path,
    });
  };

  const handleUpdateLead = (values) => {
    fetchLeadData();
    setOpenUpdateDialog(false);
  };


  const quickLinks = [
    {
      label: "Files",
      count: 0,
    },
    {
      label: "Notes",
      count: 0,
    },
  ];
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);

  const handleOpneUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDIalog = () => {
    setOpenUpdateDialog(false);
  };

  const handleUpdateBrand = (values) => {
    setUpdating(true);
  };

  return (
    <>
      {
        openUpdateDialog && <ManageLeadDialog
          open={openUpdateDialog}
          onSuccess={handleUpdateLead}
          onClose={() => { setOpenUpdateDialog(false) }}
          isNew={false}
          dataToUpdate={leadData}
        />
      }
      {/* {openUpdateDialog && (
        <UpdateDetailsDialog
          title="Lead Update"
          openDialog={openUpdateDialog}
          onClose={closeUpdateDIalog}
          data={leadData}
          fields={leadFields}
          isUpdating={isUpdating}
          handleUpdate={handleUpdateLead}
        />
      )} */}
      <Layout>
        <CustomBreadCrumbs routes={customizedRoutes} />

        {!leadData ? (
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
            logo={leadData?.leadLogo ? leadData.leadLogo : undefined}
            mainPoints={mainPoints}
            // style={{ marginTop: "150px", minHeight: "200px" }}
            showHeading={true}
          >
            {
              leadsPermissions.isUpdate && allowedToEdit && <Button
                variant="contained"
                color="primary"
                onClick={handleOpneUpdateDialog}
              >
                Edit
              </Button>
            }
            <Box component="span" marginX={1} />
            {
              leadsPermissions.isDelete && allowedToDelete && <DeleteButton
                text="Delete"
                onClick={() => setShowConfirmBox(true)}
              />
            }
          </DetailsPageHeader>
        )}
        <div>
          <Grid
            container
            spacing={2}
            style={{ minHeight: "calc(100vh - 200px)" }}
          >
            <Grid item sm={8} md={8} lg={8}>
              <Container styles={{ height: "100%" }}>
                {loading ? (
                  <Grid container spacing={2}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i, index) => (
                      <Grid key={index} item sm={6} md={6}>
                        <Skeleton variant="text" width="100px" height="16px" />
                        <Box marginY={1} />
                        <Skeleton width="100%" height="50px" />
                      </Grid>
                    ))}
                  </Grid>
                ) : !leadFields.length ? (
                  <Box
                    height="100%"
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <img src={SVG("Contacts Placeholder")} alt="No Data" />
                  </Box>
                ) : (
                  <DetailsPage data={leadData} fields={leadFields} />
                )}
              </Container>
            </Grid>
            <Grid className={styles.activityContainer} item sm={4} md={4} lg={4}>
              <Container>
                {!leadData ? (
                  <Box>
                    <Skeleton variant="text" width="100px" height="25px" />
                    <Box marginY={1} />
                    {[0, 1, 2, 3, 4].map((i, index) => (
                      <Skeleton key={index} width="100%" height="50px" />
                    ))}
                  </Box>
                ) : (
                  <div>
                    <Activity
                      relatedTo={[
                        {
                          type: "lead",
                          referenceId: leadData._id,
                          access: true,
                        },
                      ]}
                      handleActivityRefresh={() => { }}
                    />
                  </div>
                )}
              </Container>
            </Grid>
          </Grid>
          {showConfirmBox ? (
            <ConfirmationDialog
              open={showConfirmBox}
              message={`Are you sure you want to delete this Lead ?`}
              onClose={() => setShowConfirmBox(false)}
              onOk={handleDeleteLead}
            />
          ) : null}
        </div>
      </Layout>
    </>
  );
};

export default LeadDetailsPage;
