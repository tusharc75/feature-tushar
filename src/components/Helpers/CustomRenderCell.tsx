import React, { useState } from 'react'
import NoDataCell from './NoDataCell'
import CopyToClipboard from './CopyToClipboard'

export default function CustomRenderCell({ value, isCopyToClipboard = false }) {
    const [inHover, setHover] = useState(false);
    return <span onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}>
        {value || <NoDataCell />}
        { inHover && isCopyToClipboard && value ? <CopyToClipboard textToCopy={value} /> : null}
    </span>


    // return <> {value || <NoDataCell />}
    //         {isCopyToClipboard && value ? <CopyToClipboard textToCopy={value} /> : null}
    //     </>
}