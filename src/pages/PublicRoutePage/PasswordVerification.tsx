import { useState, useContext } from 'react'
import { Box, Button, Dialog, Grid, TextField } from '@material-ui/core'
import { isMobile, isTablet } from 'react-device-detect'
import { CustomDialogTransition } from '../../constants/helpers'
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader'
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter'
import CustomButton from '../../components/Helpers/CustomButton'
import axiosInstance from '../../axios/axiosInstance'

const PasswordVerification = ({ open, title, close, handleSave }) => {
    const [fieldValue, setFieldValue] = useState(null)
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    return (
        <>
            <Dialog
                maxWidth="md"
                fullWidth
                fullScreen={fullScreen || (isMobile || isTablet)}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                onClose={close}
                open={open}
                disableBackdropClick={true}
            >
                <CustomDialogHeader
                    title={title}
                    onClose={close}
                    isMinimized={!fullScreen}
                    onMinimizeMaximize={() => {
                        setFullScreen(prevState => !prevState)
                    }}
                    showManimizeMaximize={true}
                />

                <CustomDialogContent>
                    <Box marginY={2}>
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
                                    placeholder="Please enter password"
                                    onChange={(e) => setFieldValue(e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                        </Grid>
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
                        variant="contained"
                        color="primary"
                        onClick={(e) => {
                            handleSave(fieldValue);
                        }}
                    >
                        Submit
                    </CustomButton>
                </CustomDialogFooter>
            </Dialog>
        </>

    )
}

export default PasswordVerification
