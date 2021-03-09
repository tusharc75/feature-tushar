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

import { getErrorMessage } from "../../services/util";
import CustomToast from "../../components/Helpers/CustomToast";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import Container from "../../components/Container";
import Layout from "../../components/Layout";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import CustomHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import axiosInstance from "./../../axios/axiosInstance";
import { opportunityPage } from "../../routes/Opportunity";
import routes from "../../components/Helpers/Routes";
import { capitalize } from "../../services/util";
import Loader from "../../components/Loader";
import { useData } from "../../StateProvider/Provider";
import { getLeadData } from "../../axios/leads";
import { SVG } from "../../assets";

const OpportunityDetailsPage = () => {
  const history = useHistory();
  const {
    state: { user },
  } = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [alertData, setAlertData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [opportunityData, setOpportunityData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [opportunityFields, setOpportunityFIelds] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [isUpdating, setUpdating] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState([
    routes.opportunity,
  ]);
  let { id } = useParams();

  useEffect(() => {
    if (id) {
      fetchOpportunityData();
    }
  }, [id]);

  const fetchOpportunityData = async () => {
    try {
      const { data } = await axiosInstance().get(`/opportunity/${id}`);
      handleMainPoints(data);
      let name = capitalize(data.opportunityName);
      setHeadingLbl(name);
      handleAllowToEditList(data);
      setOpportunityData(data);
      getOpportunityFields();
      setCustomizedRoutes([
        ...customizedRoutes,
        { title: `${data.firstName} ${data.lastName}` },
      ]);
    } catch (error) {}
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      accountName: data.accountName || "",
      closeData: data.closeData || "",
      amount: data.amount || "",
      opportunityOwner: data.owner || "",
    };
    if (data?.accountName?.optionLabel) {
      tempMp["Account Name"] = data.accountName.optionLabel;
    }
    console.log(tempMp);
    setMainPoints(tempMp);
  };

  const getOpportunityFields = () => {
    axiosInstance()
      .get("/field?resource=Opportunity")
      .then(({ data }) => {
        setOpportunityFIelds(data);
        setLoading(false);
        console.log(data);
      });
  };

  const handleAllowToEditList = (opportunityDetails) => {
    const userId = user?.user?._id;
    let allowToEdit = false;

    if (userId) {
      allowToEdit =
        opportunityDetails.owner?.optionValue &&
        opportunityDetails.owner.optionValue === userId;

      if (
        !allowToEdit &&
        opportunityDetails.collaborator &&
        opportunityDetails.collaborator.length > 0
      ) {
        allowToEdit =
          opportunityDetails.collaborator.findIndex(
            (d) => d.optionValue === userId
          ) > -1;
      }

      if (allowToEdit) setAllowedToEdit(allowToEdit);
    }
  };

  const handleDeleteOpportunity = () => {
    if (opportunityData?._id) {
      axiosInstance()
        .put(`/opportunity/remove`, { ids: [opportunityData._id] })
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
      pathname: opportunityPage.path,
    });
  };

  const handleUpdateOpportunity = (values) => {
    setUpdating(true);
    const updatedData = {
      ...values,
      _id: opportunityData._id,
    };

    axiosInstance()
      .put("/opportunity", updatedData)
      .then(({ data }) => {
        //fetchOpportunityData();
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
      label: "Contact Roles",
      count: 0,
    },
    {
      label: "Quotes",
      count: 0,
    },
    {
      label: "Products",
      count: 0,
    },
    {
      label: "Notes",
      count: 0,
    },
    {
      label: "Files",
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
        <CustomHeader
          heading={headingLbl}
          logo={
            opportunityData?.leadLogo ? opportunityData.leadLogo : undefined
          }
          mainPoints={mainPoints}
          style={{ marginTop: "150px", minHeight: "200px" }}
          showHeading={true}
        >
          <Box component="span" marginX={1} />
          {opportunityData?.owner?.optionValue &&
          user?.user?._id &&
          opportunityData.owner.optionValue === user.user._id ? (
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setShowConfirmBox(true)}
            >
              Delete
            </Button>
          ) : null}
        </CustomHeader>

        <div>
          <Grid
            container
            spacing={2}
            style={{ minHeight: "calc(100vh - 200px)" }}
          >
            <Grid item sm={8} md={8} lg={8}>
              <Container styles={{ height: "100%" }}>
                {loading ? (
                  <Loader style={{ height: "100%" }} text="Loading Data..." />
                ) : !opportunityFields.length ? (
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
                    data={opportunityData}
                    fields={opportunityFields}
                    isUpdating={isUpdating}
                    canEdit={allowedToEdit}
                    handleUpdate={handleUpdateOpportunity}
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
              message={`Are you sure you want to delete this opportunity`}
              onClose={() => setShowConfirmBox(false)}
              onOk={handleDeleteOpportunity}
            />
          ) : null}
        </div>
      </Layout>
    </>
  );
};

export default OpportunityDetailsPage;
