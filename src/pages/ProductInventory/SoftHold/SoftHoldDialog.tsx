import { useState, useEffect } from 'react';
import { Box, Button, Grid, TextField, Typography } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import axiosInstance from 'src/axios/axiosInstance';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { Link } from 'react-router-dom'
import routes from "../../../components/Helpers/Routes"

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

  const createData = (transferNumber, assetsCount, id) => {
    return { transferNumber, assetsCount, id };
  };

  const rows = softHoldData.map((i, index) => {
    return createData(i.transferNumber, i.assetsCount,i._id);
  });


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
                <TableContainer component={Paper}>
                  <Table aria-label="simple table">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                        <span style={{color:'black'}}>Transfer Number</span>
                        </TableCell>
                        <TableCell align="right"><span style={{color:'black'}}>Assets Count</span></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, index) => (
                        <TableRow key={row.transferNumber}>
                          <TableCell component="th" scope="row">
                          <Link className="link text-truncate" to={`${routes.transferInventoryDetail.path}/${row.id}`}>
                            {row.transferNumber}
                            </Link>
                          </TableCell>
                          <TableCell align="right">{row.assetsCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            </Grid>
          </Box>
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default SoftHoldDialog;
