import React from 'react'
import NoDataCell from './NoDataCell'
import CopyToClipboard from './CopyToClipboard'

export default function CustomRenderCell({ value, isCopyToClipboard = false }) {
    return <> {value || <NoDataCell />}
        {isCopyToClipboard && value ? <CopyToClipboard textToCopy={value} /> : null}
    </>
}