import { MoreVert } from '@mui/icons-material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import { Box, Button, Card, CardContent, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import React, { useContext, useEffect, useState } from 'react';
import { FaArrowAltCircleDown } from 'react-icons/fa';
import { IoCalendarOutline } from 'react-icons/io5';
import { useHistory } from 'react-router-dom';
import DisplayData from 'src/components/CardDisplayData';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { displayDate } from 'src/constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import axiosInstance from '../../axios/axiosInstance';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import { formatAmountWithCurrency } from '../../constants/helpers';
import ManageQuoteDialog from '../../pages/QuoteBuilderCombined/ManageQuote/ManageQuoteDialog';
import styles from './ProjectSales.module.scss';

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
  currency,
  estimatedAmount,
  marketSegmentId,
  subMarketSegmentId,
  isFromProjectSales = false,
  projectSalesTeam = []
}) {
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
  const { setToastConfig } = useContext(CustomToastContext);
  const history = useHistory();
  const [expandQuote, setExpandQuote] = useState(expanded);
  const [maxRecordsToShow, setMaxRecordsToShow] = useState(recordsPerLine);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [removeRec, setRemoveRec] = useState(null);

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
      quoteBuilder: quotes.filter((o) => o._id !== removeRec._id).map((o) => o._id),
      _id: projectId
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

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const hasAccessToEntity = (id) => {
    const entityList = user.entity?.map((entity) => entity._id);
    return entityList.includes(id);
  };
  const handleEntityChange = (id) => {
    dispatch({ type: SET_SELECTED_ENTITY, payload: id });
  };

  const isQuotePrivate = (obj) => {
    return 'privateAccess' in obj;
  };
  const quoteNameWithRedirect = (obj) =>
    hasAccessToEntity(obj.entity) ? (
      obj.entity === selectedEntity ? (
        <p className="link text-truncate" onClick={() => window.open(`${routes.quoteBuilder.path}/detail/${obj._id}`)}>
          <Typography className="detailName">{obj.quoteName}</Typography>
        </p>
      ) : (
        <p
          className="link text-truncate"
          onClick={() => {
            handleEntityChange(obj.entity);
            window.open(`${routes.quoteBuilder.path}/detail/${obj._id}`);
          }}
        >
          <Typography className="detailName">{obj.quoteName}</Typography>
        </p>
      )
    ) : (
      <span className="d-flex align-items-center gap-2">
        <Typography className="detailName">{obj.quoteName}</Typography>{' '}
        <HtmlTooltip title={`${obj.quoteName} belongs to different entity`}>
          <InfoOutlinedIcon fontSize="small" />
        </HtmlTooltip>
      </span>
    );
  return (
    <>
      <Menu id="menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
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
            addExisting('quote-builder', accountId);
            handleCloseMenu();
          }}
        >
          Add Exisiting
        </MenuItem>
      </Menu>
      <Accordion expanded={expandQuote} onChange={() => setExpandQuote(!expandQuote)}>
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header pos_rel">
          <div className="flex items-center justify-between">
            <Typography variant="subtitle2">Quotes ({quotes?.length || 0})</Typography>
            {(permissions?.isUpdate && isTeamMember) || isManager ? (
              <IconButton
                aria-haspopup="true"
                color="primary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleClick(e);
                }}
              >
                <MoreVert />
              </IconButton>
            ) : null}
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <>
            {expandQuote && (
              <>
                {quotes && quotes?.length ? (
                  <Grid container className={styles.opportunity_layout}>
                    {quotes.slice(0, maxRecordsToShow).map((obj, i) => (
                      <Grid
                        // xs={12}
                        // sm={12}
                        // md={recordsPerLineInLargeScreen}
                        className={styles.opportunity_layout_container}
                      >
                        <Card className="detailCard  card-v1" variant="outlined">
                          <CardContent className="card-link">
                            <Grid size={{ xs: 12 }}>
                              <Grid container className="detailCardHeader">
                                <Grid size={{ xs: 6 }}>
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
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                  <Box display="flex" alignItems="center" justifyContent="flex-end">
                                    {obj?.estimatedAmount ? (
                                      <Typography
                                        className="amount"
                                        title={formatAmountWithCurrency(obj['currency'], obj?.estimatedAmount).fullFormatAmount}
                                      >
                                        {formatAmountWithCurrency(obj['currency'], obj?.estimatedAmount).fullFormatAmount}
                                      </Typography>
                                    ) : (
                                      ''
                                    )}
                                    {(permissions?.isUpdate && isTeamMember) || isManager ? (
                                      <>
                                        <Box ml={1} />
                                        <IconButton title={`Remove quote ${obj.quoteName}`} size="small" onClick={() => handleRemove(obj)}>
                                          <DeleteOutlineIcon fontSize="small" color="error" />
                                        </IconButton>
                                      </>
                                    ) : null}
                                  </Box>
                                </Grid>
                              </Grid>

                              <Grid container>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                  {obj.expiryDate ? (
                                    <DisplayData
                                      key={i}
                                      label="Closing Date"
                                      value={displayDate(obj.expiryDate)}
                                      icon={<IoCalendarOutline size={15} />}
                                    />
                                  ) : (
                                    ''
                                  )}
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }} className={styles.opportunity_closed_date}>
                                  {obj.incoTerms ? (
                                    <DisplayData key={i} label="Inco Terms" value={obj.incoTerms} icon={<BusinessOutlinedIcon />} />
                                  ) : (
                                    ''
                                  )}
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                  {obj.probability ? (
                                    <DisplayData key={i} label="Probability" value={`${obj.probability} %`} icon={<TrendingUpOutlinedIcon />} />
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
                  <Typography variant="subtitle1">No Quotes To Show</Typography>
                )}
              </>
            )}
            {quotes?.length > 0 && quotes.length > maxRecordsToShow && (
              <Button
                onClick={() => {
                  setMaxRecordsToShow((prevState) => prevState + recordsPerLine * 2);
                }}
                className="accordion-outlined-button"
                endIcon={<FaArrowAltCircleDown size={25} />}
                style={{ margin: '10px auto 0', display: 'flex' }}
              >
                <span className="show_more_text">Show More</span>
              </Button>
            )}
          </>
        </AccordionDetails>
      </Accordion>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={removeRec ? `Are you sure you want to remove quote  ${removeRec.quoteName}` : ''}
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
          currency={currency}
          estimatedAmount={estimatedAmount}
          marketSegmentId={marketSegmentId}
          subMarketSegmentId={subMarketSegmentId}
          isRenderedFromProjectSales={true}
          doaCollaboratorResources={user?.user?.doa?.map((obj) => obj.user)}
          isFromProjectSales={isFromProjectSales}
          projectSalesTeam={projectSalesTeam}
        />
      )}
    </>
  );
}
