import { MoreVert } from '@mui/icons-material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Button, Card, CardContent, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useEffect, useState } from 'react';
import { BiCustomize } from 'react-icons/bi';
import { FaArrowAltCircleDown } from 'react-icons/fa';
import { IoCalendarOutline } from 'react-icons/io5';
import { Link, useHistory } from 'react-router-dom';
import DisplayData from 'src/components/CardDisplayData';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { displayDate } from 'src/constants/helpers';
import { useData } from '../../StateProvider/Provider';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import { formatAmountWithCurrency } from '../../constants/helpers';
import routes from './../../components/Helpers/Routes';
import ManageOpportunityDialog from './../Opportunities/ManageOpportunityDialog';

export default function OpportunityAccordionInUserDetail({ opportunities, expanded = true, recordsPerLine = 2, userId, onSuccess, isAllowedToEdit }) {
  const history = useHistory();

  const {
    state: { permissions, selectedEntity, user },
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

  const [maxRecordsToShow, setMaxRecordsToShow] = useState(recordsPerLine);
  const [expandOpportunity, setExpandOpportunity] = useState(expanded);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] = useState(false);

  useEffect(() => {
    let isExpanded = expandOpportunity;
    if (opportunities?.length === 0 && isExpanded) isExpanded = false;
    else if (opportunities?.length > 0 && !isExpanded) isExpanded = true;

    setExpandOpportunity(isExpanded);
  }, [opportunities]);

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

  return (
    <>
      <Accordion expanded={expandOpportunity} className="accordOpportunity" onChange={(event) => setExpandOpportunity(!expandOpportunity)}>
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
          <div className="flex items-center justify-between">
            <Typography variant="subtitle2">Opportunity ({opportunities?.length ? opportunities.length : 0})</Typography>
            {isAllowedToEdit && (
              <>
                {
                  // permissions?.opportunity?.isCreate && <IconButton
                  //     color="primary"
                  //     size="small"
                  //     onClick={() => { setShowCreateOpportunityDialog(true) }}
                  // >
                  //     <ControlPointIcon />
                  // </IconButton>
                  permissions?.opportunity?.isCreate && (
                    <>
                      <IconButton
                        aria-haspopup="true"
                        color="primary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleOpenMenu(e);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                      <Menu id="menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                        <MenuItem
                          onClick={() => {
                            setShowCreateOpportunityDialog(true);
                            handleCloseMenu();
                          }}
                        >
                          Create New
                        </MenuItem>
                      </Menu>
                    </>
                  )
                }
              </>
            )}
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <>
            {expandOpportunity && (
              <>
                {opportunities && opportunities?.length ? (
                  <Grid container spacing={1}>
                    {opportunities.slice(0, maxRecordsToShow).map((obj, index) => (
                      <Grid size={{ xs: 12, sm: 12, md: recordsPerLineInLargeScreen }} key={index}>
                        <Card className="detailCard  card-v1" variant="outlined">
                          <CardContent className="card-link">
                            <Grid container className="detailCardHeader">
                              <Grid size={{ xs: 7, sm: 8 }}>
                                {hasAccessToEntity(obj.entity) ? (
                                  obj.entity === selectedEntity ? (
                                    <Link
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="link"
                                      to={`${routes.opportunityDetail.path}/${obj._id}`}
                                    >
                                      <Typography className="detailName">{obj?.opportunityName}</Typography>
                                    </Link>
                                  ) : (
                                    <Link
                                      className="link"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      to={`${routes.opportunityDetail.path}/${obj._id}`}
                                      onClick={() => {
                                        handleEntityChange(obj.entity);
                                      }}
                                    >
                                      <Typography className="detailName">{obj?.opportunityName}</Typography>
                                    </Link>
                                  )
                                ) : (
                                  <span className="d-flex align-items-center gap-2">
                                    <Typography className="detailName">{obj.opportunityName}</Typography>{' '}
                                    <HtmlTooltip title={`${obj.opportunityName} belongs to different entity`}>
                                      <InfoOutlinedIcon fontSize="small" />
                                    </HtmlTooltip>
                                  </span>
                                )}
                              </Grid>
                              <Grid size={{ xs: 5, sm: 4 }}>
                                <Typography
                                  className="amount"
                                  title={formatAmountWithCurrency(obj['currency'], obj?.estimatedAmount).fullFormatAmount}
                                >
                                  {formatAmountWithCurrency(obj['currency'], obj?.estimatedAmount).fullFormatAmount}
                                </Typography>
                              </Grid>
                            </Grid>
                            <Grid container>
                              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                {obj?.stage ? (
                                  <DisplayData key={index} label="Stage" value={obj?.stage ?? ''} icon={<BiCustomize size={15} />} />
                                ) : (
                                  ''
                                )}
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6, md: 6 }}>
                                {obj.closeDate ? (
                                  <DisplayData
                                    key={index}
                                    label="Closing Date"
                                    value={displayDate(obj.closeDate)}
                                    icon={<IoCalendarOutline size={15} />}
                                  />
                                ) : (
                                  ''
                                )}
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="subtitle1">No Opportunities To Show</Typography>
                )}
              </>
            )}
            {opportunities?.length > 0 && opportunities.length > maxRecordsToShow && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  onClick={() => {
                    setMaxRecordsToShow((prevState) => prevState + recordsPerLine * 2);
                  }}
                  endIcon={<FaArrowAltCircleDown size={25} />}
                  className="accordion-outlined-button"
                >
                  <span className="show_more_text">Show More</span>
                </Button>
              </Box>
            )}
          </>
        </AccordionDetails>
      </Accordion>

      {showCreateOpportunityDialog && (
        <ManageOpportunityDialog
          isNew={true}
          opportunityId={null}
          open={showCreateOpportunityDialog}
          onClose={() => setShowCreateOpportunityDialog(false)}
          onSuccess={() => {
            setShowCreateOpportunityDialog(false);
            onSuccess();
            // onNewOpportunityAdd();
          }}
          isRedirectTodetailPage={false}
          resource={null}
          userId={userId}
        />
      )}
    </>
  );
}
