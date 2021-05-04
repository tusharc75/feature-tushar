import React, { useState, useEffect } from "react";
import {
  Grid,
  Box,
  IconButton,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@material-ui/core";
import CommonSkeleton from "../Helpers/CommonSkeleton";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import ControlPointIcon from "@material-ui/icons/ControlPoint";
import { withStyles, makeStyles } from "@material-ui/core/styles";
import { displayDate } from "../../services/util";
import routes from "./../../components/Helpers/Routes";
import { Link } from "react-router-dom";
import ManageOpportunityDialog from "../../pages/Opportunities/ManageOpportunityDialog/ManageOpportunityDialog";
import { useHistory } from "react-router-dom";
import { IoCalendarOutline } from "react-icons/io5";
import { BiCustomize } from "react-icons/bi";
import { FaEye } from "react-icons/fa";
import currencies from "./../../constants/currency_with_country.json";
import { LinkOff } from "@material-ui/icons";

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
  amount: {
    float: "right",
    fontWeight: "bold",
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

export default function OpportunityInAccordian({
  opportunities,
  onNewOpportunityAdd,
  accountId,
  accountName,
  expanded = true,
  recordsPerLine = 2,
  opportunityPermissions,
  resource,
  isRedirect,
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

  const [expandOpportunity, setExpandOpportunity] = useState(expanded);
  const [
    showCreateOpportunityDialog,
    setShowCreateOpportunityDialog,
  ] = useState(false);

  useEffect(() => {
    let isExpanded = expandOpportunity;
    if (opportunities.length === 0 && isExpanded) isExpanded = false;
    else if (opportunities.length > 0 && !isExpanded) isExpanded = true;

    setExpandOpportunity(isExpanded);
  }, [opportunities]);
  return (
    <>
      <Accordion expanded={expandOpportunity}>
        <AccordionSummary
          aria-controls="user-panel-content"
          id="user-panel-header"
        >
          <Grid container>
            <Grid item xs={8} alignItems="center">
              <Box
                component="div"
                display="flex"
                alignItems="center"
                flexGrow={1}
              >
                <IconButton
                  size="small"
                  onClick={(event) => setExpandOpportunity(!expandOpportunity)}
                >
                  {expandOpportunity === true ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </IconButton>
                <strong>Opportunity ({opportunities.length})</strong>
              </Box>
            </Grid>
            <Grid item xs={4} container justify="flex-end" alignItems="center">
              <Typography variant="subtitle2">
                {opportunityPermissions.isCreate && (
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => {
                      setShowCreateOpportunityDialog(true);
                    }}
                  >
                    <ControlPointIcon />
                  </IconButton>
                )}
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
                                  <Typography className="amount">
                                    {
                                      currencies.find(
                                        (d) => d.currencyCode == obj["currency"]
                                      )?.symbolNative
                                    }
                                    &nbsp;{obj?.amount ?? ""}
                                  </Typography>
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

      {showCreateOpportunityDialog && (
        <ManageOpportunityDialog
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
        />
      )}
    </>
  );
}
