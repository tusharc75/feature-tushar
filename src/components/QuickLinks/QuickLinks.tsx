import React from 'react'
import { Icon, Typography } from '@material-ui/core'
import { Link } from "react-router-dom";

export interface IQuickLinks {
    label: string,
    show: boolean
    count?: number,
    onClick?: Function,
    to?: string,
    icon?: any,
}

export default function QuickLinks({ quickLinks, title = "Quick Links" }) {

    return quickLinks && Array.isArray(quickLinks) ? <div className="d-flex flex-column gap-2 px-3 pt-2 pb-3 bg-white">
        <Typography variant="h6" className="mb-1">{title}</Typography>
        {
            quickLinks.map((k, index) => {
                return <div key={index} className="font-size-3 link d-flex justify-content-center align-items-center gap-1">
                    {
                        k.to ? <>
                            <Link key={index} to={k.to}
                                className={`link`}>{k.label} {k.count != null ? `(${k.count})` : null}</Link>
                        </> :
                            <>
                                <Icon>{k.icon}</Icon>
                                <Typography key={index} onClick={k.onClick}>{k.label} {k.count != null ? `(${k.count})` : null}</Typography>
                            </>
                    }
                </div>
            })
        }
    </div> : <Typography color="error">Quick Links are passed in incorrect format</Typography>
}

