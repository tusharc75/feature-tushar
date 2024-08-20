import { Box, Button, Dialog, Grid, TextField, Typography } from '@material-ui/core'
import { useContext, useEffect, useState } from 'react'
import { isMobile, isTablet } from 'react-device-detect'
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext'
import axiosInstance from 'src/axios/axiosInstance'
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent'
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter'
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader'
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton'
import { CustomDialogTransition } from 'src/constants/helpers'

function SetUpMfaDialog({ onClose }) {

    const [data, setData] = useState({ secret: '', qrCode: '' })
    const [loading, setLoading] = useState(false)
    const [token, setToken] = useState(null);
    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {
        generate();
    }, [])

    const generate = async () => {
        setLoading(true)
        axiosInstance().get('/user/mfa/generate').then(({ data: { data } }) => {
            setData({
                secret: data?.secret,
                qrCode: data.qrCode
            })
            setLoading(false);
        }).catch((error) => {
            setLoading(false);
            toastConfig.setToastConfig(error);
        })
    }

    const validate = async (secretKey, token) => {
        axiosInstance().put('/user/mfa/verify', { secretKey, token })
            .then(({ data: { data } }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: 'MFA enabled successfully',
                });
                onClose();
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            })
    }

    return (<Dialog fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        open={true}
        aria-labelledby="customized-dialog-title"
        maxWidth={"sm"}
        onClose={onClose}
        fullWidth>
        <CustomDialogHeader title="MFA Setup" showRequiredLabel={false} onClose={onClose} />
        <CustomDialogContent>
            {loading ?
                <Box p={2} height={300}>
                    <CommonSkeleton lenArray={[...Array(6).keys()]} />
                </Box>
                : <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="h6" align="center">
                        Scan the QR code below to configure your MFA app
                    </Typography>
                    <Box p={3} pb={1}>
                        <img src={data?.qrCode} alt={data?.secret} />
                    </Box>
                    <Typography variant="body2" align="center">
                        Secret Key: {data?.secret}
                    </Typography>
                    <Box mt={3} />
                    <Box m={2}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Enter OTP"
                                    variant="outlined"
                                    size="small"
                                    value={token}
                                    onChange={(e) => {
                                        setToken(e.target.value)
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    onClick={() => {
                                        validate(data.secret, token);
                                    }}
                                >
                                    Validate
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </div>
            }
        </CustomDialogContent>
        <CustomDialogFooter>
            <Button
                size="small"
                onClick={onClose}
                variant="outlined"
            >
                Cancel
            </Button>
        </CustomDialogFooter>
    </Dialog>

    )
}

export default SetUpMfaDialog