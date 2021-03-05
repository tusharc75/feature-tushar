import React from 'react'
import { Button, CircularProgress } from '@material-ui/core'
import '../sidebar.css'
function CustomButton(props) {
    const { loading, children, disabled, ...rest } = props
    console.log("🚀 ~ file: Button.js ~ line 6 ~ CustomButton ~ props", props)
    return <Button  {...rest}>
        {loading ? <CircularProgress style={{ marginRight: "8px" }} size={20} color="inherit" /> : null}
        {children}
    </Button >
}
export default CustomButton