import React, { useState, useEffect } from 'react'
import { useHistory } from "react-router-dom";
import { Grid, Box, IconButton, Typography, Card, CardContent, List, ListItem, ListItemAvatar, ListItemText, Tooltip, MenuItem, Menu } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import TrendingUpOutlinedIcon from '@material-ui/icons/TrendingUpOutlined';
import BusinessOutlinedIcon from '@material-ui/icons/BusinessOutlined';
import { withStyles } from "@material-ui/core/styles";
import { Link } from 'react-router-dom'
import { IoCalendarOutline } from 'react-icons/io5';
import { useData } from '../../StateProvider/Provider';
import { displayDate } from '../../services/util';
import { HiExternalLink } from 'react-icons/hi';
import ManageQuoteDialog from '../../pages/QuoteBuilderCombined/ManageQuote/ManageQuoteDialog';
import { MoreVert } from "@material-ui/icons";
import { formatAmountWithCurrency } from '../../constants/helpers';
import AssignQuoteDialog from './AssignQuoteDialog';
import routes from '../Helpers/Routes';
import { SET_SELECTED_ENTITY } from "../../StateProvider/actionTypes";


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

export default function QuotesInAccordion({ expanded = true, recordsPerLine = 2, quotes, fetchData, quoteBuilderPermission, accountId = null, resource = null, contactId = null, opportunityId = null, accountResource = null, isRenderedInCustomerContact = false, isRenderedFromCustomerAccount = false, isCreateOwnerDisable = true, contacts = null, isRenderedFromOpportunity = false, opportunityName = null, isAllowedToUpdate }) {
    const history = useHistory();
    const {
        state: { selectedEntity, user }, dispatch
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

    const [expandQuote, setExpandQuote] = useState(expanded);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [showAddExistingDialog, setShowAddExistingDialog] = useState(false);

    const onSuccess = () => {
        setShowCreateDialog(false);
        fetchData();
    }
    useEffect(() => {
        let isExpanded = expandQuote;
        if (quotes?.length === 0 && isExpanded) isExpanded = false;
        else if (quotes?.length > 0 && !isExpanded) isExpanded = true;

        setExpandQuote(isExpanded);
    }, [quotes]);

    const handleOpenMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleEntityChange = (id) => {
        dispatch({ type: SET_SELECTED_ENTITY, payload: id });
    }

    const hasAccessToEntity = (id) => {
        const entityList = user.entity?.map((entity) => entity._id);
        return entityList.includes(id);
    }
    return <>
        <Accordion expanded={expandQuote} className="omsAccordian accordQuotes">
            <AccordionSummary
                aria-controls="user-panel-content"
                id="user-panel-header"
            >
                <Grid container>
                    <Grid item xs={8} alignItems='center'>
                        <Box
                            component="div"
                            display="flex"
                            alignItems="center"
                            flexGrow={1}
                        >

                            <IconButton
                                size="small"
                                onClick={() => setExpandQuote(!expandQuote)} >
                                {
                                    expandQuote === true ? (
                                        <ExpandLessIcon />
                                    ) : (
                                        <ExpandMoreIcon />
                                    )
                                }
                            </IconButton>
                            <Box padding="5px">
                                <Typography variant="subtitle2">
                                    Quotes ({quotes?.length || 0})
                                </Typography>
                            </Box>
                        </Box>


                    </Grid>
                    <Grid item xs={4} container justify="flex-end" alignItems='center'>
                        {isAllowedToUpdate &&
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
                                        disabled={!quoteBuilderPermission.isCreate}
                                        onClick={() => {
                                            setShowCreateDialog(true);
                                            handleCloseMenu();
                                        }}
                                    >
                                        Create New
                                    </MenuItem>
                                    {isRenderedInCustomerContact && <MenuItem
                                        disabled={!quoteBuilderPermission.isUpdate}
                                        onClick={() => {
                                            setShowAddExistingDialog(true)
                                            handleCloseMenu();
                                        }}
                                    >
                                        Add Exisiting
                                    </MenuItem>}
                                </Menu>
                            </>
                        }



                    </Grid>
                </Grid>
            </AccordionSummary>
            <Box margin={0.5} />
            <AccordionDetails>
                <>
                    {
                        expandQuote && <>
                            {
                                quotes && quotes?.length ? (
                                    <Grid container spacing={1}>
                                        {quotes.map((obj, i) => (
                                            <Grid item xs={12} sm={12} md={recordsPerLineInLargeScreen}>
                                                <Card className="detailCard">
                                                    <CardContent className="detailListing">
                                                        <Grid container className="detailCardHeader">
                                                            <Grid item xs={7} sm={8}>

                                                                {hasAccessToEntity(obj.entity) ?
                                                                    obj.entity === selectedEntity ? (
                                                                        < Link className="link" to={`${routes.quoteBuilder.path}/detail/${obj._id}`}>
                                                                            <Typography className="detailName">{obj.quoteName}</Typography>
                                                                        </Link>) : (
                                                                        < Link className="link" onClick={() => {
                                                                            handleEntityChange(obj.entity)
                                                                            history.push(`${routes.quoteBuilder.path}/detail/${obj._id}`)
                                                                        }}>
                                                                            <Typography className="detailName">{obj.quoteName}</Typography>
                                                                        </Link>) :
                                                                    (<span className="d-flex gap-2 align-items-center">
                                                                        <Typography className="detailName">{obj.quoteName}</Typography> <Tooltip title={`${obj.quoteName} belongs to different entity`}>
                                                                            <InfoOutlinedIcon fontSize="small" />
                                                                        </Tooltip>
                                                                    </span>)
                                                                }
                                                            </Grid>
                                                            <Grid item xs={5} sm={4}>
                                                                <Typography className="amount" title={formatAmountWithCurrency(obj["currency"], obj?.estimatedAmount).fullFormatAmount}>
                                                                    {formatAmountWithCurrency(obj["currency"], obj?.estimatedAmount).shortFormatAmount}
                                                                </Typography>
                                                            </Grid>
                                                        </Grid>
                                                        <Grid container>

                                                            <Grid item xs={12} sm={6} md={6}>
                                                                {
                                                                    obj.expiryDate ? <DisplayData key={i} label='Expiry Date' value={displayDate(obj.expiryDate)} icon={< IoCalendarOutline size={15} />} /> : ''
                                                                }
                                                            </Grid>
                                                            <Grid item xs={12} sm={6} md={6}>
                                                                {
                                                                    obj.incoTerms ? <DisplayData key={i} label='Inco Terms' value={obj.incoTerms} icon={< BusinessOutlinedIcon />} /> : ''
                                                                }
                                                            </Grid>
                                                            <Grid item xs={12} sm={6} md={6}>
                                                                {
                                                                    obj.probability ? <DisplayData key={i} label='Probability' value={`${obj.probability} %`} icon={< TrendingUpOutlinedIcon />} /> : ''
                                                                }
                                                            </Grid>

                                                        </Grid>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}


                                    </Grid>) : null
                            }
                        </>
                    }
                </>
            </AccordionDetails>
            {/* <Box margin={1} className="btn-view gap-1" onClick={() => { }} p={1} display="flex" justifyContent="center" alignItems="center">
                <FaEye /> View All &#8599;
            </Box>
            <Box margin={1} /> */}
            <Box margin={1} className="btn-view gap-1" onClick={() =>
                history.push(routes.quoteBuilder.path)}

                p={1} display="flex" justifyContent="center" alignItems="center">
                <HiExternalLink size={25} />
            </Box>
        </Accordion>

        {
            showCreateDialog &&
            <ManageQuoteDialog
                open={showCreateDialog}
                onClose={() => { setShowCreateDialog(false) }}
                isNew={true}
                isRedirectTodetailPage={false}
                dataToUpdate={null}
                resource={null}
                onSuccess={onSuccess}
                accountId={accountId}
                contactId={contactId}
                opportunityId={opportunityId}
                accountResource={accountResource}
                disableOwnerDropDown={isCreateOwnerDisable}
                isRenderedFromOpportunity={isRenderedFromOpportunity}
                opportunityName={opportunityName}
                isRenderedFromCustomerAccount={isRenderedFromCustomerAccount}



            />
        }
        {
            showAddExistingDialog &&
            <AssignQuoteDialog
                quoteDialogOpen={showAddExistingDialog}
                handleCloseDialog={() => setShowAddExistingDialog(false)}
                onSuccess={() => {
                    setShowAddExistingDialog(false);
                    fetchData()
                }}
                assignedQuotes={quotes}
                accountId={accountId}
                contactId={contactId}
            />
        }
    </>

}