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
  TextField,
  Typography
} from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import routes from 'src/components/Helpers/Routes';
import { productInventory, rentalManagement } from 'src/constants/helpers';

const AddNonSerializedInventory = ({ onClose, onSuccess, products, referenceId }) => {
  const toastConfig = useContext(CustomToastContext);

  const [productInventoryData, setProductInventoryData] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProductInventory();
  }, [products]);

  const fetchProductInventory = () => {
    axiosInstance()
      .get(`${productInventory.api}/product/${products[0]?.id}`)
      .then(async ({ data: { data } }) => {
        setProductInventoryData(
          data?.map((d) => ({ _id: d?._id, warehouse: d?.warehouse?.name, warehouseId: d?.warehouse?._id, qty: d?.inventory, inventory: 0 }))
        );
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = productInventoryData?.filter((p) => p?.inventory > 0);
    if (data?.reduce((sum, row) => row?.inventory + sum, 0) <= products[0]?.qty && data?.every((p) => p?.inventory <= p?.qty) && data?.length > 0) {
      setSubmitting(true);
      axiosInstance()
        .put(
          `${rentalManagement.api}/${referenceId}/add-non-serial-inventory`,
          data?.map((p) => ({ product: products[0]?.id, warehouse: p?.warehouseId, qty: p?.inventory, _id: products[0]?._id }))
        )
        .then(() => {
          setSubmitting(false);
          onSuccess();
        })
        .catch((err) => {
          setSubmitting(false);
        });
    }
  };

  return (
    <Dialog open onClose={onClose} fullScreen>
      <CustomDialogHeader title={`Assign Inventory`} onClose={onClose} />
      <CustomDialogContent isFooterPresent={false}>
        <Box display="flex" flexDirection="column" component={'form'} onSubmit={handleSubmit}>
          <Box alignSelf={'flex-end'} mb={2}>
            <Button
              type="submit"
              variant="contained"
              size="small"
              color="primary"
              endIcon={isSubmitting && <CircularProgress size={18} />}
              disabled={
                !productInventoryData?.length ||
                isSubmitting ||
                productInventoryData?.reduce((sum, row) => row?.inventory + sum, 0) > products[0]?.qty ||
                productInventoryData?.some((p) => p?.inventory > p?.qty)
              }
            >
              Assign
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table aria-label="customized table">
              <TableHead>
                <TableRow>
                  <TableCell>{routes.warehouse.title}</TableCell>
                  <TableCell align="left">Product</TableCell>
                  <TableCell align="left">Qty</TableCell>
                  <TableCell align="left">Assign Inventory</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productInventoryData &&
                  productInventoryData?.map((_product: any) => (
                    <TableRow key={_product?._id}>
                      <TableCell component="th" scope="row">
                        {_product?.warehouse}
                      </TableCell>
                      <TableCell align="left">{products[0]?.productDetail?.productName}</TableCell>
                      <TableCell align="left">{_product?.qty}</TableCell>
                      <TableCell align="left">
                        <TextField
                          size="small"
                          type="number"
                          variant="outlined"
                          value={_product['inventory']}
                          placeholder="Assign inventory"
                          autoComplete="off"
                          name={'inventory'}
                          onChange={(e) => {
                            setProductInventoryData(
                              productInventoryData?.map((_data) =>
                                _data?._id === _product?._id ? { ..._data, inventory: parseInt(e?.target?.value) } : _data
                              )
                            );
                          }}
                          error={_product?.inventory > _product?.qty}
                          helperText={_product?.inventory > _product?.qty && 'Assigned inventory more than available Qty'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box pt={1}>
            {productInventoryData?.reduce((sum, row) => row?.inventory + sum, 0) > products[0]?.qty && (
              <Typography color="error">You are trying to assign more inventory</Typography>
            )}
          </Box>
        </Box>
      </CustomDialogContent>
    </Dialog>
  );
};

export default AddNonSerializedInventory;
