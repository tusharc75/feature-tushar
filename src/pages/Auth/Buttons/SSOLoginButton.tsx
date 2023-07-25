import { Box, Button, CircularProgress, TextField } from '@material-ui/core'
import React from 'react'
import styles from '../index.module.scss';
import { backendApi } from 'src/config';
import { FiLock } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';

function SSOLoginButton() {
    const [checking, setChecking] = React.useState(false)
    const [textFieldShow, setTextFieldShow] = React.useState(false)
    const [textFieldError, setTextFieldError] = React.useState({ error: false, msg: "" })
    const [brandValue, setBrandValue] = React.useState(null)

    const handleBrandCheck = async () => {
        if (brandValue === null || brandValue === "" || brandValue.length < 1) return setTextFieldError({ error: true, msg: "Please enter a brand" });
        setChecking(true)
        try {
            await axiosInstance().get(`/brand/check/${brandValue}`).then((res) => {
                window.location.href = backendApi + '/user/login/sso/' + brandValue
            })
            setChecking(false)
        } catch (e) {
            console.log(e)
            setChecking(false)
            setTextFieldError({ error: true, msg: "Brand Not Found" })
        }
    }


    return (
        <>
            {textFieldShow && <>
                <TextField
                    fullWidth
                    variant="outlined"
                    size='small'
                    label="Brand"
                    name="brand"
                    value={brandValue || ""}
                    error={textFieldError.error}
                    helperText={textFieldError.msg}
                    onChange={(e) => setBrandValue(e.target.value)}
                />
                <Box mt={1} />
            </>}
            <Button
                disabled={checking}
                fullWidth
                startIcon={checking ? <CircularProgress color="inherit" size={20} /> : <FiLock color="gray" />}
                variant="outlined"
                type="button"
                className={'azure-login'}
                onClick={
                    () => {
                        if (!textFieldShow) setTextFieldShow(true)
                        if (textFieldShow) handleBrandCheck();
                    }
                }
            >
                Continue with SAML SSO
            </Button></>
    )
}

export default SSOLoginButton