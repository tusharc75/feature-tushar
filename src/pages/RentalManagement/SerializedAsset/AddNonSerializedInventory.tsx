import { Autocomplete, Box, Dialog, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomDialogTransition, productInventory, rentalManagement } from 'src/constants/helpers';

const AddNonSerializedInventory = ({ onClose, onSuccess, selectedProducts, referenceId, type = 'add', nonSerializedInventory = [] }) => {

  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, resources }
  }: any = useData();

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
    if (type === 'add') {
      fetchProductInventory();
    } else {
      setProductInventoryData(nonSerializedInventory?.filter(s => s?.product?.optionValue === selectedProduct?.materialId && s?._id === selectedProduct?._id && s?.qty)?.map(s => ({
        _id: selectedProduct?._id,
        materialId: selectedProduct?.materialId,
        warehouse: s?.warehouse?.optionLabel,
        warehouseId: s?.warehouse?.optionValue,
        storageLocation: s?.storageLocation?.optionLabel,
        storageLocationId: s?.storageLocation?.optionValue,
        qty: s?.qty,
        inventory: s?.qty,
        serialNumbers: s?.serialNumbers?.length ? s?.serialNumbers : []
      })))
    }
  }, [selectedProduct]);

  const fetchProductInventory = () => {
    axiosInstance()
      .get(`${productInventory.api}/product/${selectedProduct?.materialId}?activeStorageLocation=true`)
      .then(async ({ data: { data } }) => {
        if (!productInventoryData?.find((e) => e._id === selectedProduct._id)) {
          let nonExistingInventory = data?.filter((d) => d?.warehouse)
            ?.map((d) => ({
              _id: selectedProduct?._id,
              materialId: selectedProduct?.materialId,
              warehouse: d?.warehouse?.name,
              warehouseId: d?.warehouse?._id,
              storageLocation: d?.storageLocation?.storageLocationName,
              storageLocationId: d?.storageLocation?._id,
              qty: (d?.inventory || 0) -
                (nonSerializedInventory?.find((s) => s?._id === selectedProduct?._id
                  && s?.warehouse?.optionValue === d?.warehouse?._id && (d?.storageLocation && user?.user?.brandPolicy?.storageLocation ? s?.storageLocation?.optionValue === d?.storageLocation?._id : true))?.qty ||
                  0),
              inventory: 0,
              serialNumbers: []
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
        axiosInstance().put(`${rentalManagement.api}/${referenceId}/add-non-serial-inventory`,
          data?.map((p) => ({
            product: p?.materialId,
            warehouse: p?.warehouseId,
            ...(user?.user?.brandPolicy?.storageLocation ? { storageLocation: p?.storageLocationId } : {}),
            qty: p?.inventory,
            _id: p?._id,
            serialNumbers: p?.serialNumbers
          }))
        ).then(() => {
          setSubmitting(false);
          onSuccess();
        }).catch((error) => {
          toastConfig.setToastConfig(error);
          setSubmitting(false);
        });
      } else {
        axiosInstance().put(`${rentalManagement.api}/${referenceId}/remove-non-serial-inventory`,
          data?.map((p) => ({
            product: p?.materialId,
            warehouse: p?.warehouseId,
            ...(user?.user?.brandPolicy?.storageLocation ? { storageLocation: p?.storageLocationId } : {}),
            qty: p?.inventory,
            _id: p?._id,
            serialNumbers: p?.serialNumbers
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
      <ThemeButton
        buttonType="theme"
        disabled={
          isSubmitting ||
          !productInventoryData?.length ||
          products?.some((d) => d?.qty < 0) ||
          productInventoryData?.some((p) => p?.inventory > p?.qty || p?.serialNumbers?.length > p?.inventory) ||
          productInventoryData?.every((p) => p?.inventory === 0)
        }
        onClick={handleSubmit}
        isLoading={isSubmitting}
      >
        {type === 'add' ? 'Assign' : 'Remove'}
      </ThemeButton>
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
                  <TableCell sx={{ width: '40%' }}>{resources?.warehouse?.titleSingular}</TableCell>
                  <TableCell sx={{ width: '10%' }} align="left">Qty</TableCell>
                  <TableCell sx={{ width: '10%' }} align="left">{type === 'add' ? 'Assign' : 'Remove'} Inventory</TableCell>
                  <TableCell sx={{ width: '40%' }} align="left">Serial Number</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productInventoryData?.length > 0 &&
                  productInventoryData
                    ?.filter((p) => p?._id === selectedProduct?._id)
                    ?.map((_product: any, index: any) => (
                      <TableRow key={`${_product?._id}_${index}`}>
                        <TableCell component="th" scope="row">
                          {`${_product?.warehouse} ${_product?.storageLocation ? `(${_product?.storageLocation})` : ''}`}
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
                                _data?._id === _product?._id &&
                                  _data?.warehouseId === _product?.warehouseId &&
                                  _data?.storageLocationId === _product?.storageLocationId
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
                        <TableCell align="left">
                          <Autocomplete
                            size="small"
                            options={[]}
                            freeSolo={true}
                            multiple={true}
                            disableCloseOnSelect
                            value={_product['serialNumbers']}
                            onChange={(_, val) => {
                              const serialNumbers = val?.length > 0 ? val : [];
                              const tempProductInventoryData: any = productInventoryData?.map((_data) =>
                                _data?._id === _product?._id &&
                                  _data?.warehouseId === _product?.warehouseId &&
                                  _data?.storageLocationId === _product?.storageLocationId
                                  ? { ..._data, serialNumbers: serialNumbers }
                                  : _data
                              );
                              setProductInventoryData(tempProductInventoryData);
                            }}
                            isOptionEqualToValue={(item, current) => item === current}
                            getOptionLabel={(option) => option}
                            renderInput={(props) => (
                              <TextField
                                {...props}
                                placeholder={'Enter serial number and press enter'}
                                variant="outlined"
                                name="serialNumbers"
                                label={'Serial Numbers'}
                                error={_product?.serialNumbers?.length > _product?.inventory}
                                helperText={_product?.serialNumbers?.length > _product?.inventory && 'Serial Number can not assign more than inventory'}
                              />
                            )}
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
