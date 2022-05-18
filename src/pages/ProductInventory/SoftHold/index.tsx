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
import { productInventory } from "../../../constants/helpers";

const SoftHoldDialog = ({ close, data }) => {

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [softHoldData, setSoftHoldData] = useState([]);

  useEffect(() => {
    softHoldDataFetch();
  }, []);

  const softHoldDataFetch = () => {
    axiosInstance()
      .get(`${productInventory.api}/soft-hold/${data.productId}?wareHouse=${data.plantId}`)
      .then(({ data: { data } }) => {
        const result = []
        data?.transferInventory?.forEach((e) => {
          result.push({
            _id: e._id,
            referenceType: routes.transferInventory.title,
            path: routes.transferInventoryDetail.path,
            reference: e.transferNumber,
            qty: e.assetsCount
          })
        })
        setSoftHoldData(result);
      });
  };

  return (<Dialog
    maxWidth="sm"
    fullScreen={fullScreen || isMobile || isTablet}
    TransitionComponent={CustomDialogTransition}
    aria-labelledby="customized-dialog-title"
    open={true}
    fullWidth
  >
    <CustomDialogHeader
      title={'Soft Hold History'}
      onClose={close}
      isMinimized={!fullScreen}
      onMinimizeMaximize={() => {
        setFullScreen((prevState) => !prevState);
      }}
      showManimizeMaximize={true}
      showRequiredLabel={false}
    ></CustomDialogHeader>
    <CustomDialogContent>
      <Box p={1}>
        <TableContainer component={Paper}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>
                  <span style={{ color: 'black' }}>Reference Type</span>
                </TableCell>
                <TableCell>
                  <span style={{ color: 'black' }}>Reference Number</span>
                </TableCell>
                <TableCell align="right">
                  <span style={{ color: 'black' }}>Inventory</span>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {softHoldData?.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.referenceType}</TableCell>
                  <TableCell component="th" scope="row">
                    <Link className="link text-truncate" to={`${row.path}/${row._id}`}>
                      {row.reference}
                    </Link>
                  </TableCell>
                  <TableCell align="right">{row.qty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </CustomDialogContent>
  </Dialog>
  );
};

export default SoftHoldDialog;
