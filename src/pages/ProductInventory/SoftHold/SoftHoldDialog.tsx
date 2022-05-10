import { useState, useEffect } from 'react';
import { Box, Button, Grid, TextField, Typography } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import axiosInstance from 'src/axios/axiosInstance';

const SoftHoldDialog = ({ open, close, params }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [softHoldData, setSoftHoldData] = useState([]);

  const softHoldDataFetch = () => {
    axiosInstance()
      .get(`/product-inventory/soft-hold/${params.data.productId}/${params.data.plantId}`)
      .then(({ data: { data } }) => {
        setSoftHoldData(data.transferInventory);
      });
  };

  useEffect(() => {
    softHoldDataFetch();
  }, []);

  return (
    <>
      <Dialog
        maxWidth="sm"
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={open}
        fullWidth
      >
        <CustomDialogHeader
          title={'Soft Hold Info'}
          onClose={close}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        ></CustomDialogHeader>
        <CustomDialogContent>
          <Box marginY={2}>
            <Grid spacing={3} container>
              <>
                <Grid item xs={6} sm={6} md={6}>
                  <Box
                    style={{ maxHeight: '350px', overflow: 'auto' }}
                    bgcolor="white"
                    border={1}
                    mt={1}
                    mb={1}
                    borderColor="grey.300"
                    width={'100%'}
                  >
                    <Box p={0}>
                      <Typography className="m-2 text-center" variant="subtitle1">
                        Transfer Number
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={6} md={6}>
                  <Box
                    style={{ maxHeight: '350px', overflow: 'auto' }}
                    bgcolor="white"
                    border={1}
                    mt={1}
                    mb={1}
                    borderColor="grey.300"
                    width={'100%'}
                  >
                    <Box p={0}>
                      <Typography className="m-2 text-center" variant="subtitle1">
                        AssetsCount
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                {softHoldData?.length > 0 &&
                  softHoldData.map((i, index) => (
                    <>
                      <Grid key={index} item xs={6} sm={6} md={6}>
                        <Box
                          style={{ maxHeight: '350px', overflow: 'auto' }}
                          bgcolor="white"
                          border={1}
                          mt={1}
                          mb={1}
                          borderColor="grey.300"
                          width={'100%'}
                        >
                          <Box p={0}>
                            <Typography className="m-2 text-center">{i.transferNumber}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid key={index} item xs={6} sm={6} md={6}>
                        <Box
                          style={{ maxHeight: '350px', overflow: 'auto' }}
                          bgcolor="white"
                          border={1}
                          mt={1}
                          mb={1}
                          borderColor="grey.300"
                          width={'100%'}
                        >
                          <Box p={0}>
                            <Typography className="m-2 text-center">{i.assetsCount}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </>
                  ))}
              </>
            </Grid>
          </Box>
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default SoftHoldDialog;
