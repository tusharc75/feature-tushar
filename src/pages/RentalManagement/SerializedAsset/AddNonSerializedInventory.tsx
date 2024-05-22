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
import { ListingPageHeader } from 'src/components/PageHeaders';
import { productInventory, rentalManagement } from 'src/constants/helpers';

const AddNonSerializedInventory = ({ onClose, onSuccess, selectedProducts, referenceId }) => {
  const toastConfig = useContext(CustomToastContext);

  const [selectedProduct, setSelectedProduct] = useState(selectedProducts[0]?.id);
  const [products, setProducts] = useState([]);
  const [productInventoryData, setProductInventoryData] = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProductInventory();
  }, [selectedProduct]);

  const fetchProductInventory = () => {
    axiosInstance()
      .get(`${productInventory.api}/product/${selectedProduct}`)
      .then(async ({ data: { data } }) => {
        let nonExistingInventory = data
          ?.filter((d) => !productInventoryData?.map((p) => p?._id)?.includes(d?._id))
          ?.map((d) => ({
            _id: d?._id,
            product: selectedProduct,
            warehouse: d?.warehouse?.name,
            warehouseId: d?.warehouse?._id,
            qty: d?.inventory,
            inventory: 0
          }));

        setProductInventoryData([...productInventoryData, ...nonExistingInventory]);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  useEffect(() => {
    setProducts(selectedProducts?.map((_p) => ({ _id: _p?._id, product: _p.id, totalQty: _p?.qty, qty: _p?.qty, name: _p?.productName })));
  }, [selectedProducts]);

  const handleSubmit = () => {
    const data = productInventoryData?.filter((p) => p?.inventory > 0);
    if (data?.length > 0) {
      setSubmitting(true);
      axiosInstance()
        .put(
          `${rentalManagement.api}/${referenceId}/add-non-serial-inventory`,
          data?.map((p) => ({
            product: p?.product,
            warehouse: p?.warehouseId,
            qty: p?.inventory,
            _id: products?.find((_p) => _p?.product === p?.product)?._id
          }))
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

  const leftSideContents = () => {
    return (
      <Box style={{ display: 'inline' }}>
        {products.length > 0
          ? products?.map((d) => (
              <Box
                m={0.5}
                p={1}
                border={1}
                className={`cursor-pointer rounded-sm ${
                  selectedProduct === d.product ? 'bg-[var(--dark-secondary,_var(--primary))] text-white' : 'text-[var(--primary-text)]'
                }`}
                borderColor="var(--common-border-color)"
                onClick={() => {
                  if (selectedProduct === d.product) {
                    setSelectedProduct(null);
                  } else {
                    setSelectedProduct(d.product);
                  }
                }}
                style={{ display: 'inline-block' }}
              >
                {d?.qty < 0 ? (
                  <span key={d.name} className="text-error">{`${d?.name} (${d?.qty})`}</span>
                ) : d?.totalQty - d?.qty > 0 ? (
                  <span key={d.name} className="text-success">{`${d?.name} (${d?.qty})`}</span>
                ) : (
                  <span key={d.name}>{`${d?.name} (${d?.qty})`}</span>
                )}
              </Box>
            ))
          : null}
      </Box>
    );
  };

  const rightSideContents = () => {
    return (
      <Button
        type="submit"
        variant="contained"
        size="small"
        color="primary"
        endIcon={isSubmitting && <CircularProgress size={18} />}
        disabled={
          isSubmitting ||
          !productInventoryData?.length ||
          products?.some((d) => d?.qty < 0) ||
          productInventoryData?.some((p) => p?.inventory > p?.qty)
        }
        onClick={handleSubmit}
      >
        Assign
      </Button>
    );
  };

  return (
    <Dialog open onClose={onClose} fullScreen>
      <CustomDialogHeader title={`Assign Inventory`} onClose={onClose} />
      <CustomDialogContent isFooterPresent={false}>
        <ListingPageHeader
          isActionButtonVisible={false}
          leftSideContents={leftSideContents()}
          rightSideContents={rightSideContents()}
          isAddButtonVisible={false}
        />
        <TableContainer component={Paper}>
          <Table aria-label="customized table">
            <TableHead>
              <TableRow>
                <TableCell>{routes.warehouse.title}</TableCell>
                <TableCell align="left">Qty</TableCell>
                <TableCell align="left">Assign Inventory</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productInventoryData?.length > 0 &&
                productInventoryData
                  ?.filter((p) => p?.product === selectedProduct)
                  ?.map((_product: any) => (
                    <TableRow key={_product?._id}>
                      <TableCell component="th" scope="row">
                        {_product?.warehouse}
                      </TableCell>
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

                            setProducts((preVal) => {
                              preVal?.forEach((_p) => {
                                if (_p?.product === selectedProduct) {
                                  _p.qty =
                                    _p.totalQty -
                                    (parseInt(e?.target?.value) +
                                      productInventoryData
                                        ?.filter((p) => p?._id != _product?._id && p?.product === selectedProduct)
                                        ?.reduce((sum, row) => sum + row?.inventory, 0));
                                }
                              });
                              return preVal;
                            });
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
          {productInventoryData?.filter((p) => p?.product === selectedProduct)?.reduce((sum, row) => row?.inventory + sum, 0) >
            selectedProducts?.find((s) => s?.id === selectedProduct)?.qty && (
            <Typography color="error">You are trying to assign more inventory</Typography>
          )}
        </Box>
      </CustomDialogContent>
    </Dialog>
  );
};

export default AddNonSerializedInventory;
