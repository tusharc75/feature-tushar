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
import { CustomDialogTransition, productInventory, rentalManagement } from 'src/constants/helpers';

const AddNonSerializedInventory = ({ onClose, onSuccess, selectedProducts, referenceId, type = 'add', nonSerializedInventory = [] }) => {
  const toastConfig = useContext(CustomToastContext);

  const [selectedProduct, setSelectedProduct] = useState(selectedProducts[0]);
  const [products, setProducts] = useState([]);
  const [productInventoryData, setProductInventoryData] = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    setProducts(
      selectedProducts?.map((e) => ({
        _id: e?._id,
        materialId: e?.materialId,
        totalQty: e?.qty,
        qty: e?.qty,
        productName: e?.productName
      }))
    );
  }, [selectedProducts]);

  useEffect(() => {
    fetchProductInventory();
  }, [selectedProduct]);

  const fetchProductInventory = () => {
    axiosInstance()
      .get(`${productInventory.api}/product/${selectedProduct?.materialId}`)
      .then(async ({ data: { data } }) => {
        console.log('data', data);
        if (!productInventoryData?.find((e) => e._id === selectedProduct._id)) {
          let nonExistingInventory = data
            ?.filter((d) => d?.warehouse)
            ?.map((d) => ({
              _id: selectedProduct?._id,
              materialId: selectedProduct?.materialId,
              warehouse: d?.warehouse?.name,
              warehouseId: d?.warehouse?._id,
              qty:
                type === 'add'
                  ? (d?.inventory || 0) -
                    (nonSerializedInventory?.find((s) => s?._id === selectedProduct?._id && s?.warehouse?.optionValue === d?.warehouse?._id)?.qty ||
                      0)
                  : nonSerializedInventory?.find((s) => s?._id === selectedProduct?._id && s?.warehouse?.optionValue === d?.warehouse?._id)?.qty || 0,
              inventory: 0
            }));
          setProductInventoryData([...productInventoryData, ...nonExistingInventory]);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSubmit = () => {
    const data = productInventoryData?.filter((p) => p?.inventory > 0);
    if (data?.length > 0) {
      setSubmitting(true);
      if (type === 'add') {
        axiosInstance()
          .put(
            `${rentalManagement.api}/${referenceId}/add-non-serial-inventory`,
            data?.map((p) => ({
              product: p?.materialId,
              warehouse: p?.warehouseId,
              qty: p?.inventory,
              _id: p?._id
            }))
          )
          .then(() => {
            setSubmitting(false);
            onSuccess();
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
            setSubmitting(false);
          });
      } else {
        axiosInstance()
          .put(
            `${rentalManagement.api}/${referenceId}/remove-non-serial-inventory`,
            data?.map((p) => ({
              product: p?.materialId,
              warehouse: p?.warehouseId,
              qty: p?.inventory,
              _id: p?._id
            }))
          )
          .then(() => {
            setSubmitting(false);
            onSuccess();
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
            setSubmitting(false);
          });
      }
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
                className={`cursor-pointer rounded-sm ${selectedProduct?._id === d._id ? 'bg-[var(--dark-secondary,_var(--primary))] text-white' : 'text-[var(--primary-text)]'}`}
                borderColor="var(--common-border-color)"
                onClick={() => {
                  if (selectedProduct?._id !== d._id) {
                    setSelectedProduct(d);
                  }
                }}
                style={{ display: 'inline-block' }}
              >
                {d?.qty < 0 ? (
                  <span key={d.productName} className="text-error">{`${d?.productName} (${d?.qty})`}</span>
                ) : d?.totalQty - d?.qty > 0 ? (
                  <span key={d.productName} className="text-success">{`${d?.productName} (${d?.qty})`}</span>
                ) : (
                  <span key={d.productName}>{`${d?.productName} (${d?.qty})`}</span>
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
          productInventoryData?.some((p) => p?.inventory > p?.qty) ||
          productInventoryData?.every((p) => p?.inventory === 0)
        }
        onClick={handleSubmit}
      >
        {type === 'add' ? 'Assign' : 'Remove'}
      </Button>
    );
  };

  return (
    <Dialog open onClose={onClose} TransitionComponent={CustomDialogTransition} fullScreen>
      <CustomDialogHeader title={`${type === 'add' ? 'Assign' : 'Remove'} Inventory`} onClose={onClose} showRequiredLabel={false} />
      <CustomDialogContent isFooterPresent={false}>
        <ListingPageHeader
          isActionButtonVisible={false}
          leftSideContents={leftSideContents()}
          rightSideContents={rightSideContents()}
          isAddButtonVisible={false}
        />
        {productInventoryData?.filter((p) => p?._id === selectedProduct?._id)?.length > 0 ? (
          <TableContainer component={Paper}>
            <Table aria-label="customized table">
              <TableHead>
                <TableRow>
                  <TableCell>{routes.warehouse.title}</TableCell>
                  <TableCell align="left">Qty</TableCell>
                  <TableCell align="left">{type === 'add' ? 'Assign' : 'Remove'} Inventory</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productInventoryData?.length > 0 &&
                  productInventoryData
                    ?.filter((p) => p?._id === selectedProduct?._id)
                    ?.map((_product: any, index: any) => (
                      <TableRow key={`${_product?._id}_${index}`}>
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
                            style={{ width: '250px' }}
                            name={'inventory'}
                            onChange={(e) => {
                              const inventory = parseInt(e?.target?.value) >= 0 ? parseInt(e?.target?.value) : 0;
                              const tempProductInventoryData: any = productInventoryData?.map((_data) =>
                                _data?._id === _product?._id && _data?.warehouseId === _product?.warehouseId
                                  ? { ..._data, inventory: inventory }
                                  : _data
                              );
                              setProductInventoryData(tempProductInventoryData);
                              setProducts((preVal) => {
                                preVal?.forEach((_p) => {
                                  if (_p?._id === selectedProduct?._id) {
                                    _p.qty =
                                      _p.totalQty -
                                      tempProductInventoryData
                                        ?.filter((p) => p?._id === selectedProduct?._id)
                                        ?.reduce((sum, row) => sum + row?.inventory, 0);
                                  }
                                });
                                return preVal;
                              });
                            }}
                            error={_product?.inventory > _product?.qty}
                            helperText={
                              _product?.inventory > _product?.qty
                                ? type === 'add'
                                  ? 'Assigned inventory more than available Qty'
                                  : 'Removed inventory more than Assigned'
                                : ''
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>Inventory not available</Typography>
        )}
        <Box pt={1}>
          {productInventoryData?.filter((p) => p?._id === selectedProduct?._id)?.reduce((sum, row) => row?.inventory + sum, 0) >
            selectedProducts?.find((s) => s?._id === selectedProduct?._id)?.qty && (
            <Typography color="error">You are trying to {type === 'add' ? 'assign' : 'remove'} more inventory</Typography>
          )}
        </Box>
      </CustomDialogContent>
    </Dialog>
  );
};

export default AddNonSerializedInventory;
