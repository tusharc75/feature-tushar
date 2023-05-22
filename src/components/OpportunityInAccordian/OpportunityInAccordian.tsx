import React, { useState, useEffect } from 'react';
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
  MenuItem,
  Button,
  ListItemIcon
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';

import { displayDate } from '../../services/util';
import routes from './../../components/Helpers/Routes';
import { Link } from 'react-router-dom';
import ManageOpportunityDialog from '../../pages/Opportunities/ManageOpportunityDialog/ManageOpportunityDialog';
import { useHistory } from 'react-router-dom';
import { IoCalendarOutline } from 'react-icons/io5';
import { BiCustomize } from 'react-icons/bi';
import { useData } from '../../StateProvider/Provider';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { HiExternalLink } from 'react-icons/hi';
import { customerAccount, customerContact, formatAmountWithCurrency } from '../../constants/helpers';
import { MoreVert } from '@material-ui/icons';
import AssignOpportunityDialog from '../AssignRolesDialog/AssignOpportunityDialog';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { Accordion, AccordionSummary, AccordionDetails } from 'src/components/CustomAccordion';
import DisplayData from 'src/CardDisplayData';

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
  isAllowedToUpdate
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

  const [expandOpportunity, setExpandOpportunity] = useState(expanded);
  const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] = useState(false);
  const [showAddOpportunityDialog, setShowAddOpportunityDialog] = useState(false);
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

  const handleEntityChange = (id) => {
    dispatch({ type: SET_SELECTED_ENTITY, payload: id });
  };

  const hasAccessToEntity = (id) => {
    const entityList = user.entity?.map((entity) => entity._id);
    return entityList.includes(id);
  };
  return (
    <>
      <Accordion expanded={expandOpportunity} className={`omsAccordian  `} onChange={() => setExpandOpportunity(!expandOpportunity)}>
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
          <Grid container>
            <Grid item xs={8} alignItems="center">
              <Box display="flex">
                <Box>
                  <IconButton size="small">{expandOpportunity === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                </Box>
                <Box padding="5px">
                  <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                    Opportunity ({opportunities?.length || 0})
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={4} container justify="flex-end" alignItems="center">
              <Typography variant="subtitle2">
                {isAllowedToUpdate && (
                  <>
                    {contactResource === customerContact.contactResource ? (
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
                            disabled={!opportunityPermissions.isCreate}
                            onClick={() => {
                              setShowCreateOpportunityDialog(true);
                              handleCloseMenu();
                            }}
                          >
                            Create New
                          </MenuItem>
                          <MenuItem
                            disabled={!opportunityPermissions.isUpdate}
                            onClick={() => {
                              setShowAddOpportunityDialog(true);
                              handleCloseMenu();
                            }}
                          >
                            Add Exisiting
                          </MenuItem>
                        </Menu>
                      </>
                    ) : (
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
                            disabled={!opportunityPermissions.isCreate}
                            onClick={() => {
                              setShowCreateOpportunityDialog(true);
                              handleCloseMenu();
                            }}
                          >
                            Create New
                          </MenuItem>
                        </Menu>
                      </>
                    )}
                  </>
                )}
              </Typography>
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {expandOpportunity && (
              <>
                {opportunities && opportunities.length ? (
                  <Grid container spacing={1}>
                    {opportunities.map((obj, index) => (
                      <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={index}>
                        <Card className="detailCard  card-v1" variant="outlined">
                          <CardContent className="card-link">
                            <Grid item xs={12}>
                              {hasAccessToEntity(obj.entity) ? (
                                obj.entity === selectedEntity ? (
                                  <Link to={`${routes.opportunityDetail.path}/${obj._id}`}>
                                    <Typography className="detailName">{obj?.opportunityName}</Typography>
                                  </Link>
                                ) : (
                                  <Link
                                    onClick={() => {
                                      handleEntityChange(obj.entity);
                                      history.push(`${routes.opportunityDetail.path}/${obj._id}`);
                                    }}
                                  >
                                    <Typography className="detailName">{obj?.opportunityName}</Typography>
                                  </Link>
                                )
                              ) : (
                                <span className="d-flex gap-2 align-items-center">
                                  <Typography className="detailName">{obj.opportunityName}</Typography>{' '}
                                  <Tooltip title={`${obj.opportunityName} belongs to different entity`}>
                                    <InfoOutlinedIcon fontSize="small" />
                                  </Tooltip>
                                </span>
                              )}

                              <Typography
                                className="amount text-truncate"
                                title={formatAmountWithCurrency(obj?.currency, obj?.estimatedAmount)?.fullFormatAmount}
                              >
                                {formatAmountWithCurrency(obj?.currency, obj?.estimatedAmount)?.fullFormatAmount}
                              </Typography>

                              <Grid container>
                                {obj?.stage ? (
                                  <DisplayData
                                    key={index}
                                    label="Stage"
                                    value={obj?.stage ?? ''}
                                    highlightsHead={true}
                                    icon={<BiCustomize size={15} />}
                                  />
                                ) : (
                                  ''
                                )}
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
                  <Typography variant="subtitle1" color="primary">
                    No Oppourtunity To Show
                  </Typography>
                )}
              </>
            )}
            {opportunities && opportunities.length ? (
              <Box mt={2}>
                <Button
                  className="accordion-outlined-button"
                  onClick={() =>
                    history.push(`/opportunity`, {
                      accountId: accountId,
                      accountName: accountName,
                      resource: `${resource}`
                    })
                  }
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
