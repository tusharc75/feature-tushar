import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
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
  Menu
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import TrendingUpOutlinedIcon from '@material-ui/icons/TrendingUpOutlined';
import BusinessOutlinedIcon from '@material-ui/icons/BusinessOutlined';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import { IoCalendarOutline } from 'react-icons/io5';
import { useData } from '../../StateProvider/Provider';
import { displayDate } from '../../services/util';
import { HiExternalLink } from 'react-icons/hi';
import ManageQuoteDialog from '../../pages/QuoteBuilderCombined/ManageQuote/ManageQuoteDialog';
import { MoreVert } from '@material-ui/icons';
import { formatAmountWithCurrency, opportunity } from '../../constants/helpers';
import AssignQuoteDialog from './AssignQuoteDialog';
import routes from '../Helpers/Routes';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';

const Accordion = withStyles({
  root: {
    border: '1px solid rgba(0, 0, 0, .125)',
    '&:not(:last-child)': {
      borderBottom: 0
    },
    '&:before': {
      display: 'none'
    },
    '&$expanded': {
      margin: 'auto'
    }
  },
  expanded: {}
})(MuiAccordion);

const AccordionSummary = withStyles({
  root: {
    backgroundColor: 'white',
    borderBottom: '1px solid #f1ece8',
    background: '#ffffff',
    fontWeight: 'bold',
    padding: '0px',
    '&$expanded': {
      minHeight: 46
    }
  },
  content: {
    '&$expanded': {
      margin: '12px 0'
    }
  },
  expanded: {}
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
  root: {
    padding: theme.spacing(1),
    display: 'block'
  }
}))(MuiAccordionDetails);

function DisplayData({ key, label, value, icon }) {
  return (
    <div style={{ flexGrow: 1 }}>
      <List>
        <ListItem key={key}>
          <ListItemAvatar>{icon}</ListItemAvatar>
          <ListItemText primary={value ? value : '-'} secondary={label} />
        </ListItem>
      </List>
    </div>
  );
}

