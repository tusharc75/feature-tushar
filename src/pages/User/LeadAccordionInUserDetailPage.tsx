import React, { useState, useEffect } from 'react';
import { Grid, Box, IconButton, Typography, Card, CardContent, Tooltip, MenuItem, Menu, Button } from '@material-ui/core';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import { withStyles } from '@material-ui/core/styles';
import routes from './../../components/Helpers/Routes';
import { Link, useHistory } from 'react-router-dom';
import { BiCustomize } from 'react-icons/bi';
import { HiOutlineUser } from 'react-icons/hi';
import { BiPhone } from 'react-icons/bi';
import { BsBuilding } from 'react-icons/bs';
import { useData } from '../../StateProvider/Provider';
import ManageLeadDialog from '../Leads/ManageLeadDialog/ManageLeadDialog';
import { FaArrowAltCircleDown } from 'react-icons/fa';
import { MoreVert } from '@material-ui/icons';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import DisplayData from 'src/CardDisplayData';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';

export default function LeadAccordionInUserDetailPage({ leads, expanded = true, recordsPerLine = 3, userId, onSuccess, isAllowedToEdit }) {
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
  const [expandLead, setExpandLead] = useState(expanded);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showCreateLeadDialog, setShowCreateLeadDialog] = useState(false);

  useEffect(() => {
    let isExpanded = expandLead;
    if (leads?.length === 0 && isExpanded) isExpanded = false;
    else if (leads?.length > 0 && !isExpanded) isExpanded = true;

    setExpandLead(isExpanded);
  }, [leads]);

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
      <Accordion expanded={expandLead} className=" accordLead" onChange={(event) => setExpandLead(!expandLead)}>
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
          <Grid container className="pos_rel">
            <Grid item xs={8}>
              <Box display="flex">
                <Box>
                  <IconButton size="small">{expandLead === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                </Box>
                <Box padding="5px">
                  <Typography variant="subtitle2">Leads ({leads?.length ? leads.length : 0})</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={4} container justify="flex-end" alignItems="center">
              <Typography variant="subtitle2">
                {isAllowedToEdit && (
                  <>
                    {permissions?.lead?.isCreate && (
                      <>
                        <IconButton aria-haspopup="true" color="primary" size="small" onClick={handleOpenMenu}>
                          <MoreVert />
                        </IconButton>
                        <Menu id="menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                          <MenuItem
                            onClick={() => {
                              setShowCreateLeadDialog(true);
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
          <>
            {expandLead && (
              <>
                {leads && leads?.length ? (
                  <Grid container spacing={1}>
                    {leads.slice(0, maxRecordsToShow).map((obj, index) => (
                      <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={index}>
                        <Card className="detailCard  card-v1" variant="outlined">
                          <CardContent className="card-link">
                            <Grid item xs={12} sm={8}>
                              {hasAccessToEntity(obj.entity) ? (
                                obj.entity === selectedEntity ? (
                                  <Link className="link" to={`${routes.leadDetail.path}/${obj._id}`}>
                                    <Typography>
                                      {obj?.firstName} {obj?.lastName}{' '}
                                    </Typography>
                                  </Link>
                                ) : (
                                  <Link
                                    className="link"
                                    onClick={() => {
                                      handleEntityChange(obj.entity);
                                      history.push(`${routes.leadDetail.path}/${obj._id}`);
                                    }}
                                  >
                                    <Typography>
                                      {obj?.firstName} {obj?.lastName}{' '}
                                    </Typography>
                                  </Link>
                                )
                              ) : (
                                <span className="d-flex gap-2 align-items-center">
                                  <Typography>
                                    {obj.firstName} {obj.lastName}
                                  </Typography>{' '}
                                  <Tooltip title={`${obj.firstName} ${obj.lastName} belongs to different entity`}>
                                    <InfoOutlinedIcon fontSize="small" />
                                  </Tooltip>
                                </span>
                              )}
                            </Grid>

                            <Grid container>
                              <Grid item xs={12} sm={12} md={12}>
                                {obj.firstName ? (
                                  <DisplayData
                                    label="Name"
                                    icon={<HiOutlineUser size={15} />}
                                    value={[obj?.firstName, obj?.lastName].filter((f) => f).join(' ')}
                                  />
                                ) : (
                                  ''
                                )}
                              </Grid>
                              <Grid item xs={12} sm={12} md={12}>
                                {obj.status ? <DisplayData label="Status" icon={<BiCustomize size={15} />} value={obj?.status ?? ''} /> : ''}
                              </Grid>
                              <Grid item xs={12} sm={12} md={12}>
                                {obj.company ? <DisplayData label="Company" icon={<BsBuilding size={15} />} value={obj.company ?? ''} /> : ''}
                              </Grid>
                              <Grid item xs={12} sm={12} md={12}>
                                {obj.phone ? <DisplayData label="phone" icon={<BiPhone size={15} />} value={obj.phone ?? ''} /> : ''}
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="subtitle1">No Leads To Show</Typography>
                )}
              </>
            )}
            {leads?.length > 0 && leads.length > maxRecordsToShow && (
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

      {showCreateLeadDialog && (
        <ManageLeadDialog
          open={showCreateLeadDialog}
          onSuccess={() => {
            setShowCreateLeadDialog(false);
            onSuccess();
          }}
          onClose={() => setShowCreateLeadDialog(false)}
          isNew={true}
          dataToUpdate={null}
          leadApi={routes.lead.path}
          isRedirectToDetailPage={false}
          userId={userId}
        />
      )}
    </>
  );
}
