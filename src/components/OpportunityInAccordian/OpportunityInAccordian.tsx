import React, { useState, useEffect } from "react";
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
  Tooltip,
  Menu,
  MenuItem
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import ControlPointIcon from "@material-ui/icons/ControlPoint";
import { withStyles } from "@material-ui/core/styles";
import { displayDate } from "../../services/util";
import routes from "./../../components/Helpers/Routes";
import { Link } from "react-router-dom";
import ManageOpportunityDialog from "../../pages/Opportunities/ManageOpportunityDialog/ManageOpportunityDialog";
import { useHistory } from "react-router-dom";
import { IoCalendarOutline } from "react-icons/io5";
import { BiCustomize } from "react-icons/bi";
import currencies from "./../../constants/currency_with_country.json";
import { useData } from "../../StateProvider/Provider";
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { HiExternalLink } from 'react-icons/hi';
import { customerAccount, customerContact } from "../../constants/helpers";
import { MoreVert } from "@material-ui/icons";
import AssignOpportunityDialog from "../AssignRolesDialog/AssignOpportunityDialog";

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
  amount: {
    float: "right",
    fontWeight: "bold",
  },
}))(MuiAccordionDetails);

function DisplayData({ key, label, value, icon }) {
  return <div style={{ flexGrow: 1 }}>
    <List>
      <ListItem key={key}>
        <ListItemAvatar>
          {icon}
        </ListItemAvatar>
        <ListItemText primary={value ? value : '-'} secondary={label} />
      </ListItem>
    </List>
  </div>
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
  contactId = null,
  contactResource = null,
}) {
  const history = useHistory();
  const {
    state: { selectedEntity },
  }: any = useData();
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
  const [
    showAddOpportunityDialog,
    setShowAddOpportunityDialog,
  ] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    let isExpanded = expandOpportunity;
    if (opportunities.length === 0 && isExpanded) isExpanded = false;
    else if (opportunities.length > 0 && !isExpanded) isExpanded = true;

    setExpandOpportunity(isExpanded);
  }, [opportunities]);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  return (
    <>
      <Accordion expanded={expandOpportunity} className="omsAccordian accordOpportunity">
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
                  onClick={() => setExpandOpportunity(!expandOpportunity)}
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
                {opportunityPermissions.isCreate && contactResource === customerContact.contactResource ?
                  <>
                    <IconButton
                      aria-haspopup="true"
                      color="primary"
                      size="small"
                      onClick={handleOpenMenu}
                    >
                      <MoreVert />
                    </IconButton>
                    <Menu
                      id="menu"
                      anchorEl={anchorEl}
                      keepMounted
                      open={Boolean(anchorEl)}
                      onClose={handleCloseMenu}
                    >
                      <MenuItem
                        onClick={() => {
                          setShowCreateOpportunityDialog(true);
                          handleCloseMenu();
                        }}
                      >
                        Create New
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setShowAddOpportunityDialog(true)
                          handleCloseMenu();
                        }}
                      >
                        Add Exisiting
                      </MenuItem>
                    </Menu>
                  </>
                  :
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => {
                      setShowCreateOpportunityDialog(true);
                    }}
                  >
                    <ControlPointIcon />
                  </IconButton>
                }
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
                        <Card className="detailCard">
                          <CardContent className="detailListing">
                            <Grid container className="detailCardHeader">
                              <Grid item xs={7} sm={8}>
                                {
                                  obj.entity === selectedEntity ? <Link className="link" to={`${routes.opportunityDetail.path}/${obj._id}`}>
                                    <Typography className="detailName">{obj?.opportunityName}</Typography>
                                  </Link> : <span className="d-flex gap-2 align-items-center">
                                    <Typography className="detailName">{obj.opportunityName}</Typography> <Tooltip title={`${obj.opportunityName} belongs to different entity`}>
                                      <InfoOutlinedIcon fontSize="small" />
                                    </Tooltip>
                                  </span>
                                }

                              </Grid>
                              <Grid item xs={5} sm={4}>
                                <Typography className="amount">
                                  {obj?.amount ? currencies.find(d => d.currencyCode == obj["currency"])?.symbolNative : ''}
                                                                        &nbsp;{obj?.amount ?? ''}</Typography>
                              </Grid>
                            </Grid>
                            <Grid container>
                              <Grid item xs={12} sm={6} md={6}>
                                {
                                  obj?.stage ? <DisplayData key={index} label='Stage' value={obj?.stage ?? ''} icon={<BiCustomize size={15} />} /> : ''
                                }
                              </Grid>
                              <Grid item xs={12} sm={6} md={6}>
                                {
                                  obj.closeDate ? <DisplayData key={index} label='Closing Date' value={displayDate(obj.closeDate)} icon={< IoCalendarOutline size={15} />} /> : ''
                                }
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
        <Box margin={1} className="btn-view gap-1" onClick={() =>
          history.push(`/opportunity`, {
            accountId: accountId,
            accountName: accountName,
            resource: `${resource}`,
          })
        }
          p={1} display="flex" justifyContent="center" alignItems="center">
          <HiExternalLink size={25} />
        </Box>

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
          contactId={contactId}
          disableOwnerAndAccount={resource === customerAccount.accountResource}
          contactResource={contactResource}
        />
      )}
      {showAddOpportunityDialog && (
        <AssignOpportunityDialog
          opportunityDialogOpen={showAddOpportunityDialog}
          onSuccess={(id) => {
            setShowAddOpportunityDialog(false);
            onNewOpportunityAdd(id);
          }}
          handleCloseDialog={() => setShowAddOpportunityDialog(false)}
          assignedOpportunity={opportunities}
          accountId={accountId}
          contactId={contactId}
        />
      )}
    </>
  );
}
