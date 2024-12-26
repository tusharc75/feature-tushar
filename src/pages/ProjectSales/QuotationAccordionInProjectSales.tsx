import { Box, Button, Card, CardContent, Grid, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import React, { useContext, useEffect, useState } from 'react';
import { FaArrowAltCircleDown } from 'react-icons/fa';
import { IoCalendarOutline } from 'react-icons/io5';
import DisplayData from 'src/components/CardDisplayData';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import axiosInstance from '../../axios/axiosInstance';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import { formatAmountWithCurrency } from '../../constants/helpers';
import ManageQuotationDialog from '../../pages/Quotation/ManageQuotationDialog';
import { displayDate } from 'src/constants/helpers';
import styles from './ProjectSales.module.scss';

export default function QuotationAccordionInProjectSales({
  expanded = true,
  recordsPerLine = 2,
  quotations,
  permissions,
  accountId = null,
  projectId,
  addExisting,
  fetchProjectData,
  isTeamMember,
  isManager,
  onNewQuotationAdd
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

  const [expandQuotation, setExpandQuotation] = useState(expanded);
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
    let isExpanded = expandQuotation;
    if (quotations?.length === 0 && isExpanded) isExpanded = false;
    else if (quotations?.length > 0 && !isExpanded) isExpanded = true;

    setExpandQuotation(isExpanded);
  }, [quotations]);
  const handleRemove = (rec) => {
    setShowConfirmBox(true);
    setRemoveRec(rec);
  };

  const removeQuotation = () => {
    if (!removeRec) return;

    const dataObj = {
      quotation: quotations?.filter((o) => o?._id !== removeRec?._id).map((o) => o?._id),
      _id: projectId
    };

    axiosInstance()
      .put(`/project-sales/add-quotation`, dataObj)
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

  const isQuotationPrivate = (obj) => {
    return 'privateAccess' in obj;
  };
  const quotationNameWithRedirect = (obj) =>
    hasAccessToEntity(obj.entity) ? (
      obj.entity === selectedEntity ? (
        <p className="link text-truncate" onClick={() => window.open(`${routes.quotationDetail.path}/${obj._id}`)}>
          <Typography className="detailName">{obj.quotationNumber}</Typography>
        </p>
      ) : (
        <p
          className="link text-truncate"
          onClick={() => {
            handleEntityChange(obj.entity);
            window.open(`${routes.quotationDetail.path}/${obj._id}`);
          }}
        >
          <Typography className="detailName">{obj.quotationNumber}</Typography>
        </p>
      )
    ) : (
      <span className="d-flex align-items-center gap-2">
        <Typography className="detailName">{obj.quotationNumber}</Typography>{' '}
        <HtmlTooltip title={`${obj.quotationNumber} belongs to different entity`}>
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
            addExisting('quotation', accountId);
            handleCloseMenu();
          }}
        >
          Add Exisiting
        </MenuItem>
      </Menu>
      <Accordion expanded={expandQuotation} onChange={() => setExpandQuotation(!expandQuotation)}>
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header pos_rel">
          <Grid container>
            <Grid item xs={8} alignItems="center">
              <Box component="div" display="flex" alignItems="center" flexGrow={1}>
                <IconButton size="small" onClick={() => setExpandQuotation(!expandQuotation)}>
                  {expandQuotation === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Box padding="5px">
                  <Typography variant="subtitle2">Quotations ({quotations?.length || 0})</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={4} container justify="flex-end" alignItems="center">
              {(permissions?.isUpdate && isTeamMember) || isManager ? (
                <IconButton aria-haspopup="true" color="primary" size="small" onClick={handleClick}>
                  <MoreVert />
                </IconButton>
              ) : null}
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          <>
            {expandQuotation && (
              <>
                {quotations && quotations?.length ? (
                  <Grid container className={styles.opportunity_layout}>
                    {quotations.slice(0, maxRecordsToShow).map((obj, i) => (
                      <Grid item className={styles.opportunity_layout_container}>
                        <Card className="detailCard  card-v1" variant="outlined">
                          <CardContent className="card-link">
                            <Grid item xs={12}>
                              <Grid container className="detailCardHeader">
                                <Grid item xs={6}>
                                  {!isQuotationPrivate(obj) ? (
                                    quotationNameWithRedirect(obj)
                                  ) : obj?.privateAccess === true ? (
                                    [...obj.collaborator, obj.owner].includes(user.user?._id) ? (
                                      quotationNameWithRedirect(obj)
                                    ) : (
                                      <span className="d-flex align-items-center gap-2">
                                        <Typography className="detailName">{obj.quotationNumber}</Typography>{' '}
                                        <HtmlTooltip title={`${obj.quotationNumber} is a Private Quotation`}>
                                          <InfoOutlinedIcon fontSize="small" />
                                        </HtmlTooltip>
                                      </span>
                                    )
                                  ) : (
                                    quotationNameWithRedirect(obj)
                                  )}
                                </Grid>
                                <Grid item xs={6}>
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
                                        <IconButton title={`Remove quotation ${obj.quotationNumber}`} size="small" onClick={() => handleRemove(obj)}>
                                          <DeleteOutlineIcon fontSize="small" color="error" />
                                        </IconButton>
                                      </>
                                    ) : null}
                                  </Box>
                                </Grid>
                              </Grid>

                              <Grid container>
                                <Grid item xs={12} sm={6} md={6}>
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
                                <Grid item xs={12} sm={6} md={6} className={styles.opportunity_closed_date}>
                                  {obj.incoTerms ? (
                                    <DisplayData key={i} label="Inco Terms" value={obj.incoTerms} icon={<BusinessOutlinedIcon />} />
                                  ) : (
                                    ''
                                  )}
                                </Grid>
                                <Grid item xs={12} sm={6} md={6}>
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
                  <Typography variant="subtitle1">No Quotations To Show</Typography>
                )}
              </>
            )}
            {quotations?.length > 0 && quotations.length > maxRecordsToShow && (
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
          message={removeRec ? `Are you sure you want to remove quotation  ${removeRec.quotationNumber}` : ''}
          onClose={() => {
            setShowConfirmBox(false);
            if (removeRec) setRemoveRec(null);
          }}
          onOk={removeRec ? removeQuotation : null}
        />
      ) : null}

      {showCreateDialog && (
        <ManageQuotationDialog
          isClone={false}
          quotationId={null}
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={(data) => {
            setShowCreateDialog(false);
            onNewQuotationAdd(data?._id);
          }}
          referenceData={{ customerAccount: accountId }}
          isRedirectTodetailPage={false}
        />
      )}
    </>
  );
}
