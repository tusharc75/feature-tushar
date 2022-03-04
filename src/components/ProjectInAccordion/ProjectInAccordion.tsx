import React, { useState, useEffect } from 'react'
import { Grid, Box, IconButton, Typography, Card, CardContent, List, ListItem, ListItemAvatar, ListItemText, Menu, MenuItem } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import { withStyles } from "@material-ui/core/styles";
import { displayDate } from '../../services/util';
import { BsClockHistory } from 'react-icons/bs';
import { IoCalendarOutline } from 'react-icons/io5';
import { Link, useHistory } from 'react-router-dom'
import routes from '../Helpers/Routes';
import CreateProjectSales from "../../pages/ProjectSales/CreateProjectSales";
import { MoreVert } from '@material-ui/icons';
import AssignProjectSalesDialog from '../AssignRolesDialog/AssignProjectSalesDialog';
import { HiExternalLink } from 'react-icons/hi';

const Accordion = withStyles({
    root: {
        border: "1px solid rgba(0, 0, 0, .125)",
        "&:not(:last-child)": {
            borderBottom: 0,
        },
        "&:before": {
            display: "none",
        },
        "&$expanded": {
            margin: "auto",
        },
    },
    expanded: {},
})(MuiAccordion);

const AccordionSummary = withStyles({
    root: {
        backgroundColor: "white",
        borderBottom: "1px solid #f1ece8",
        background: "#ffffff",
        fontWeight: "bold",
        padding: "0px",
        "&$expanded": {
            minHeight: 46,
        },
    },
    content: {
        "&$expanded": {
            margin: "12px 0",

        },
    },
    expanded: {},
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
    root: {
        padding: theme.spacing(1),
        display: "block",
    }

}))(MuiAccordionDetails);


function DisplayData({ key, label, value, icon }) {
    return <div style={{ flexGrow: 1 }}>
        <List>
            <ListItem key={key}>
                <ListItemAvatar>
                    {icon}
                </ListItemAvatar>
                <ListItemText primary={value ? value : '-'} secondary={label} />
            </ListItem>
        </List>
    </div>
}


export default function ProjectInAccordion({ expanded = true, recordsPerLine = 3, projectSales, type, fetchData, permissions, isAddProjectSale = false, isAllowedToEdit, accountId='', accountName='', resource='' }) {
    ;
    const [
        showCreateProjectSalesDialog,
        setShowCreateProjectSalesDialog,
    ] = useState(false)

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
    const [
        showAddProjectSalesDialog,
        setShowAddProjectSalesDialog,
    ] = useState(false);

    useEffect(() => {
        setExpandProject(projectSales && projectSales?.length !== 0 ? true : false);
    }, [projectSales]);

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };
    return <>
        <Accordion expanded={expandProject} className="omsAccordian accordProject">
            <AccordionSummary
                aria-controls="user-panel-content"
                id="user-panel-header"
            >
                <Grid container>
                    <Grid item xs={8}>
                        <Box display="flex">
                            <Box>
                                <IconButton
                                    size="small"
                                    onClick={() => setExpandProject(!expandProject)} >
                                    {
                                        expandProject === true ? (
                                            <ExpandLessIcon />
                                        ) : (
                                            <ExpandMoreIcon />
                                        )
                                    }
                                </IconButton>
                            </Box>
                            <Box padding="5px">
                                <Typography variant="subtitle2">
                                    {routes.projectSales.title} ({projectSales?.length || 0})
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={4} container justify="flex-end">
                        {isAllowedToEdit &&
                            <>
                                <IconButton
                                    aria-haspopup="true"
                                    color="primary"
                                    size="small"
                                    onClick={handleOpenMenu}
                                >
                                    <MoreVert />
                                </IconButton>
                                <Menu
                                    id="menu"
                                    anchorEl={anchorEl}
                                    keepMounted
                                    open={Boolean(anchorEl)}
                                    onClose={handleCloseMenu}
                                >
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
                                            setShowAddProjectSalesDialog(true)
                                            handleCloseMenu();
                                        }}
                                    >
                                        Add Exisiting
                                    </MenuItem>
                                </Menu>
                            </>
                        }
                    </Grid>
                </Grid>
            </AccordionSummary>
            <AccordionDetails>
                <>
                    {
                        expandProject &&
                        <>
                            {projectSales && projectSales.length ? (
                                <Grid container spacing={1}>
                                    {projectSales.map((obj, index) => (
                                        <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen} key={index}>
                                            <Card className="detailCard">
                                                <CardContent className="detailListing">
                                                    <div className="cardStyle"> </div>
                                                    <Grid item xs={12}>
                                                        <Grid container className="detailCardHeader">
                                                            <Grid item xs={12} sm={12}>
                                                                {
                                                                    // obj.entity === selectedEntity ? 
                                                                    <Link className="link" to={`${routes.projectSalesDetail.path}/${obj._id}`}>
                                                                        <Typography className="detailName">{obj.projectName}</Typography>
                                                                    </Link>
                                                                    // : <span className="d-flex gap-2 align-items-center">
                                                                    //     <Typography className="detailName">{obj.projectName}</Typography> <Tooltip title={`${obj.projectName} belongs to different entity`}>
                                                                    //         <InfoOutlinedIcon fontSize="small" />
                                                                    //     </Tooltip>
                                                                    // </span>
                                                                }
                                                            </Grid>
                                                        </Grid>
                                                        <Grid container>
                                                            <Grid item xs={12} sm={6} md={6}>
                                                                {
                                                                    <DisplayData key={1} label='Status' value={obj.projectStatus ? "Active" : "Inactive"} icon={<BsClockHistory size={15} />} />
                                                                }
                                                            </Grid>
                                                            <Grid item xs={12} sm={6} md={6}>
                                                                {
                                                                    <DisplayData key={2} label='Due Date' value={displayDate(obj.endDate)} icon={< IoCalendarOutline size={15} />} />
                                                                }
                                                            </Grid>
                                                        </Grid>
                                                    </Grid>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : null}

                        </>
                    }
                </>
            </AccordionDetails>
            {/* <Box margin={1} className="btn-view gap-1" onClick={() => { }} p={1} display="flex" justifyContent="center" alignItems="center">
                <FaEye /> View All &#8599;
            </Box>
            <Box margin={1} /> */}
            <Box margin={1} className="btn-view gap-1" onClick={() =>
                history.push(`/project-sales`, {
                    accountId: accountId,
                    accountName: accountName,
                    resource: `${resource}`,
                })
            }
                p={1} display="flex" justifyContent="center" alignItems="center">
                <HiExternalLink size={25} />
            </Box>
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
                    fetchData()
                }}
                handleCloseDialog={() => setShowAddProjectSalesDialog(false)}
                assignedProjectSales={projectSales}
                type={type}
            />
        )}
    </>
}

