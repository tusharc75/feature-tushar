import { useState, useEffect, useContext } from "react";
import { withStyles } from "@material-ui/core/styles";
import {
  Grid,
  Box,
  IconButton,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
} from "@material-ui/core";
import { Delete } from "@material-ui/icons";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import MoreVert from "@material-ui/icons/MoreVert";
import { Link, useHistory } from "react-router-dom";
import { IoCalendarOutline } from "react-icons/io5";
import { BiCustomize } from "react-icons/bi";
import { FaEye } from "react-icons/fa";

import { displayDate } from "../../services/util";
import routes from "./../../components/Helpers/Routes";
import currencies from "./../../constants/currency_with_country.json";
import NewOpportunityProjectSales from "./NewOpportunityProjectSales";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";

const Accordion = withStyles({
  root: {
    border: "1px solid rgba(0, 0, 0, .125) !important",
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
    backgroundColor: "#f5f5f5",
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
}))(MuiAccordionDetails);

function DisplayData({ label, value, icon }) {
  return (
    <div style={{ flexGrow: 1 }}>
      <List>
        <ListItem>
          <ListItemAvatar>{icon}</ListItemAvatar>
          <ListItemText primary={value} secondary={label} />
        </ListItem>
      </List>
    </div>
  );
}

export default function OpportunityAccordianProjectSales({
  opportunities,
  onNewOpportunityAdd,
  accountId,
  accountName,
  expanded = true,
  recordsPerLine = 2,
  permissions,
  resource,
  isRedirect,
  collaborators,
  addExisting,
  projectId,
  fetchProjectData,
  isTeamMember,
  isManager,
}) {
  const history = useHistory();
  let recordsPerLineInLargeScreen: 3 | 4 | 6 | 12 = 6;

  switch (recordsPerLine) {
    case 1:
      recordsPerLineInLargeScreen = 12;
      break;

    case 3:
      recordsPerLineInLargeScreen = 4;
      break;

    case 4:
      recordsPerLineInLargeScreen = 3;
      break;

    default:
      recordsPerLineInLargeScreen = 6;
      break;
  }
  const { setToastConfig } = useContext(CustomToastContext);
  const [expandOpportunity, setExpandOpportunity] = useState(expanded);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [removeRec, setRemoveRec] = useState(null);
  const [
    showCreateOpportunityDialog,
    setShowCreateOpportunityDialog,
  ] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    let isExpanded = expandOpportunity;
    if (opportunities.length === 0 && isExpanded) isExpanded = false;
    else if (opportunities.length > 0 && !isExpanded) isExpanded = true;

    setExpandOpportunity(isExpanded);
  }, [opportunities]);

  const handleRemove = (rec) => {
    setShowConfirmBox(true);
    setRemoveRec(rec);
  };

  const removeOpp = () => {
    if (!removeRec) return;

    const dataObj = {
      opportunity: opportunities
        .filter((o) => o._id !== removeRec._id)
        .map((o) => o._id),
      _id: projectId,
    };

    axiosInstance()
      .put(`/project-sales/add-opportunity`, dataObj)
      .then(() => {
        fetchProjectData();
        setShowConfirmBox(false);
      })
      .catch((error) => {
        setToastConfig(error);
      });
  };

  return (
    <>
      <Menu
        id="menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem
          onClick={() => {
            setShowCreateOpportunityDialog(true);
            handleClose();
          }}
        >
          Create New
        </MenuItem>
        <MenuItem
          onClick={() => {
            addExisting("opportunity", accountId);
            handleClose();
          }}
        >
          Add Exisiting
        </MenuItem>
      </Menu>
      <Accordion
        expanded={expandOpportunity}
        onChange={() => setExpandOpportunity(!expandOpportunity)}
      >
        <AccordionSummary
          aria-controls="user-panel-content"
          id="user-panel-header"
        >
          <Grid container>
            <Grid item xs={8}>
              <Box
                component="div"
                display="flex"
                alignItems="center"
                flexGrow={1}
              >
                {expandOpportunity === true ? (
                  <ExpandLessIcon />
                ) : (
                  <ExpandMoreIcon />
                )}

                <strong>Opportunity ({opportunities.length})</strong>
              </Box>
            </Grid>
            <Grid item xs={4} container justify="flex-end" alignItems="center">
              <Typography variant="subtitle2">
                {(permissions.isUpdate && isTeamMember) || isManager ? (
                  <IconButton
                    aria-haspopup="true"
                    color="primary"
                    size="small"
                    onClick={handleClick}
                  >
                    <MoreVert />
                  </IconButton>
                ) : null}
              </Typography>
            </Grid>
          </Grid>
        </AccordionSummary>
        <Box margin={0.5} />
        <AccordionDetails>
          <>
            {expandOpportunity && (
              <>
                {opportunities && opportunities.length ? (
                  <Grid container spacing={1}>
                    {opportunities.map((obj, index) => (
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={recordsPerLineInLargeScreen}
                        key={index}
                      >
                        <Card style={{ minWidth: "100%" }}>
                          <CardContent className="detailListing">
                            <Grid container className="detailCardHeader">
                              <Grid item xs={12} sm={8}>
                                <Link
                                  className="link"
                                  to={`${routes.opportunityDetail.path}/${obj._id}`}
                                >
                                  <Typography>
                                    {obj?.opportunityName}{" "}
                                  </Typography>
                                </Link>
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                {obj?.amount ? (
                                  <Box display="flex" alignItems="center">
                                    <Typography className="amount">
                                      {
                                        currencies.find(
                                          (d) =>
                                            d.currencyCode == obj["currency"]
                                        )?.symbolNative
                                      }
                                      &nbsp;{obj?.amount ?? ""}
                                    </Typography>
                                    {(permissions.isUpdate && isTeamMember) ||
                                    isManager ? (
                                      <>
                                        <Box ml={1} />
                                        <IconButton
                                          title={`Remove opportunity ${obj.opportunityName}`}
                                          size="small"
                                          onClick={() => handleRemove(obj)}
                                        >
                                          <Delete
                                            fontSize="small"
                                            color="error"
                                          />
                                        </IconButton>
                                      </>
                                    ) : null}
                                  </Box>
                                ) : (
                                  ""
                                )}
                              </Grid>
                            </Grid>
                            <Grid container>
                              <Grid item xs={12} sm={12}>
                                {obj?.stage ? (
                                  <DisplayData
                                    label="Stage"
                                    value={obj?.stage ?? ""}
                                    icon={<BiCustomize size={20} />}
                                  />
                                ) : (
                                  ""
                                )}
                              </Grid>
                              <Grid item xs={12} sm={12}>
                                {obj.closeDate ? (
                                  <DisplayData
                                    label="Closing Date"
                                    value={displayDate(obj.closeDate)}
                                    icon={<IoCalendarOutline size={20} />}
                                  />
                                ) : (
                                  ""
                                )}
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : null}
              </>
            )}
          </>
        </AccordionDetails>
        <Box
          margin={1}
          className="btn-view gap-1"
          onClick={() =>
            history.push(`/opportunity`, {
              accountId: accountId,
              accountName: accountName,
              resource: `${resource}Name`,
            })
          }
          p={1}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <FaEye /> View All &#8599;
        </Box>
        <Box margin={1} />
      </Accordion>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={
            removeRec
              ? `Are you sure you want to remove opportunity  ${removeRec.opportunityName}`
              : ""
          }
          onClose={() => {
            setShowConfirmBox(false);
            if (removeRec) setRemoveRec(null);
          }}
          onOk={removeRec ? removeOpp : null}
        />
      ) : null}
      {showCreateOpportunityDialog && (
        <NewOpportunityProjectSales
          isNew={true}
          open={showCreateOpportunityDialog}
          onClose={() => setShowCreateOpportunityDialog(false)}
          onSuccess={(id) => {
            setShowCreateOpportunityDialog(false);
            onNewOpportunityAdd(id);
          }}
          accountId={accountId}
          resource={resource}
          isRedirectTodetailPage={isRedirect}
          collaborators={collaborators}
        />
      )}
    </>
  );
}
