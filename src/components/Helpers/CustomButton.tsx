import React from 'react'
import { Button, CircularProgress } from '@material-ui/core'
import '../sidebar.scss'
function CustomButton(props) {
    const { loading, children, disabled, ...rest } = props
    return <Button  {...rest}
        disabled={disabled}
        size="small"
    >
        {loading ? <CircularProgress
            style={{ marginRight: "8px" }}
            size={20} color="inherit" /> : null}
        {children}
    </Button >
}
export default CustomButton