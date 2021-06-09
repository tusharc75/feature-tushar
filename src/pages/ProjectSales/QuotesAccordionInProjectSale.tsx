import React, { useState, useEffect, useContext } from "react";
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
  MenuItem,
  Menu,
} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import TrendingUpOutlinedIcon from "@material-ui/icons/TrendingUpOutlined";
import { withStyles } from "@material-ui/core/styles";
import axiosInstance from "../../axios/axiosInstance";
import { Link } from "react-router-dom";
import { IoCalendarOutline } from "react-icons/io5";
import { useData } from "../../StateProvider/Provider";
import { displayDate } from "../../services/util";
import ManageQuoteDialog from "../../pages/QuoteBuilderCombined/ManageQuote/ManageQuoteDialog";
import { MoreVert, Delete } from "@material-ui/icons";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { FaArrowAltCircleDown } from "react-icons/fa";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import { getUniqueCurrencies } from "../../constants/helpers";

const Accordion = withStyles({
  root: {
    border: "1px solid rgba(0, 0, 0, .125)",
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
    backgroundColor: "white",
    borderBottom: "1px solid #f1ece8",
    background: "#ffffff",
    fontWeight: "bold",
    padding: "0px",
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

function DisplayData({ key, label, value, icon }) {
  return (
    <div style={{ flexGrow: 1 }}>
      <List>
        <ListItem key={key}>
          <ListItemAvatar>{icon}</ListItemAvatar>
          <ListItemText primary={value ? value : "-"} secondary={label} />
        </ListItem>
      </List>
    </div>
  );
}

export default function QuotesAccordionInProjectSale({
  expanded = true,
  recordsPerLine = 2,
  quotes,
  permissions,
  accountId = null,
  resource = null,
  contactId = null,
  opportunityId = null,
  accountResource = null,
  projectId,
  addExisting,
  fetchProjectData,
  isTeamMember,
  isManager,
  onNewQuoteAdd,
}) {
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
  const { setToastConfig } = useContext(CustomToastContext);
  const [expandQuote, setExpandQuote] = useState(expanded);
  const [maxRecordsToShow, setMaxRecordsToShow] = useState(recordsPerLine);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [removeRec, setRemoveRec] = useState(null);
  const [showAddExistingDialog, setShowAddExistingDialog] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  useEffect(() => {
    let isExpanded = expandQuote;
    if (quotes?.length === 0 && isExpanded) isExpanded = false;
    else if (quotes?.length > 0 && !isExpanded) isExpanded = true;

    setExpandQuote(isExpanded);
  }, [quotes]);
  const handleRemove = (rec) => {
    setShowConfirmBox(true);
    setRemoveRec(rec);
  };

  const removeQuote = () => {
    if (!removeRec) return;

    const dataObj = {
      quoteBuilder: quotes
        .filter((o) => o._id !== removeRec._id)
        .map((o) => o._id),
      _id: projectId,
    };

    axiosInstance()
      .put(`/project-sales/add-quote`, dataObj)
      .then(() => {
        fetchProjectData();
        setShowConfirmBox(false);
      })
      .catch((error) => {
        setToastConfig(error);
      });
  };

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  return (
    <>
      <Menu
        id="menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={() => {
            setShowCreateDialog(true);
            handleCloseMenu();
          }}
        >
          Create New
        </MenuItem>
        <MenuItem
          onClick={() => {
            addExisting("quote-builder", accountId);
            handleCloseMenu();
          }}
        >
          Add Exisiting
        </MenuItem>
      </Menu>
      <Accordion expanded={expandQuote} className="omsAccordian accordQuotes">
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
                  onClick={() => setExpandQuote(!expandQuote)}
                >
                  {expandQuote === true ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </IconButton>
                <Box padding="5px">
                  <Typography variant="subtitle2">
                    Quotes ({quotes?.length || 0})
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={4} container justify="flex-end" alignItems="center">
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
            </Grid>
          </Grid>
        </AccordionSummary>
        <Box margin={0.5} />
        <AccordionDetails>
          <>
            {expandQuote && (
              <>
                {quotes && quotes?.length ? (
                  <Grid container spacing={1}>
                    {quotes.slice(0, maxRecordsToShow).map((obj, i) => (
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={recordsPerLineInLargeScreen}
                      >
                        <Card className="detailCard">
                          <CardContent className="detailListing">
                            <Grid container className="detailCardHeader">
                              <Grid item xs={6}>
                                {obj.entity === selectedEntity ? (
                                  <Link
                                    className="link"
                                    to={`/quote-builder/${obj._id}`}
                                  >
                                    <Typography className="detailName text-truncate">
                                      {obj.quoteName}
                                    </Typography>
                                  </Link>
                                ) : (
                                  <span className="d-flex gap-2 align-items-center">
                                    <Typography className="detailName">
                                      {obj.quoteName}
                                    </Typography>{" "}
                                    <Tooltip
                                      title={`${obj.quoteName} belongs to different entity`}
                                    >
                                      <InfoOutlinedIcon fontSize="small" />
                                    </Tooltip>
                                  </span>
                                )}
                              </Grid>
                              <Grid item xs={6}>
                                <Box display="flex" alignItems="center">
                                  {obj?.amount ? (
                                    <Typography className="amount">
                                      {
                                        getUniqueCurrencies().find(
                                          (d) =>
                                            d.currencyCode == obj["currency"]
                                        )?.symbolNative
                                      }
                                      &nbsp;{obj?.amount ?? ""}
                                    </Typography>
                                  ) : (
                                    ""
                                  )}
                                  {(permissions.isUpdate && isTeamMember) ||
                                  isManager ? (
                                    <>
                                      <Box ml={1} />
                                      <IconButton
                                        title={`Remove quote ${obj.quoteName}`}
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
                              </Grid>
                            </Grid>

                            <Grid container>
                              <Grid item xs={12} sm={6} md={6}>
                                {obj.closeDate ? (
                                  <DisplayData
                                    key={i}
                                    label="Closing Date"
                                    value={displayDate(obj.closeDate)}
                                    icon={<IoCalendarOutline size={15} />}
                                  />
                                ) : (
                                  ""
                                )}
                              </Grid>
                              <Grid item xs={12} sm={6} md={6}>
                                {obj.probability ? (
                                  <DisplayData
                                    key={i}
                                    label="Probability"
                                    value={`${obj.probability} %`}
                                    icon={<TrendingUpOutlinedIcon />}
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

        {quotes?.length > 0 && quotes.length > maxRecordsToShow && (
          <Box
            margin={1}
            className="btn-view gap-1"
            onClick={() => {
              setMaxRecordsToShow(
                (prevState) => prevState + recordsPerLine * 2
              );
            }}
            p={1}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <FaArrowAltCircleDown size={25} />
          </Box>
        )}
      </Accordion>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={
            removeRec
              ? `Are you sure you want to remove quote  ${removeRec.quoteName}`
              : ""
          }
          onClose={() => {
            setShowConfirmBox(false);
            if (removeRec) setRemoveRec(null);
          }}
          onOk={removeRec ? removeQuote : null}
        />
      ) : null}

      {showCreateDialog && (
        <ManageQuoteDialog
          open={showCreateDialog}
          onClose={() => {
            setShowCreateDialog(false);
          }}
          isNew={true}
          isRedirectTodetailPage={false}
          dataToUpdate={null}
          resource={null}
          onSuccess={(id) => {
            setShowCreateDialog(false);
            onNewQuoteAdd(id);
          }}
          accountId={accountId}
          contactId={contactId}
          opportunityId={opportunityId}
          accountResource={accountResource}
          disableOwnerDropDown={true}
          isRenderedFromCustomerAccount={true}
        />
      )}
    </>
  );
}
