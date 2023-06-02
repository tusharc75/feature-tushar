import { useState, useContext } from 'react';
import { withStyles } from '@material-ui/core/styles';
import {
  Grid,
  Button,
  Box,
  IconButton,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip
} from '@material-ui/core';
import { HiExternalLink } from 'react-icons/hi';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import MoreVert from '@material-ui/icons/MoreVert';
import { Link, useHistory } from 'react-router-dom';
import { IoCalendarOutline } from 'react-icons/io5';
import { BiCustomize } from 'react-icons/bi';
import { FaArrowAltCircleDown } from 'react-icons/fa';

import { displayDate } from '../../services/util';
import routes from './../../components/Helpers/Routes';
import NewOpportunityProjectSales from './NewOpportunityProjectSales';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import { formatAmountWithCurrency } from '../../constants/helpers';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import styles from './ProjectSales.module.scss';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import DisplayData from 'src/components/CardDisplayData';

export default function OpportunityAccordianProjectSales({
  opportunities,
  onNewOpportunityAdd,
  accountId,
  accountName,
  expanded = true,
  recordsPerLine = 2,
  permissions,
  resource,
  isRedirect,
  collaborators,
  addExisting,
  projectId,
  fetchProjectData,
  isTeamMember,
  isManager,
  users
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
  const { setToastConfig } = useContext(CustomToastContext);
  const [maxRecordsToShow, setMaxRecordsToShow] = useState(recordsPerLine);
  const [expandOpportunity, setExpandOpportunity] = useState(expanded);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [removeRec, setRemoveRec] = useState(null);
  const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // useEffect(() => {
  //   let isExpanded = expandOpportunity;
  //   if (opportunities.length === 0 && isExpanded) isExpanded = false;
  //   else if (opportunities.length > 0 && !isExpanded) isExpanded = true;

  //   setExpandOpportunity(isExpanded);
  // }, [opportunities]);

  const handleRemove = (rec) => {
    setShowConfirmBox(true);
    setRemoveRec(rec);
  };

  const removeOpp = () => {
    if (!removeRec) return;

    const dataObj = {
      opportunity: opportunities.filter((o) => o._id !== removeRec._id).map((o) => o._id),
      _id: projectId
    };

    axiosInstance()
      .put(`/project-sales/add-opportunity`, dataObj)
      .then(() => {
        fetchProjectData();
        setShowConfirmBox(false);
      })
      .catch((error) => {
        setToastConfig(error);
      });
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
      <Menu id="menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            setShowCreateOpportunityDialog(true);
            handleClose();
          }}
        >
          Create New
        </MenuItem>
        <MenuItem
          onClick={() => {
            addExisting('opportunity', accountId);
            handleClose();
          }}
        >
          Add Exisiting
        </MenuItem>
      </Menu>
      <Accordion expanded={expandOpportunity} onChange={() => setExpandOpportunity(!expandOpportunity)}>
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
          <Grid container>
            <Grid item xs={8}>
              <Box component="div" display="flex" alignItems="center" flexGrow={1}>
                <IconButton size="small" onClick={(e) => e.preventDefault()}>
                  {expandOpportunity === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Box>
                  <Typography variant="subtitle2">Opportunity ({opportunities.length})</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={4} container justify="flex-end" alignItems="center">
              <Typography variant="subtitle2">
                {(permissions.isUpdate && isTeamMember) || isManager ? (
                  <IconButton aria-haspopup="true" color="primary" size="small" onClick={handleClick}>
                    <MoreVert />
                  </IconButton>
                ) : null}
              </Typography>
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          <>
            {expandOpportunity && (
              <>
                {opportunities && opportunities?.length ? (
                  <Grid container className={styles.opportunity_layout}>
                    {opportunities.slice(0, maxRecordsToShow).map((obj, index) => (
                      <Grid
                        item
                        // xs={12}
                        // sm={12}
                        // md={recordsPerLineInLargeScreen}
                        key={index}
                        className={styles.opportunity_layout_container}
                      >
                        <Card className="detailCard  card-v1" variant="outlined">
                          <CardContent className="card-link">
                            <Grid item xs={12}>
                              <Grid container className="detailCardHeader">
                                <Grid item xs={7} sm={8}>
                                  {hasAccessToEntity(obj.entity) ? (
                                    obj.entity === selectedEntity ? (
                                      <Link className="link" to={`${routes.opportunityDetail.path}/${obj._id}`}>
                                        <Typography className="detailName">{obj?.opportunityName}</Typography>
                                      </Link>
                                    ) : (
                                      <Link
                                        className="link"
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
                                </Grid>
                                <Grid item xs={5} sm={4}>
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
                                    {(permissions.isUpdate && isTeamMember) || isManager ? (
                                      <>
                                        <Box ml={1} />
                                        <IconButton
                                          title={`Remove opportunity ${obj.opportunityName}`}
                                          size="small"
                                          onClick={() => handleRemove(obj)}
                                        >
                                          <DeleteOutlineIcon fontSize="small" color="error" />
                                        </IconButton>
                                      </>
                                    ) : null}
                                  </Box>
                                </Grid>
                              </Grid>
                              <Grid container className={styles.opportunity_layout_box}>
                                <Grid item xs={12} sm={6} md={6}>
                                  {obj?.stage ? (
                                    <DisplayData key={index} label="Stage" value={obj?.stage ?? ''} icon={<BiCustomize size={15} />} />
                                  ) : (
                                    ''
                                  )}
                                </Grid>
                                <Grid item xs={12} sm={6} md={6} className={styles.opportunity_closed_date}>
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
          message={removeRec ? `Are you sure you want to remove opportunity  ${removeRec.opportunityName} ?` : ''}
          onClose={() => {
            setShowConfirmBox(false);
            if (removeRec) setRemoveRec(null);
          }}
          onOk={removeRec ? removeOpp : null}
        />
      ) : null}
      {showCreateOpportunityDialog && (
        <NewOpportunityProjectSales
          open={showCreateOpportunityDialog}
          onClose={() => setShowCreateOpportunityDialog(false)}
          onSuccess={(id) => {
            setShowCreateOpportunityDialog(false);
            onNewOpportunityAdd(id);
          }}
          accountId={accountId}
          isRedirectTodetailPage={isRedirect}
          collaborators={collaborators}
          users={users}
        />
      )}
    </>
  );
}
