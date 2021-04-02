import React from 'react'
import { Icon, Typography } from '@material-ui/core'
import { Link } from "react-router-dom";

export interface IQuickLinks {
    label: string,
    count?: number,
    redirect?: boolean,
    onClick?: Function,
    to?: string,
    icon?: any,
}

export default function QuickLinks({ quickLinks, title = "Quick Links" }) {

    return quickLinks && Array.isArray(quickLinks) ? <div className="d-flex flex-column gap-2 m-1">
        <Typography variant="h6" className="mb-1">{title}</Typography>
        {
            quickLinks.map((k, index) => {
                return <div className="font-size-3 link d-flex justify-content-center align-items-center gap-1">
                    {
                        k.redirect == false ?
                            <>
                                <Icon>{k.icon}</Icon>
                                <Typography key={index} onClick={k.onClick}>{k.label}</Typography>
                            </> :
                            <>
                                <Link key={index} to={k.to}
                                    className={`link`}>{k.label} {k.count != null ? `(${k.count})` : null}</Link>
                            </>
                    }
                </div>
            })
        }
    </div> : <Typography color="error">Quick Links are passed in incorrect format</Typography>
}

