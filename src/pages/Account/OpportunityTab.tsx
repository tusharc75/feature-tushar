import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Box, Chip, IconButton } from '@material-ui/core'

import { VisibilityOutlined, EditOutlined, Delete, SquareFoot } from '@material-ui/icons'
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router-dom'
import './account.scss'

const useStyles = makeStyles((theme) => ({
    root: {
        // flexGrow: 1,
    },
    heading: {
        fontSize: theme.typography.pxToRem(17),
        flexBasis: '33.33%',
        flexShrink: 0,

    },
    secondaryHeading: {
        fontSize: theme.typography.pxToRem(15),
        color: theme.palette.text.secondary,
    },
    box: {
        border: '1px solid #c4c4c4',
        borderRadius: '10px',
    },
    actionsItems: {
        color: "grey",
        float: 'right',
    },
}));

function DisplayData({ label, value, color = "" }) {

    return <div className="cTr">
        <div className="td1" >
            <Typography color="textSecondary" variant="subtitle1">{label}</Typography>
        </div>
        <div className="td2"> <Typography style={{ color: color ? color : '' }}  >{value}</Typography></div>
    </div>
}

export default function UsersTab({ expanded, data, brand, onDeleteUser }) {

    const classes = useStyles();

    return (
        <div className={classes.root}>
            {
                data && data.length ?
                    <Grid container spacing={1}>
                        {
                            data.map((obj, index) => (
                                <Grid item md={6} xs={12} sm={12} key={index}>
                                    <div className={`${classes.box} p-3`}>
                                        <span className={classes.actionsItems}>
                                            {/* <VisibilityOutlined /> */}
                                            <IconButton onClick={() => onDeleteUser(obj)} size="small">
                                                <Delete color="error" />
                                            </IconButton>
                                            {/* <EditOutlined /> */}
                                        </span>
                                        <Link className="accountNameLink" to={`${opportunityPage.path}/${obj._id}`}>
                                            <Typography className="text-capitalize">{capitalize(obj?.opportunityName ?? '')}</Typography>
                                        </Link>
                                        <DisplayData label='Stage' value={obj?.stage?.optionLabel ?? ''} />
                                        <DisplayData label='Amount' value={obj?.amount ?? ''} />
                                        <DisplayData label='Close Date' value={displayDate(obj.closeDate)} />
                                    </div>
                                </Grid>
                            ))
                        }
                    </Grid> : null
            }
        </div>
    );
}






