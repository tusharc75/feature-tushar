import { MoreVert } from '@mui/icons-material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Button, Card, CardContent, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useEffect, useState } from 'react';
import { BiCustomize, BiPhone } from 'react-icons/bi';
import { BsBuilding } from 'react-icons/bs';
import { FaArrowAltCircleDown } from 'react-icons/fa';
import { HiOutlineUser } from 'react-icons/hi';
import { Link, useHistory } from 'react-router-dom';
import DisplayData from 'src/components/CardDisplayData';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useData } from '../../StateProvider/Provider';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import ManageLeadDialog from '../Leads/ManageLeadDialog/ManageLeadDialog';
import routes from './../../components/Helpers/Routes';

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
          <div className="flex items-center justify-between">
            <Typography variant="subtitle2">Leads ({leads?.length ? leads.length : 0})</Typography>
            {isAllowedToEdit && permissions?.lead?.isCreate && (
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
                      setShowCreateLeadDialog(true);
                      handleCloseMenu();
                    }}
                  >
                    Create New
                  </MenuItem>
                </Menu>
              </>
            )}
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <>
            {expandLead && (
              <>
                {leads && leads?.length ? (
                  <Grid container spacing={1}>
                    {leads.slice(0, maxRecordsToShow).map((obj, index) => (
                      <Grid size={{ xs: 12, sm: 12, md: recordsPerLineInLargeScreen }} key={index}>
                        <Card className="detailCard  card-v1" variant="outlined">
                          <CardContent className="card-link">
                            <Grid size={{ xs: 12, sm: 8 }}>
                              {hasAccessToEntity(obj.entity) ? (
                                obj.entity === selectedEntity ? (
                                  <Link className="link" target="_blank" rel="noopener noreferrer" to={`${routes.leadDetail.path}/${obj._id}`}>
                                    <Typography>
                                      {obj?.firstName} {obj?.lastName}{' '}
                                    </Typography>
                                  </Link>
                                ) : (
                                  <Link
                                    className="link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    to={`${routes.leadDetail.path}/${obj._id}`}
                                    onClick={() => {
                                      handleEntityChange(obj.entity);
                                    }}
                                  >
                                    <Typography>
                                      {obj?.firstName} {obj?.lastName}{' '}
                                    </Typography>
                                  </Link>
                                )
                              ) : (
                                <span className="d-flex align-items-center gap-2">
                                  <Typography>
                                    {obj.firstName} {obj.lastName}
                                  </Typography>{' '}
                                  <HtmlTooltip title={`${obj.firstName} ${obj.lastName} belongs to different entity`}>
                                    <InfoOutlinedIcon fontSize="small" />
                                  </HtmlTooltip>
                                </span>
                              )}
                            </Grid>

                            <Grid container>
                              <Grid size={{ xs: 12, sm: 12, md: 12 }}>
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
                              <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                                {obj.status ? <DisplayData label="Status" icon={<BiCustomize size={15} />} value={obj?.status ?? ''} /> : ''}
                              </Grid>
                              <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                                {obj.company ? <DisplayData label="Company" icon={<BsBuilding size={15} />} value={obj.company ?? ''} /> : ''}
                              </Grid>
                              <Grid size={{ xs: 12, sm: 12, md: 12 }}>
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
          isRedirectToDetailPage={false}
        />
      )}
    </>
  );
}
