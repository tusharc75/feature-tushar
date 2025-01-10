import { CustomDialogTransition, displayDateTime } from 'src/constants/helpers';
import { Box, Dialog, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const OpenInvoiceErrorDialog = ({ invoiceId, invoiceNumber, onClose }) => {

  const toastConfig = useContext(CustomToastContext);
  const [openInvoiceError, setOpenInvoiceError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    axiosInstance().get(`${routes?.invoice.path}/open-invoice-error/${invoiceId}`).then(({ data: { data } }) => {
      setOpenInvoiceError(data)
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };

  return (
    <>
      <Dialog fullWidth
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader
          title={invoiceNumber}
          onClose={onClose}
          showRequiredLabel={false}
        />
        <CustomDialogContent >
          {openInvoiceError ?
            <TableContainer component={Paper}>
              <Table aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {openInvoiceError?.map((row, index) => (
                    <TableRow key={index}    >
                      <TableCell component="th" scope="row">
                        {displayDateTime(row?.date)}
                      </TableCell>
                      <TableCell align="right">{JSON.stringify(row?.errors)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            : <Box p={2} height={300}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          }
        </CustomDialogContent>
      </Dialog>
    </>
  );
};

export default OpenInvoiceErrorDialog;
