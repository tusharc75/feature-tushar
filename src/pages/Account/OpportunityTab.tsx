import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Card, CardContent, Grid, IconButton } from '@material-ui/core'
import { Delete } from '@material-ui/icons'
import Typography from '@material-ui/core/Typography';
import { Link } from 'react-router-dom'
import accountClass from "./account.module.scss"
import { displayDate } from '../../services/util';
import routes from './../../components/Helpers/Routes'

const useStyles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
    },
    bullet: {
        display: 'inline-block',
        margin: '0 2px',
        transform: 'scale(0.8)',
    },
    title: {
        fontSize: 14,
    },
    pos: {
        marginBottom: 12,
    },
    // root: {
    //     // flexGrow: 1,
    // },
    // heading: {
    //     fontSize: theme.typography.pxToRem(17),
    //     flexBasis: '33.33%',
    //     flexShrink: 0,

    // },
    // secondaryHeading: {
    //     fontSize: theme.typography.pxToRem(15),
    //     color: theme.palette.text.secondary,
    // },
    // box: {
    //     border: '1px solid #c4c4c4',
    //     borderRadius: '10px',
    // },
    // actionsItems: {
    //     color: "grey",
    //     float: 'right',
    // },
}));

function DisplayData({ label, value, color = "" }) {

    return <div style={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
            <Grid item sm={6} xs={6} md={4}>
                <Typography>{label}</Typography>
            </Grid>
            <Grid item sm={6} xs={6} md={8}>
                <Typography>{value}</Typography>
            </Grid>
        </Grid>
    </div>
}

export default function OpportunityTab({ data }) {

    const classes = useStyles();

    return (
        <div className={classes.root}>
            {
                data && data.length ?
                    <Grid container spacing={1}>
                        {
                            data.map((obj, index) => (
                                <Grid item xs={12} sm={12} md={6} key={index}>

                                    <Card style={{ minWidth: "100%" }} variant="outlined">
                                        <CardContent>
                                            {/* <span className={classes.actionsItems}> */}
                                            {/* <VisibilityOutlined /> */}
                                            {/* <IconButton size="small">
                                                <Delete color="error" />
                                            </IconButton> */}
                                            {/* <EditOutlined /> */}
                                            {/* </span> */}
                                            <Link className="link" to={`${routes.opportunityDetail.path}/${obj._id}`}>
                                                <Typography className="mb-2">{obj?.opportunityName}</Typography>
                                            </Link>
                                            <DisplayData label='Stage' value={obj?.stage?.optionLabel ?? ''} />
                                            <DisplayData label='Amount' value={obj?.amount ?? ''} />
                                            <DisplayData label='Close Date' value={displayDate(obj.closeDate)} />
                                        </CardContent>
                                    </Card>

                                </Grid>
                            ))
                        }
                    </Grid> : null
            }
        </div>
    );
}






