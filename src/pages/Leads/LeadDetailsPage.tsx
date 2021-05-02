import React, { useState, useEffect, useContext } from "react";
import { Box, Button, Grid, Paper, List, ListItem, ListItemAvatar, ListItemText, Typography, IconButton, Card, CardContent } from "@material-ui/core";
import { useHistory, useParams, Link } from "react-router-dom";
import { Skeleton } from "@material-ui/lab";
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
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
import { lead } from "../../constants/helpers";
import DeleteButton from "../../components/Helpers/DeleteButton";
import styles from "./LeadDetailsPage.module.scss";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import ManageLeadDialog from "./ManageLeadDialog/ManageLeadDialog";
import ProjectInAccordion from "../../components/ProjectInAccordion/ProjectInAccordion";
import QuotesInAccordion from "../../components/QuotesInAccordion/QuotesInAccordion";
import ProductBuilderInAccordion from "../../components/ProductBuilderInAccordion/ProductBuilderInAccordion";
import LeadInAccordion from "../../components/LeadsInAccordion/LeadsInAccordion";
import { withStyles } from "@material-ui/core/styles";


const Accordion = withStyles({
  root: {
    border: "1px solid rgba(0, 0, 0, .125)",
    boxShadow: "none",
    "&:not(:last-child)": {
      borderBottom: 0,
    },
    "&:before": {
      display: "none",
    },
    "&$expanded": {
      margin: "auto",
    },
  },
  expanded: {},
})(MuiAccordion);

const AccordionSummary = withStyles({
  root: {
    backgroundColor: "#e4e4e4",
    borderBottom: "1px solid rgba(0, 0, 0, .125)",
    "&$expanded": {
      minHeight: 46,
    },
  },
  content: {
    "&$expanded": {
      margin: "12px 0",
    },
  },
  expanded: {},
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
  root: {
    padding: theme.spacing(1),
    display: "block",
  },
  amount: {
    float: "right",
    fontWeight: "bold"
  }

}))(MuiAccordionDetails);

function DisplayData({ label, value }) {
  return <div style={{ flexGrow: 1 }}>
    <Grid container spacing={2}>
      <Grid item sm={6} xs={6} md={4}>
        <Typography>{label}</Typography>
      </Grid>
      <Grid item sm={6} xs={6} md={8}>
        <Typography>{value}</Typography>
      </Grid>
    </Grid>
  </div>
}

const LeadDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [loading, setLoading] = useState(true);
  const [leadData, setLeadData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [leadFields, setLeadFIelds] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.lead]);
  const [leadsPermissions, setLeadsPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });

  const [hasPermissionToConvertToOpportunity, setHasPermissionToConvertToOpportunity] = useState(false);
  const [isLeadAlreadyConvertedToOpportunity, setIsLeadAlreadyConvertedToOpportunity] = useState(false);
  const [okButtonLoading, setOkButtonLoading] = useState(false);
  const [isExpandedAccordion, setIsExpandedAccordion] = useState(true);
  const [expandOpportunity, setExpandOpportunity] = useState(isExpandedAccordion);
  const [convertedOpportunityName, setConvertedOpportunityName] = useState("");

  const [
    convertLeadToOpportunityConfirmationDialog,
    setConvertLeadToOpportunityConfirmationDialog,
  ] = useState({ open: false, id: null, leadName: null, message: null });

  const { leadResource, leadApi } = lead;
  let { id } = useParams();

  // useEffect(() => {
  //   if (id && user) {
  //     fetchLeadData();
  //   }
  // }, [id]);

  useEffect(() => {
    if (permissions) {
      setLeadsPermissions(permissions[leadResource]);
    }
  }, [permissions]);

  useEffect(() => {
    fetchLeadData();
  }, [user, selectedEntity]);


  const fetchLeadData = async () => {
    setLoading(true);
    if (selectedEntity) {
      axiosInstance()
        .get(`${leadApi}/${id}?entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          setConvertedOpportunityName(data?.staticData?.opportunity?.opportunityName)
          console.log(convertedOpportunityName)
          const userId = user?.user?._id;
          handleMainPoints(data);
          let name = [data.firstName, data.middleName, data.lastName]
            .filter((d) => d)
            .join(" ");

          let dontHavePermissions = [];

          if (!permissions["customerAccount"].isCreate) {
            dontHavePermissions.push("Customer Account");
          }
          if (!permissions["customerContact"].isCreate) {
            dontHavePermissions.push("Customer Contact");
          }
          if (!permissions["opportunity"].isCreate) {
            dontHavePermissions.push("Opportunity");
          }

          const isAllowedToUpdate = [...data.collaborator ?? [], data.owner].some(
            (d) => d?.optionValue == userId
          );
          setHasPermissionToConvertToOpportunity(dontHavePermissions.length == 0 && user?.user?.permissions?.convertLeadToOpportunity && isAllowedToUpdate);
          setIsLeadAlreadyConvertedToOpportunity(data.staticData && data.staticData["convertedToOpportunity"] ? data.staticData["convertedToOpportunity"] : false);

          if (data?.salutation?.optionLabel) {
            name = data.salutation.optionLabel + name;
          }
          setHeadingLbl(name);

          setAllowedToEdit(
            [...data.collaborator ?? [], data.owner].some(
              (d) => d?.optionValue == userId
            )
          );
          setAllowedToDelete(
            [data.owner].some((d) => d?.optionValue == userId)
          );
          setLeadData(data);
          getLeadFields();
          setCustomizedRoutes([routes.lead, { title: name }]);
        });
    }
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
      .get(`/field?resource=Lead&entity=${selectedEntity}`)
      .then(({ data }) => {
        setLeadFIelds(data.data);
        setLoading(false);
      });
  };

  const handleDeleteLead = () => {
    if (leadData?._id) {
      axiosInstance()
        .put(`${leadApi}/remove?entity=${selectedEntity}`, {
          ids: [leadData._id],
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          goBackToListing();
          setShowConfirmBox(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
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

  const handleOpneUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const convertLeadToOpportunity = () => {
    axiosInstance()
      .post(`${leadApi}/to-opportunity`, { ids: [leadData._id] })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        setConvertLeadToOpportunityConfirmationDialog({
          open: false,
          id: null,
          leadName: null,
          message: null,
        });
        fetchLeadData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setOkButtonLoading(false);
      });
  };

  return (
    <>
      {openUpdateDialog && (
        <ManageLeadDialog
          open={openUpdateDialog}
          onSuccess={handleUpdateLead}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          isNew={false}
          dataToUpdate={leadData}
          leadApi={leadApi}
        />
      )}
      <Layout>

        <Grid container direction="row">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
            <Paper>
              {!leadData ? (
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
                  logo={leadData?.leadLogo ? leadData.leadLogo : undefined}
                  mainPoints={mainPoints}
                  showHeading={true}
                >
                  {leadsPermissions.isUpdate && allowedToEdit && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleOpneUpdateDialog}
                    >
                      Edit
                    </Button>
                  )}
                  <Box component="span" marginX={1} />
                  {
                    !isLeadAlreadyConvertedToOpportunity && hasPermissionToConvertToOpportunity && <>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          const leadName = [leadData.firstName, leadData.middleName, leadData.lastName].filter(d => d).join(" ")
                          setConvertLeadToOpportunityConfirmationDialog({
                            open: true,
                            id: leadData._id,
                            leadName: leadName,
                            message: `Are you sure, You want to convert ${leadName} to opportunity ?`,
                          });
                        }}
                      >
                        Convert Lead To Opportunity
                </Button>
                      <Box component="span" marginX={1} />
                    </>
                  }
                  {leadsPermissions.isDelete && allowedToDelete && (
                    <DeleteButton
                      text="Delete"
                      onClick={() => setShowConfirmBox(true)}
                    />
                  )}
                </DetailsPageHeader>
              )}

              {loading ? (
                <Grid container spacing={2}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
                    (i, index) => (
                      <Grid key={index} item sm={6} md={6}>
                        <Skeleton
                          variant="text"
                          width="100px"
                          height="16px"
                        />
                        <Box marginY={1} />
                        <Skeleton width="100%" height="50px" />
                      </Grid>
                    )
                  )}
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
              <Accordion expanded={expandOpportunity}>
                <AccordionSummary
                  aria-controls="user-panel-content"
                  id="user-panel-header"
                >
                  <Grid container>
                    <Grid item xs={8}>
                      <Box display="flex">
                        <Box>
                          <IconButton
                            size="small"
                            onClick={(event) => setExpandOpportunity(!expandOpportunity)} >
                            {
                              expandOpportunity === true ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )
                            }
                          </IconButton>
                        </Box>
                        <Box padding="5px">
                          <Typography variant="subtitle2">
                            Opportunity ({convertedOpportunityName?.length > 0 ? 1 : 0})
                                </Typography>
                        </Box>
                      </Box>
                    </Grid>

                  </Grid>
                </AccordionSummary>
                <Box margin={0.50} />
                <AccordionDetails>
                  <>
                    {
                      expandOpportunity && <>
                        {

                          <Grid container spacing={1}>
                            {

                              <Grid item xs={12} sm={12} md={12} key={1} >
                                <Card style={{ minWidth: "100%" }}>
                                  <CardContent className="detailListing">
                                    {convertedOpportunityName?.length > 0 ?
                                      <DisplayData label='Name' value={convertedOpportunityName} /> :
                                      <DisplayData label="Nothing to show" value="" />
                                    }
                                  </CardContent>
                                </Card>
                              </Grid>


                            }
                          </Grid>
                        }
                      </>
                    }
                  </>
                </AccordionDetails>

                <Box margin={1} />
              </Accordion>
              <ProjectInAccordion />
              <QuotesInAccordion />
              <ProductBuilderInAccordion />
              <LeadInAccordion />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={12} md={4} lg={4} spacing={2}>
            <Paper>

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
            </Paper>
          </Grid>
        </Grid>

        {convertLeadToOpportunityConfirmationDialog.open ? (
          <ConfirmationDialog
            open={convertLeadToOpportunityConfirmationDialog.open}
            message={convertLeadToOpportunityConfirmationDialog.message}
            onClose={() => setConvertLeadToOpportunityConfirmationDialog({ open: false, id: null, leadName: null, message: null, })}
            onOk={convertLeadToOpportunity}
          />
        ) : null}
      </Layout>
    </>
  );
};

export default LeadDetailsPage;
