import React from 'react'
import { Grid, Icon, Paper, Typography } from '@material-ui/core'
import { Link } from "react-router-dom";
export interface IQuickLinks {
    label: string,
    show: boolean
    count?: number,
    onClick?: Function,
    to?: string,
    icon?: any,
    class: string
}

export default function QuickLinks({ quickLinks, title = "Quick Links" }) {
    return quickLinks && Array.isArray(quickLinks) ? <div className="d-flex flex-column gap-2 px-3 pt-2 pb-3 bg-white">
        <Typography variant="h6" className="mb-1">{title}</Typography>
        <Grid container spacing={1}>
            {
                quickLinks.map((k, index) => {
                    return <React.Fragment>
                        <Grid item xs={6} sm={4} md={3} lg={3} spacing={2} key={index}>
                            <Paper className={`quickLinks ${k.class}`} onClick={k.onClick}>
                                {k.to ? <>
                                    <Link key={index} to={k.to}
                                        className={`link`}>{k.label} {k.count != null ? `(${k.count})` : null}</Link>
                                </> :
                                    <>
                                        <Icon>{k.icon}</Icon>
                                        <Typography key={index}>{k.label} {k.count != null ? `(${k.count})` : null}</Typography>
                                    </>}</Paper>
                        </Grid>
                    </React.Fragment>
                })
            }
        </Grid>
    </div> : <Typography color="error">Quick Links are passed in incorrect format</Typography>
}
