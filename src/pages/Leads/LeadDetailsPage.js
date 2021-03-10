import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@material-ui/core";
import { useHistory, useParams, Link } from "react-router-dom";
import { ExpandMore, Send } from "@material-ui/icons";
import { Skeleton } from "@material-ui/lab";

import { getErrorMessage } from "../../services/util";
import CustomToast from "../../components/Helpers/CustomToast";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import Container from "../../components/Container";
import Layout from "../../components/Layout";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import CustomHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import axiosInstance from "./../../axios/axiosInstance";
import { leadPage } from "../../routes/Lead";
import routes from "../../components/Helpers/Routes";
import { capitalize } from "../../services/util";
import Loader from "../../components/Loader";
import { useData } from "../../StateProvider/Provider";
import { getLeadData } from "../../axios/leads";
import { SVG } from "../../assets";

const LeadDetailsPage = () => {
  const history = useHistory();
  const {
    state: { user },
  } = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [alertData, setAlertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leadData, setLeadData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [leadFields, setLeadFIelds] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [isUpdating, setUpdating] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState([routes.lead]);
  let { id } = useParams();

  useEffect(() => {
    if (id) {
      fetchLeadData();
    }
  }, [id]);

  const fetchLeadData = async () => {
    try {
      const { data } = await getLeadData(id);
      handleMainPoints(data);
      let name = capitalize(data.firstName || "") + " ";
      name = name + capitalize(data.middleName || "") + " ";
      name = name + capitalize(data.lastName || "");

      if (data?.salutation?.optionLabel) {
        name = data.salutation.optionLabel + name;
      }
      setHeadingLbl(name);
      handleAllowToEditList(data);
      setLeadData(data);
      getLeadFields();
      setCustomizedRoutes([
        routes.lead,
        { title: `${data.firstName} ${data.lastName}` },
      ]);
    } catch (error) {}
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

  const handleAllowToEditList = (leadDetails) => {
    const userId = user?.user?._id;
    let allowToEdit = false;

    if (userId) {
      allowToEdit =
        leadDetails.owner?.optionValue &&
        leadDetails.owner.optionValue === userId;

      if (
        !allowToEdit &&
        leadDetails.collaborator &&
        leadDetails.collaborator.length > 0
      ) {
        allowToEdit =
          leadDetails.collaborator.findIndex((d) => d.optionValue === userId) >
          -1;
      }

      if (allowToEdit) setAllowedToEdit(allowToEdit);
    }
  };

  const handleDeleteLead = () => {
    if (leadData?._id) {
      axiosInstance()
        .put(`/lead/remove`, { ids: [leadData._id] })
        .then(({ data }) => {
          handleSnackbar(data.message, "success", true);
          goBackToListing();
          setShowConfirmBox(false);
        })
        .catch((err) => {
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
    setUpdating(true);
    if (values.noOfEmployees) {
      values.noOfEmployees = parseInt(values.noOfEmployees);
    }
    const updatedData = {
      ...values,
      _id: leadData._id,
    };

    axiosInstance()
      .put("/lead", updatedData)
      .then(({ data }) => {
        fetchLeadData();
        handleSnackbar("Successfully saved", "success", true);
        setUpdating(false);
      })
      .catch((err) => {
        setUpdating(false);
      });
  };

  const handleSnackbar = (msg, type, isOpen) => {
    setAlertData({
      errorMsg: msg,
      type: type,
      open: isOpen,
    });
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
  return (
    <>
      {alertData ? (
        <CustomToast
          open={alertData.open || false}
          close={() => handleSnackbar("", "", false)}
          errorMsg={alertData.errorMsg || ""}
          type={alertData.type || ""}
        />
      ) : null}
      <Layout>
        <Grid container direction="row">
          <Grid item xs={12} className="pl-2">
            <CustomBreadCrumbs routes={customizedRoutes} />
          </Grid>
        </Grid>
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
          <CustomHeader
            heading={headingLbl}
            logo={leadData?.leadLogo ? leadData.leadLogo : undefined}
            mainPoints={mainPoints}
            style={{ marginTop: "150px", minHeight: "200px" }}
            showHeading={true}
          >
            <Box component="span" marginX={1} />
            {leadData?.owner?.optionValue &&
            user?.user?._id &&
            leadData.owner.optionValue === user.user._id ? (
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
            <Grid item sm={8} md={8} lg={8}>
              <Container styles={{ height: "100%" }}>
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
                  <DetailsPage
                    data={leadData}
                    fields={leadFields}
                    isUpdating={isUpdating}
                    canEdit={allowedToEdit}
                    handleUpdate={handleUpdateLead}
                  />
                )}
              </Container>
            </Grid>
            <Grid item sm={4} md={4} lg={4}>
              <Container styles={{ padding: 0, background: "transparent" }}>
                <List component="nav" style={{ padding: 0 }}>
                  {quickLinks.map((item, i) => (
                    <div key={i}>
                      <Link to={`#`}>
                        <ListItem button style={{ background: "white" }}>
                          <ListItemIcon>
                            <Send />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${item.label} (${item.count})`}
                          />
                          <ExpandMore />
                        </ListItem>
                      </Link>
                      <Box marginBottom={2} />
                    </div>
                  ))}
                </List>
              </Container>
            </Grid>
          </Grid>
          {showConfirmBox ? (
            <ConfirmationDialog
              open={showConfirmBox}
              message={`Are you sure you want to delete this Lead`}
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