export default function QuotesInAccordion({
  expanded = true,
  recordsPerLine = 2,
  quotes,
  fetchData,
  quoteBuilderPermission,
  accountId = null,
  accountName = null,
  contactName = null,
  resource = null,
  contactId = null,
  opportunityId = null,
  accountResource = null,
  contactResource = null,
  isRenderedInCustomerContact = false,
  isRenderedFromCustomerAccount = false,
  isCreateOwnerDisable = true,
  contacts = null,
  isRenderedFromOpportunity = false,
  opportunityName = null,
  isAllowedToUpdate,
  marketSegmentId = null,
  subMarketSegmentId = null,
  currency = null,
  estimatedAmount = null
}) {
  const history = useHistory();
  const {
    state: { selectedEntity, user },
    dispatch
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

  const [expandQuote, setExpandQuote] = useState(expanded);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAddExistingDialog, setShowAddExistingDialog] = useState(false);
  const [resourceName, setResourceName] = useState('');

  const onSuccess = () => {
    setShowCreateDialog(false);
    fetchData();
  };
  useEffect(() => {
    let isExpanded = expandQuote;
    if (quotes?.length === 0 && isExpanded) isExpanded = false;
    else if (quotes?.length > 0 && !isExpanded) isExpanded = true;

    setExpandQuote(isExpanded);
    setResourceName(accountId && !contactId && !opportunityId ? accountResource : contactResource ? contactResource : 'opportunity');
  }, [quotes, resourceName]);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleEntityChange = (id) => {
    dispatch({ type: SET_SELECTED_ENTITY, payload: id });
  };

  const hasAccessToEntity = (id) => {
    const entityList = user.entity?.map((entity) => entity._id);
    return entityList.includes(id);
  };

  const isQuotePrivate = (obj) => {
    return 'privateAccess' in obj;
  };

  const quoteNameWithRedirect = (obj) =>
    hasAccessToEntity(obj.entity) ? (
      obj.entity === selectedEntity ? (
        <Link className="link" to={`${routes.quoteBuilder.path}/detail/${obj._id}`}>
          <Typography className="detailName">{obj.quoteName}</Typography>
        </Link>
      ) : (
        <Link
          className="link"
          onClick={() => {
            handleEntityChange(obj.entity);
            history.push(`${routes.quoteBuilder.path}/detail/${obj._id}`);
          }}
        >
          <Typography className="detailName">{obj.quoteName}</Typography>
        </Link>
      )
    ) : (
      <span className="d-flex gap-2 align-items-center">
        <Typography className="detailName">{obj.quoteName}</Typography>{' '}
        <Tooltip title={`${obj.quoteName} belongs to different entity`}>
          <InfoOutlinedIcon fontSize="small" />
        </Tooltip>
      </span>
    );

  const handleViewAll = (detailPage) => {
    switch (detailPage) {
      case 'customerAccount' || 'supplierAccount':
        history.push(routes.quoteBuilder.path, {
          accountId: accountId,
          accountName: accountName,
          resource: `${accountResource}`
        });
        break;
      case 'customerContact' || 'supplierContact':
        history.push(routes.quoteBuilder.path, {
          contactId: contactId,
          contactName: contactName,
          resource: `${contactResource}`
        });
        break;
      case 'opportunity':
        history.push(routes.quoteBuilder.path, {
          opportunityId: opportunityId,
          opportunityName: opportunityName
        });
        break;

      default:
        break;
    }
  };
  return (
    <>
      <Accordion expanded={expandQuote} className="omsAccordian accordQuotes">
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
          <Grid container>
            <Grid item xs={8} alignItems="center">
              <Box component="div" display="flex" alignItems="center" flexGrow={1}>
                <IconButton size="small" onClick={() => setExpandQuote(!expandQuote)}>
                  {expandQuote === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Box padding="5px">
                  <Typography variant="subtitle2">Quotes ({quotes?.length || 0})</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={4} container justify="flex-end" alignItems="center">
              {isAllowedToUpdate && (
                <>
                  <IconButton aria-haspopup="true" color="primary" size="small" onClick={handleOpenMenu}>
                    <MoreVert />
                  </IconButton>
                  <Menu id="menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                    <MenuItem
                      disabled={!quoteBuilderPermission.isCreate}
                      onClick={() => {
                        setShowCreateDialog(true);
                        handleCloseMenu();
                      }}
                    >
                      Create New
                    </MenuItem>
                    {isRenderedInCustomerContact && (
                      <MenuItem
                        disabled={!quoteBuilderPermission.isUpdate}
                        onClick={() => {
                          setShowAddExistingDialog(true);
                          handleCloseMenu();
                        }}
                      >
                        Add Exisiting
                      </MenuItem>
                    )}
                  </Menu>
                </>
              )}
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
                    {quotes.map((obj, index) => (
                      <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={index}>
                        <Card className="detailCard">
                          <CardContent className="detailListing custom_card_style_for_contact_details">
                            <div style={{ width: '5px', backgroundColor: 'var(--secondary)', marginBottom: '10px', borderRadius: '5px' }}> </div>
                            <Grid item xs={12}>
                              <Grid container className="detailCardHeader">
                                <Grid item xs={7} sm={8}>
                                  {!isQuotePrivate(obj) ? (
                                    quoteNameWithRedirect(obj)
                                  ) : obj?.privateAccess === true ? (
                                    [...obj.collaborator, obj.owner].includes(user.user?._id) ? (
                                      quoteNameWithRedirect(obj)
                                    ) : (
                                      <span className="d-flex gap-2 align-items-center">
                                        <Typography className="detailName">{obj.quoteName}</Typography>{' '}
                                        <Tooltip title={`${obj.quoteName} is a Private Quote`}>
                                          <InfoOutlinedIcon fontSize="small" />
                                        </Tooltip>
                                      </span>
                                    )
                                  ) : (
                                    quoteNameWithRedirect(obj)
                                  )}
                                </Grid>
                                <Grid item xs={5} sm={4}>
                                  <Typography
                                    className="amount text-truncate"
                                    title={formatAmountWithCurrency(obj['currency'], obj?.estimatedAmount).fullFormatAmount}
                                  >
                                    {formatAmountWithCurrency(obj['currency'], obj?.estimatedAmount).fullFormatAmount}
                                  </Typography>
                                </Grid>
                              </Grid>
                              <Grid container>
                                <Grid item xs={12} sm={6} md={6} className="buttonClass">
                                  {obj.expiryDate ? (
                                    <DisplayData
                                      key={index}
                                      label="Expiry Date"
                                      value={displayDate(obj.expiryDate)}
                                      icon={<IoCalendarOutline size={15} />}
                                    />
                                  ) : (
                                    ''
                                  )}
                                </Grid>
                                <Grid item xs={12} sm={6} md={6}>
                                  {obj.incoTerms ? (
                                    <DisplayData key={index} label="Inco Terms" value={obj.incoTerms} icon={<BusinessOutlinedIcon />} />
                                  ) : (
                                    ''
                                  )}
                                </Grid>
                                <Grid item xs={12} sm={6} md={6}>
                                  {obj.probability ? (
                                    <DisplayData key={index} label="Probability" value={`${obj.probability} %`} icon={<TrendingUpOutlinedIcon />} />
                                  ) : (
                                    ''
                                  )}
                                </Grid>
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

        {/* <Box margin={1} className="btn-view gap-1" onClick={() => { }} p={1} display="flex" justifyContent="center" alignItems="center">
                <FaEye /> View All &#8599;
            </Box>
            <Box margin={1} /> */}

        <Box
          margin={1}
          className="btn-view gap-1"
          onClick={() => handleViewAll(resourceName)}
          p={1}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <span>View All</span>
          <HiExternalLink size={25} />
        </Box>
      </Accordion>

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
          onSuccess={onSuccess}
          accountId={accountId}
          contactId={contactId}
          marketSegmentId={marketSegmentId}
          subMarketSegmentId={subMarketSegmentId}
          currency={currency}
          estimatedAmount={estimatedAmount}
          opportunityId={opportunityId}
          accountResource={accountResource}
          disableOwnerDropDown={isCreateOwnerDisable}
          isRenderedFromOpportunity={isRenderedFromOpportunity}
          opportunityName={opportunityName}
          isRenderedFromCustomerAccount={isRenderedFromCustomerAccount}
          doaCollaboratorResources={user?.user?.doa?.map((obj) => obj.user)}
        />
      )}
      {showAddExistingDialog && (
        <AssignQuoteDialog
          quoteDialogOpen={showAddExistingDialog}
          handleCloseDialog={() => setShowAddExistingDialog(false)}
          onSuccess={() => {
            setShowAddExistingDialog(false);
            fetchData();
          }}
          assignedQuotes={quotes}
          accountId={accountId}
          contactId={contactId}
        />
      )}
    </>
  );
}
