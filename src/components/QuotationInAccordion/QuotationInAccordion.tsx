import { Box, Button, Card, CardContent, Grid, IconButton, Menu, MenuItem, Typography } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import BusinessOutlinedIcon from '@material-ui/icons/BusinessOutlined';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import TrendingUpOutlinedIcon from '@material-ui/icons/TrendingUpOutlined';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { useEffect, useState } from 'react';
import { IoCalendarOutline } from 'react-icons/io5';
import { Link, useHistory } from 'react-router-dom';
import DisplayData from 'src/components/CardDisplayData';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import { useData } from '../../StateProvider/Provider';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import { formatAmountWithCurrency } from '../../constants/helpers';
import { displayDate } from '../../services/util';
import HtmlTooltip from '../CustomTooltipTitle';
import routes from '../Helpers/Routes';
import ManageQuotationDialog from 'src/pages/Quotation/ManageQuotationDialog';

export default function QuotesInAccordion({
  expanded = false,
  recordsPerLine = 2,
  quotations,
  fetchData,
  quotationPermission,
  opportunityId = null,
  opportunityName = null,
  isAllowedToUpdate,
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

  const [expandQuotation, setExpandQuotation] = useState(expanded);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [resourceName, setResourceName] = useState('');

  const onSuccess = () => {
    setShowCreateDialog(false);
    fetchData();
  };
  useEffect(() => {
    let isExpanded = expandQuotation;
    if (quotations?.length === 0 && isExpanded) isExpanded = false;
    else if (quotations?.length > 0 && !isExpanded) isExpanded = true;

    setExpandQuotation(isExpanded);
    setResourceName('opportunity');
  }, [quotations, resourceName]);

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
        <Link className="link" to={`${routes.quotation.path}/detail/${obj._id}`} target="_blank" rel="noopener noreferrer">
          <Typography className="detailName">{obj.quotationNumber}</Typography>
        </Link>
      ) : (
        <Link
          target="_blank"
          rel="noopener noreferrer"
          className="link"
          to={`${routes.quotation.path}/detail/${obj._id}`}
          onClick={() => {
            handleEntityChange(obj.entity);
          }}
        >
          <Typography className="detailName">{obj.quotationNumber}</Typography>
        </Link>
      )
    ) : (
      <span className="d-flex gap-2 align-items-center">
        <Typography className="detailName">{obj.quotationNumber}</Typography>{' '}
        <HtmlTooltip title={`${obj.quotationNumber} belongs to different entity`}>
          <InfoOutlinedIcon fontSize="small" />
        </HtmlTooltip>
      </span>
    );

  const handleViewAll = (detailPage) => {
    history.push(routes.quotation.path, {
        opportunityId: opportunityId,
        opportunityName: opportunityName
      });
  };
  return (
    <>
      <Accordion expanded={expandQuotation} className="omsAccordian" onChange={() => setExpandQuotation(!expandQuotation)}>
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
          <Grid container>
            <Grid item xs={8} alignItems="center">
              <Box component="div" display="flex" alignItems="center" flexGrow={1}>
                <IconButton size="small">{expandQuotation === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                <Box padding="5px">
                  <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                    Quotations ({quotations?.length || 0})
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={4} container justify="flex-end" alignItems="center">
              {isAllowedToUpdate && (
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
                      disabled={!quotationPermission.isCreate}
                      onClick={() => {
                        setShowCreateDialog(true);
                        handleCloseMenu();
                      }}
                    >
                      Create New
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {expandQuotation && (
              <>
                {quotations && quotations?.length ? (
                  <Grid container spacing={1}>
                    {quotations.map((obj, index) => (
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
                                <span className="d-flex gap-2 align-items-center">
                                  <Typography className="detailName">{obj.quotationNumber}</Typography>{' '}
                                  <HtmlTooltip title={`${obj.quotationNumber} is a Private Quote`}>
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
                    No Quotations To Show
                  </Typography>
                )}
              </>
            )}
            {quotations && quotations?.length ? (
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
        <ManageQuotationDialog
          isClone={false}
          quotationId={null}
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={(data) => {
            setShowCreateDialog(false);
            fetchData();
          }}
          referenceData={{ opportunity: opportunityId }}
          renderedFrom={routes.projectSales.title}
        />
      )}
    </>
  );
}
