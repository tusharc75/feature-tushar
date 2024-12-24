import { MoreVert } from '@mui/icons-material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Button, Card, CardContent, Grid, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { BsClockHistory } from 'react-icons/bs';
import { IoCalendarOutline } from 'react-icons/io5';
import { Link, useHistory } from 'react-router-dom';
import DisplayData from 'src/components/CardDisplayData';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import CreateProjectSales from '../../pages/ProjectSales/CreateProjectSales';
import { displayDate } from '../../services/util';
import AssignProjectSalesDialog from '../AssignRolesDialog/AssignProjectSalesDialog';
import routes from '../Helpers/Routes';

export default function ProjectInAccordion({
  expanded = true,
  recordsPerLine = 3,
  projectSales,
  type,
  fetchData,
  permissions,
  isAddProjectSale = false,
  isAllowedToEdit,
  accountId = '',
  accountName = '',
  resource = '',
  resources
}) {
  const [showCreateProjectSalesDialog, setShowCreateProjectSalesDialog] = useState(false);

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
  const history = useHistory();
  const [expandProject, setExpandProject] = useState(expanded);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAddProjectSalesDialog, setShowAddProjectSalesDialog] = useState(false);

  useEffect(() => {
    setExpandProject(projectSales && projectSales?.length !== 0 ? true : false);
  }, [projectSales]);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  return (
    <>
      <Accordion expanded={expandProject} className="omsAccordian" onChange={() => setExpandProject(!expandProject)}>
        <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
          <Grid container className="pos_rel">
            <Grid item xs={8}>
              <Box display="flex">
                <Box>
                  <IconButton size="small">{expandProject === true ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                </Box>
                <Box padding="5px">
                  <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                    {resources?.projectSales?.titlePlural} ({projectSales?.length || 0})
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={4} container justify="flex-end">
              {isAllowedToEdit && (
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
                      disabled={!permissions?.projectSales?.isCreate}
                      onClick={() => {
                        setShowCreateProjectSalesDialog(true);
                        handleCloseMenu();
                      }}
                    >
                      Create New
                    </MenuItem>
                    <MenuItem
                      disabled={!permissions?.projectSales?.isUpdate}
                      onClick={() => {
                        setShowAddProjectSalesDialog(true);
                        handleCloseMenu();
                      }}
                    >
                      Add Exisiting
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {expandProject && (
              <>
                {projectSales && projectSales.length ? (
                  <Grid container spacing={1}>
                    {projectSales.map((obj, index) => (
                      <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={index}>
                        <Card className="detailCard  card-v1" variant="outlined">
                          <CardContent className="card-link">
                            <Grid item xs={12}>
                              <Link target="_blank" rel="noopener noreferrer" to={`${routes.projectSalesDetail.path}/${obj._id}`}>
                                <Typography className="detailName">{obj.projectName}</Typography>
                              </Link>

                              <Grid container>
                                <Grid item xs={12} sm={6} md={6} className="buttonClass">
                                  {
                                    <DisplayData
                                      key={1}
                                      label="Status"
                                      value={obj.projectStatus ? 'Active' : 'Inactive'}
                                      icon={<BsClockHistory size={15} />}
                                      highlightsHead={true}
                                    />
                                  }
                                </Grid>
                                <Grid item xs={12} sm={6} md={6}>
                                  {<DisplayData key={2} label="Due Date" value={displayDate(obj.endDate)} icon={<IoCalendarOutline size={15} />} />}
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
                    No Projects To Show
                  </Typography>
                )}
              </>
            )}
            {projectSales && projectSales.length ? (
              <Box mt={2}>
                <Button
                  className="accordion-outlined-button"
                  onClick={() =>
                    history.push(`/project-sales`, {
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

      {showCreateProjectSalesDialog && (
        <CreateProjectSales
          open={showCreateProjectSalesDialog}
          close={() => setShowCreateProjectSalesDialog(false)}
          fetchData={fetchData}
          type={type}
        />
      )}
      {showAddProjectSalesDialog && (
        <AssignProjectSalesDialog
          projectSalesDialogOpen={showAddProjectSalesDialog}
          onSuccess={() => {
            setShowAddProjectSalesDialog(false);
            fetchData();
          }}
          handleCloseDialog={() => setShowAddProjectSalesDialog(false)}
          assignedProjectSales={projectSales}
          type={type}
        />
      )}
    </>
  );
}
