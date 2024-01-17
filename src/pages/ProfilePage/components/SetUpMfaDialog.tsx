import { Box, Button, Dialog, Typography } from '@material-ui/core'
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

    return (<Dialog fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        open={true}
        aria-labelledby="customized-dialog-title"
        maxWidth={"sm"}
        onClose={onClose}
        fullWidth>
        <CustomDialogHeader title="MFA Data" showRequiredLabel={false} onClose={onClose} />
        <CustomDialogContent>
            {loading ?
                <Box p={2} height={300}>
                    <CommonSkeleton lenArray={[...Array(6).keys()]} />
                </Box>
                : <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Typography variant="h6" align="center">
                        Scan the QR code below to configure your MFA app
                    </Typography>
                    <Box style={{ padding: 5, border: '1px solid #ccc' }}>
                        <img src={data?.qrCode} alt={data?.secret} />
                    </Box>
                    <Box pt={3}>
                        <Typography variant="body1" align="center">
                            Secret Key: {data?.secret}
                        </Typography>
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