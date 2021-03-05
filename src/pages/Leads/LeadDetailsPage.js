import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListSubheader,
} from "@material-ui/core";
import { useHistory, useParams, Link } from "react-router-dom";
import { Send } from "@material-ui/icons";

import { getErrorMessage } from "../../services/util";
import CustomToast from "../../components/Helpers/CustomToast";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import Container from "../../components/Container";
import Layout from "../../components/Layout";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import CustomHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import axiosInstance from "./../../axios/axiosInstance";
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
  const [loading, setLoading] = useState(false);
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
      //        fetchLeadData()
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
        ...customizedRoutes,
        { title: `${data.firstName} ${data.lastName}` },
      ]);
    } catch (error) {}
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      phone: data.phone || "",
      email: data.email || "",
      title: data.title || "",
    };
    if (data?.accountName?.optionLabel) {
      tempMp["Account Name"] = data.accountName.optionLabel;
    }
    console.log(tempMp);
    setMainPoints(tempMp);
  };

  const getLeadFields = () => {
    axiosInstance()
      .get("/field?resource=Lead")
      .then(({ data }) => {
        // setContactFields(data);
        // setLoading(false);
        console.log(data);
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

  const handleSnackbar = (msg, type, isOpen) => {
    setAlertData({
      errorMsg: msg,
      type: type,
      open: isOpen,
    });
  };

  const quickLinks = [
    {
      label: "Projects",
      count: 0,
    },
    {
      label: "Opportunity",
      count: 0,
    },
    {
      label: "Quotes",
      count: 0,
    },
    {
      label: "Accounts Teams",
      count: 0,
    },
    {
      label: "Contacts",
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
                    //handleUpdate={handleUpdateContact}
                  />
                )}
              </Container>
            </Grid>
            <Grid item sm={4} md={4} lg={4}>
              <Container styles={{ padding: 0 }}>
                <List
                  component="nav"
                  subheader={
                    <ListSubheader component="div" id="nested-list-subheader">
                      Lead Heirarchy
                    </ListSubheader>
                  }
                >
                  {quickLinks.map((item) => (
                    <Link to={`!#`}>
                      <ListItem button>
                        <ListItemIcon>
                          <Send />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${item.label} (${item.count})`}
                        />
                      </ListItem>
                    </Link>
                  ))}
                </List>
              </Container>
            </Grid>
          </Grid>
        </div>
      </Layout>
    </>
  );
};

export default LeadDetailsPage;
