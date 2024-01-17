import { Box, Button, Dialog, Typography } from '@material-ui/core'
import React, { useEffect, useState } from 'react'
import { isMobile, isTablet } from 'react-device-detect'
import axiosInstance from 'src/axios/axiosInstance'
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent'
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter'
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader'
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton'
import { CustomDialogTransition } from 'src/constants/helpers'

function ViewTOTPDialog({ open, onClose }) {
    const [data, setData] = useState({
        secret: '',
        qrCodeUrl: ''
    })
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        generateTOTP();
    }, [])
    const generateTOTP = async () => { 
        try {
            setLoading(true)
            const res = await axiosInstance().get('/user/totp-generate');
            if (res.status === 200) {
                setData({
                    secret: res?.data?.data?.secret,
                    qrCodeUrl: res?.data?.data.qr
                })
            }
            setLoading(false)
        } catch (err) {
            console.log(err)
        }
    }
    
  return (
      <Dialog
          fullScreen={isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          open={open}
          aria-labelledby="customized-dialog-title"
          maxWidth={"sm"}
          onClose={onClose}
          fullWidth
      >
          <CustomDialogHeader title="MFA Data" showRequiredLabel={false} onClose={onClose} />
          <CustomDialogContent>
              {
                  !loading ?  <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center'

                  }}>
                      <Typography variant="h6" align="center">
                          Scan the QR code below to configure your MFA app
                      </Typography>
                      <Box style={{
                          padding: 5,
                          border: '1px solid #ccc',
                      }}>
                          <img src={data?.qrCodeUrl} alt={data?.secret} />
                      </Box>
                      <Typography variant="body1" align="center">
                          Secret Key: {data?.secret}
                      </Typography>
                  </div> : <CommonSkeleton lenArray = { [...Array(5).keys()]} /> 
              }
              
          </CustomDialogContent>
          <CustomDialogFooter>
              <Button
                  size="small"
                  onClick={onClose}
                  variant="contained"
              >
                  Cancel
              </Button>
          </CustomDialogFooter>
          </Dialog>

  )
}

export default ViewTOTPDialog