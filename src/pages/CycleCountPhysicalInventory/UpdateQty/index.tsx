import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@material-ui/core';
import React, { useContext, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { makeStyles, createStyles, withStyles } from '@material-ui/styles';
import { cycleCountPhysicalInventory } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const useClasses = makeStyles(() => ({
  table: {
    // minWidth: 650
  },
  input: {
    display: 'none'
  },
  tableContainer: {
    maxHeight: 'calc(100vh - 200px)'
  }
}));

const updateQuantity = ({ closeDialog, openDialog, refId, products }: any) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const toastConfig = useContext(CustomToastContext);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const classes = useClasses();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [isSubmitting, setIsSubmitting] = useState<Boolean>(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [tableData, setTableData] = useState([...products]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [updateDisable, setUpdateDisable] = useState(false);
  const handleSubmit = async (e) => {
    console.log(tableData);
    const data = {
      _id: refId,
      products: tableData?.map((d) => {
        return {
          ...d,
          product: d?.product?.optionValue
        };
      })
    };
    setIsSubmitting(true);
    axiosInstance()
      .put(`${cycleCountPhysicalInventory.api}`, data)
      .then(() => {
        setIsSubmitting(false);
        closeDialog();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Product Data Updated Successfully'
        });
      })
      .catch((err) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(err);
      });
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, d: any) => {
    const { name, value } = e.target;
    setTableData((prevState) =>
      prevState.map((data: any) => {
        if (d?.product?.optionValue === data?.product?.optionValue) {
          data['qty'] = parseInt(value) == NaN ? 0 : parseInt(value);
        }
        return data;
      })
    );
  };
  return (
    <Dialog open={openDialog} onClose={closeDialog} fullScreen>
      <CustomDialogHeader title={'Update Product Quantity'} onClose={closeDialog} />
      <CustomDialogContent>
        <Box display="flex" flexDirection="column">
          <Box alignSelf={'flex-end'} mb={2}>
            <Button
              type="submit"
              variant="outlined"
              size="small"
              color="primary"
              endIcon={isSubmitting && <CircularProgress size={18} />}
              onClick={handleSubmit}
              disabled={tableData?.find((d) => d.qty === null)}
            >
              Update
            </Button>
          </Box>
          <TableContainer className={classes.tableContainer} component={Paper}>
            <Table className={classes.table} aria-label="customized table">
              <TableHead>
                <TableRow>
                  <TableCell>Sr.No.</TableCell>
                  <TableCell align="left">Product</TableCell>
                  <TableCell align="left">Qty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((data: any, idx) => (
                  <TableRow key={data.id}>
                    <TableCell component="th" scope="row">
                      {idx + 1}
                    </TableCell>
                    <TableCell align="left">{data?.product['optionLabel']}</TableCell>
                    <TableCell align="left">
                      <TextField
                        size="small"
                        variant="outlined"
                        placeholder="Qty"
                        value={data['qty']}
                        autoComplete="off"
                        name="Qty"
                        type={'number'}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e, data)}
                      />
                    </TableCell>
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

export default updateQuantity;
