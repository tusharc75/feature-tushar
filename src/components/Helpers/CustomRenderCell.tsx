import React from 'react'
import NoDataCell from './NoDataCell'
export default function CustomRenderCell({ value }) {
    return value || <NoDataCell />
}