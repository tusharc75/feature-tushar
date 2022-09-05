import React, { useContext, useState } from 'react';
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
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { cycleCountPhysicalInventory } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';

const Products = ({ handleClose, handleSucess, _id, products, warehouse }) => {

  const toastConfig = useContext(CustomToastContext);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableData, setTableData] = useState([...products]);

  const handleSubmit = async (e) => {
    const data = {
      _id: _id,
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
      .then(({ data }) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        handleSucess();
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

  return (<Dialog
    open={true}
    onClose={handleClose}
    fullScreen>
    <CustomDialogHeader
      title={`Enter Physical Inventory : ${warehouse}`}
      onClose={handleClose}
      showRequiredLabel={false}
    />
    <CustomDialogContent>
      <Box display="flex" flexDirection="column">
        <TableContainer component={Paper}>
          <Table aria-label="customized table">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
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
    <CustomDialogFooter>
      <Button
        type="submit"
        variant="contained"
        size="small"
        color="primary"
        endIcon={isSubmitting && <CircularProgress size={18} />}
        onClick={handleSubmit}
        disabled={tableData?.find((d) => d.qty === null)}
      >
        Save
      </Button>
    </CustomDialogFooter>
  </Dialog>
  );
};

export default Products;
