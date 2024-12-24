import { Box, Button, Card, CardContent, Grid, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useEffect, useState } from 'react';
import { IoCalendarOutline } from 'react-icons/io5';
import { Link, useHistory } from 'react-router-dom';
import DisplayData from 'src/components/CardDisplayData';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import { useData } from '../../StateProvider/Provider';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import { formatAmountWithCurrency } from '../../constants/helpers';
import ManageQuoteDialog from '../../pages/QuoteBuilderCombined/ManageQuote/ManageQuoteDialog';
import { displayDate } from '../../services/util';
import HtmlTooltip from '../CustomTooltipTitle';
import routes from '../Helpers/Routes';
import AssignQuoteDialog from './AssignQuoteDialog';

export default function QuotesInAccordion({
  expanded = false,
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
  allowedToEdit,
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
        <Link className="link" to={`${routes.quoteBuilder.path}/detail/${obj._id}`} target="_blank" rel="noopener noreferrer">
          <Typography className="detailName">{obj.quoteName}</Typography>
        </Link>
      ) : (
        <Link
          target="_blank"
          rel="noopener noreferrer"
          className="link"
          to={`${routes.quoteBuilder.path}/detail/${obj._id}`}
          onClick={() => {
            handleEntityChange(obj.entity);
          }}
        >
          <Typography className="detailName">{obj.quoteName}</Typography>
        </Link>
      )
    ) : (
      <span className="d-flex align-items-center gap-2">
        <Typography className="detailName">{obj.quoteName}</Typography>{' '}
        <HtmlTooltip title={`${obj.quoteName} belongs to different entity`}>
          <InfoOutlinedIcon fontSize="small" />
        </HtmlTooltip>
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
      <Accordion expanded={expandQuote} className="omsAccordian" onChange={() => setExpandQuote(!expandQuote)}>
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
          <Grid container>
            <Grid item xs={8} alignItems="center">
              <Box component="div" display="flex" alignItems="center" flexGrow={1}>
                <IconButton size="small">{expandQuote === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                <Box padding="5px">
                  <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                    Quotes ({quotes?.length || 0})
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={4} container justify="flex-end" alignItems="center">
              {allowedToEdit && (
                <>
                  <IconButton
                    aria-haspopup="true"
                    color="primary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenMenu(e);
                    }}
                  >
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
        <AccordionDetails>
          <Box>
            {expandQuote && (
              <>
                {quotes && quotes?.length ? (
                  <Grid container spacing={1}>
                    {quotes.map((obj, index) => (
                      <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={index}>
                        <Card className="detailCard  card-v1" variant="outlined">
                          <CardContent className="card-link">
                            {/* <div style={{ width: '5px', backgroundColor: 'var(--secondary)', marginBottom: '10px', borderRadius: '5px' }}> </div> */}
                            {!isQuotePrivate(obj) ? (
                              quoteNameWithRedirect(obj)
                            ) : obj?.privateAccess === true ? (
                              [...obj.collaborator, obj.owner].includes(user.user?._id) ? (
                                quoteNameWithRedirect(obj)
                              ) : (
                                <span className="d-flex align-items-center gap-2">
                                  <Typography className="detailName">{obj.quoteName}</Typography>{' '}
                                  <HtmlTooltip title={`${obj.quoteName} is a Private Quote`}>
                                    <InfoOutlinedIcon fontSize="small" />
                                  </HtmlTooltip>
                                </span>
                              )
                            ) : (
                              quoteNameWithRedirect(obj)
                            )}
                            <Typography
                              className="amount text-truncate"
                              title={formatAmountWithCurrency(obj['currency'], obj?.estimatedAmount).fullFormatAmount}
                            >
                              {formatAmountWithCurrency(obj['currency'], obj?.estimatedAmount).fullFormatAmount}
                            </Typography>
                            <Grid item xs={12}>
                              <Grid container>
                                <Grid item xs={12} sm={6} md={6} className="buttonClass">
                                  {obj.expiryDate ? (
                                    <DisplayData
                                      key={index}
                                      label="Expiry Date"
                                      value={displayDate(obj.expiryDate)}
                                      icon={<IoCalendarOutline size={15} />}
                                      highlightsHead={true}
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
                ) : (
                  <Typography variant="subtitle1" color="primary">
                    No Quotes To Show
                  </Typography>
                )}
              </>
            )}
            {quotes && quotes?.length ? (
              <Box mt={2}>
                <Button
                  className="accordion-outlined-button"
                  onClick={() => handleViewAll(resourceName)}
                  startIcon={<VisibilityIcon />}
                  variant="outlined"
                >
                  <span>View All</span>
                </Button>
              </Box>
            ) : null}
          </Box>
        </AccordionDetails>
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
