import React from 'react'
import { Typography } from '@material-ui/core'
import { Link } from "react-router-dom";

export interface IQuickLinks {
    label: string,
    count?: number,
    redirect?: boolean,
    onClick?: Function,
    to?: string,
    icon?: any,
}

export default function QuickLinks({ quickLinks }) {

    return quickLinks && quickLinks.length && <div className="d-flex flex-column">
        <Typography variant="h6" className="mb-1">Quick Links</Typography>
        {
            quickLinks.map((k, index) => {
                return <div className={`link d-flex justify-content-center`}>
                    {
                        k.redirect == false ?
                            <>
                                {k.icon}
                                <Typography key={index} onClick={k.onClick} className="pl-1">{k.label}</Typography>
                            </> :
                            <>
                                <Link key={index} to={k.to}
                                    className={`link`}>{k.label} {k.count != null ? `(${k.count})` : null}</Link>
                            </>
                    }
                </div>
            })
        }
    </div>
}

