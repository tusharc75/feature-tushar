import React, { useState, useContext } from 'react'
import { Box, Button, Dialog, Grid, TextField } from '@material-ui/core'
import { isMobile, isTablet } from 'react-device-detect'
import { CustomDialogTransition, getObjKeys, setFieldsInAscendingOrder, simplifyValues, yupSchema } from '../../constants/helpers'
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader'
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Form, Formik } from 'formik'
import FormTypes from '../../components/Helpers/FormTypes'
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter'
import CustomButton from '../../components/Helpers/CustomButton'
import axiosInstance from '../../axios/axiosInstance'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      width: '25ch',
    },
  }),
);

const CodeValidation = ({ open, title, close, email, quoteId, versionNumber, handleSave }) => {
    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);
    const [showPasswordField, setShowPasswordField] = useState(false);
    const [disableResendCode, setDisableResendCode] = useState(false);
    const [buttonLabel, setButtonLabel] = useState("Get Code");
    const [fieldValue, setFieldValue] = useState({
        email: email,
        code: ""
    })

    const copyOfEmail =
        email.substring(0, email.indexOf("@"))
            .split("").map((char) => char = "x")
            .join("")
        + email.substring(email.indexOf("@"), email.length);


    const handleSendCodeToEmail = () => {
        axiosInstance()
            .get(`/quote-builder/send-otp/${quoteId}/${versionNumber}`)
            .then(({ data: { data } }) => {
                setShowPasswordField(true)
                setButtonLabel("Resend Code")
                handleDisableButton()
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data,
                })

            }).catch((err) => { toastConfig.setToastConfig(err); })
    }

    const handleDisableButton = () => {
        setDisableResendCode(true)
        setTimeout(() => {
            setDisableResendCode(false)
        }, 60000);

    }

    return (
        <>
            <Dialog
                maxWidth="md"
                fullWidth
                fullScreen={isMobile || isTablet}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                onClose={close}
                open={open}
                disableBackdropClick={true}
            >
                <CustomDialogHeader
                    title={title}
                    onClose={close}
                />

                <CustomDialogContent>
                    <Box marginY={2}>
                        <Grid spacing={3} container>
                            <Grid key={1} item xs={12} sm={8} md={10}>
                                <TextField
                                    variant="outlined"
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={copyOfEmail}
                                    disabled={true}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid key={1} item xs={12} sm={4} md={2} >
                                <Button
                                    className="ml-1"
                                    color="primary"
                                    variant="outlined"
                                    disabled={disableResendCode}
                                    onClick={
                                        handleSendCodeToEmail
                                    }
                                    fullWidth
                                >
                                    {buttonLabel}
                                </Button>

                            </Grid>

                        </Grid>
                        {showPasswordField &&
                            <Grid spacing={3} container>
                                <Grid key={1} item xs={12} sm={12} md={12}>
                                    <TextField
                                        id="outlined-full-width"
                                        margin="normal"
                                        variant="outlined"
                                        InputLabelProps={{
                                            shrink: true,
                                          }}                                
                                        label="Code"
                                        name="code"
                                        type="password"
                                        placeholder="Please enter the 4 digit code received in your email"
                                        onChange={(e) => setFieldValue((prevState) => ({ ...prevState, code: e.target.value }))}
                                        fullWidth
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                        }
                    </Box>

                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button
                        type="button"
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={close}
                    >
                        Cancel
                    </Button>

                    <CustomButton
                        // loading={loading}
                        variant="contained"
                        color="primary"
                        disabled={fieldValue.code.length !== 4}
                        onClick={(e) => {
                            handleSave(fieldValue);
                        }}
                    >
                        Save
                    </CustomButton>
                </CustomDialogFooter>
            </Dialog>
        </>

    )
}

export default CodeValidation
