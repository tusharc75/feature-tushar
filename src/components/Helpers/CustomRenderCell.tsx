import React from 'react'
import NoDataCell from './NoDataCell'
import CopyToClipboard from './CopyToClipboard'

export default function CustomRenderCell({ value, isCopyToClipboard = false }) {
    // return <span onMouseEnter={() => setHover(true)}
    //     onMouseLeave={() => setHover(false)}>
    //     {value || <NoDataCell />}
    //     { inHover && isCopyToClipboard && value ? <CopyToClipboard textToCopy={value} /> : null}
    // </span>
    return <> {value ? <span title={value} className="text-truncate">{value}</span> : <NoDataCell />}
        {isCopyToClipboard && value ? <CopyToClipboard textToCopy={value} /> : null}
    </>
}