import Autocomplete from '@mui/material/Autocomplete';
import { Box, Dialog, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { FieldArray, Form, Formik } from 'formik';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ConsumablesQtyDialog = ({
  referenceId,
  referenceType,
  warehouse,
  onClose,
  onSuccess,
  selectedRecords,
  serviceName,
  consumeRequest,
  serialNumberRequired
}) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user }
  }: any = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullScreen, setFullScreen] = useState(true);
  const [storageLocationOptions, setStorageLocationOptions] = useState([]);

  useEffect(() => {
    if (user?.user?.brandPolicy?.storageLocation) {
      getStorageLocation();
    }
  }, []);

  const getStorageLocation = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.storageLocation}`)
      .then(({ data: { data } }) => {
        if (data[sidebarResource.storageLocation]) {
          const storageLocationOption = data[sidebarResource.storageLocation]?.filter((e) => e.warehouse === warehouse?.optionValue);
          setStorageLocationOptions(storageLocationOption);
        }
      });
  };

  const handleSubmit = (values) => {
    const data: any = {};
    const products: any = [];
    values?.products?.forEach((e) => {
      if (parseInt(e?.consumedQty)) {
        products.push({
          _id: e?._id,
          product: e?.materialId,
          qty: parseInt(e?.consumedQty),
          storageLocation: user?.user?.brandPolicy?.storageLocation ? e?.storageLocation : null,
          serialNumber: e?.serialNumber
        });
      }
    });

    data.products = products;
    data.referenceId = referenceId;
    data.referenceType = referenceType;
    if (products?.length) {
      setIsSubmitting(true);
      axiosInstance()
        .put('/material-handling/consume', data)
        .then(({ data }) => {
          onSuccess();
          setIsSubmitting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleRequest = (values) => {
    const data: any = {
      referenceType,
      referenceId
    };
    const products: any = [];
    values?.products?.forEach((e) => {
      if (parseInt(e?.consumedQty)) {
        products.push({
          _id: e?._id,
          product: e?.materialId,
          qty: parseInt(e?.consumedQty),
          storageLocation: user?.user?.brandPolicy?.storageLocation ? e?.storageLocation : null,
          serialNumber: e?.serialNumber
        });
      }
    });
    data.products = products;
    if (products?.length) {
      setIsSubmitting(true);
      axiosInstance()
        .put(`material-handling/request`, data)
        .then(({ data }) => {
          onSuccess();
          setIsSubmitting(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setIsSubmitting(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const validate = (values) => {
    let errors: any = {};
    if (values?.length > 0) {
      values.map((d) => {
        if (user?.user?.brandPolicy?.storageLocation) {
          if (!d.storageLocation) {
            errors.storageLocation = 'Storage Location is required';
          }
        }
        // if (!consumeRequest) {
        //   let tempProduct = selectedRecords.find((u) => u._id === d._id);
        //   let qty = tempProduct.qty - ((tempProduct?.consumedQty || 0) + (tempProduct?.requestedQty || 0));
        //   if (tempProduct && d.consumedQty > qty) {
        //     errors.consumedQty = `Consume Qty is limited to Qty.`;
        //   }
        // }
        if (d.consumedQty < 1) {
          errors.consumedQty = `Consume Qty cannot be 0`;
        }
        if (serialNumberRequired && parseInt(d.consumedQty) !== d.serialNumber.length) {
          errors.serialNumber = `Serial Number must be equal to Consume Qty`;
        }
        if (parseInt(d.consumedQty) < d.serialNumber.length) {
          errors.serialNumber = `Serial Number must be less than or equal to Consume Qty`;
        }
      });
    }
    return errors;
  };

  return (
    <Dialog
      open
      TransitionComponent={CustomDialogTransition}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      <CustomDialogHeader
        title={serviceName ? `${serviceName} - Products/Consumables` : 'Products/Consumables'}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <Formik
        initialValues={{
          products: selectedRecords?.map((item) => ({
            _id: item?._id,
            materialId: item?.materialId,
            product: item?.product,
            qty: item.qty - ((item?.consumedQty || 0) + (item?.requestedQty || 0)),
            consumedQty: item.qty - ((item?.consumedQty || 0) + (item?.requestedQty || 0)),
            storageLocation: null,
            serialNumber: []
          }))
        }}
        enableReinitialize={true}
        onSubmit={() => { }}
      >
        {({ values }) => (
          <>
            <CustomDialogContent>
              {values?.products && values?.products?.length ? (
                <Box className="max-[768px]:py-[11px] min-[769px]:p-[16px]">
                  <Form>
                    <FieldArray
                      name="products"
                      render={(arrayHelpers) => (
                        <>
                          <div className="max-[768px]:hidden">
                            <div className={'max-h-[calc(100vh-200px)] overflow-auto rounded [border:1px_solid_var(--common-border-color)]'}>
                              <Table aria-label="customized table" className="min-w-fit">
                                <TableHead>
                                  <TableRow className=" sticky top-0 z-10 bg-[var(--dark-primary,white)]">
                                    <TableCell style={{ minWidth: 70 }}>Index</TableCell>
                                    <TableCell align="left" style={{ minWidth: 150 }}>
                                      Product
                                    </TableCell>
                                    {user?.user?.brandPolicy?.storageLocation && (
                                      <TableCell align="left" style={{ minWidth: 250 }}>
                                        Storage Location
                                      </TableCell>
                                    )}
                                    <TableCell align="left" style={{ minWidth: 200 }}>
                                      {'Qty'}
                                    </TableCell>
                                    <TableCell align="left" style={{ minWidth: 200 }}>
                                      {consumeRequest ? 'Request Qty' : 'Consume Qty'}
                                    </TableCell>
                                    <TableCell align="left" style={{ minWidth: 230 }}>
                                      Serial Numbers
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {values?.products?.map((value: any, index) => (
                                    <TableRow key={value._id}>
                                      <TableCell component="td" scope="row">
                                        {index + 1}
                                      </TableCell>
                                      <TableCell align="left">{value['product']}</TableCell>
                                      {user?.user?.brandPolicy?.storageLocation && (
                                        <TableCell align="left">
                                          <Autocomplete
                                            options={storageLocationOptions}
                                            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                                            isOptionEqualToValue={(option: any, val) => option.optionValue === val}
                                            value={
                                              storageLocationOptions.filter((data) => data.optionValue === value['storageLocation']).length
                                                ? storageLocationOptions.filter((data) => data.optionValue === value['storageLocation'])[0]
                                                : ''
                                            }
                                            onChange={(e, val) => {
                                              arrayHelpers.replace(index, {
                                                ...values.products[index],
                                                storageLocation: val?.optionValue
                                              });
                                            }}
                                            renderInput={(params) => (
                                              <TextField
                                                {...params}
                                                style={{ minWidth: '200px' }}
                                                margin="dense"
                                                size="small"
                                                name="storageLocation"
                                                label="Storage Location"
                                                placeholder="Storage Location"
                                                variant="outlined"
                                                fullWidth
                                                required
                                                error={validate([value])?.storageLocation}
                                                helperText={validate([value])?.storageLocation ? 'Storage Location is required' : ''}
                                              />
                                            )}
                                          />
                                        </TableCell>
                                      )}
                                      <TableCell align="left">
                                        <TextField
                                          fullWidth
                                          size="small"
                                          variant="outlined"
                                          autoComplete="off"
                                          name={'qty'}
                                          disabled={true}
                                          type="number"
                                          value={value['qty']}
                                          label="Qty"
                                          placeholder="Qty"
                                        />
                                      </TableCell>
                                      <TableCell align="left">
                                        <TextField
                                          fullWidth
                                          size="small"
                                          variant="outlined"
                                          autoComplete="off"
                                          name={'consumedQty'}
                                          type="number"
                                          required
                                          value={value['consumedQty']}
                                          error={validate([value])?.consumedQty}
                                          onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                          onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                            arrayHelpers.replace(index, {
                                              ...values.products[index],
                                              consumedQty: value
                                            });
                                          }}
                                          label={consumeRequest ? 'Request Qty' : 'Consume Qty'}
                                          placeholder={consumeRequest ? 'Request Qty' : 'Consume Qty'}
                                          helperText={
                                            // validate([value])?.consumedQty ? `${consumeRequest ? 'Request' : 'Consume'} Qty is limited to Qty.` : ''
                                            validate([value])?.consumedQty ?? ''
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
                                          value={values['serialNumber']}
                                          onChange={(_, val) => {
                                            arrayHelpers.replace(index, {
                                              ...values.products[index],
                                              serialNumber: val
                                            });
                                          }}
                                          isOptionEqualToValue={(item, current) => item === current}
                                          getOptionLabel={(option) => option}
                                          renderInput={(props) => (
                                            <TextField
                                              {...props}
                                              placeholder={'Enter serial number and press enter'}
                                              variant="outlined"
                                              name="serialNumber"
                                              required={serialNumberRequired}
                                              label={'Serial Number'}
                                              error={validate([value])?.serialNumber}
                                              helperText={validate([value])?.serialNumber}
                                            />
                                          )}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                          <div className="min-[769px]:hidden">
                            {values?.products?.map((value: any, index) => (
                              <div
                                className="item mb-2 grid grid-cols-[1fr_3fr] gap-2 rounded-[8px] px-[20px] py-[15px] shadow-[0px_5.44444px_27.22222px_0px_rgba(0,_0,_0,_0.06)]"
                                style={{ border: '1px solid var(--common-border-color)' }}
                                key={value._id}
                              >
                                <h5 className="text-[#aaa]">Index:</h5>
                                <p>{index + 1}</p>

                                <h5 className="text-[#aaa]">Product:</h5>
                                <p className="pb-1">{value['product']}</p>

                                {user?.user?.brandPolicy?.storageLocation && (
                                  <>
                                    <h5 className="mt-2 text-[#aaa]">Storage Location:</h5>
                                    <div>
                                      <Autocomplete
                                        options={storageLocationOptions}
                                        getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                                        isOptionEqualToValue={(option: any, val) => option.optionValue === val}
                                        value={
                                          storageLocationOptions.filter((data) => data.optionValue === value['storageLocation']).length
                                            ? storageLocationOptions.filter((data) => data.optionValue === value['storageLocation'])[0]
                                            : ''
                                        }
                                        onChange={(e, val) => {
                                          arrayHelpers.replace(index, {
                                            ...values.products[index],
                                            storageLocation: val?.optionValue
                                          });
                                        }}
                                        renderInput={(params) => (
                                          <TextField
                                            {...params}
                                            style={{ minWidth: '200px' }}
                                            margin="none"
                                            size={'small'}
                                            name="storageLocation"
                                            label="Storage Location"
                                            placeholder="Storage Location"
                                            variant="outlined"
                                            fullWidth
                                            required
                                            error={validate([value])?.storageLocation}
                                            helperText={validate([value])?.storageLocation ? 'Storage Location is required' : ''}
                                          />
                                        )}
                                      />
                                    </div>
                                  </>
                                )}

                                <h5 className="mt-2 text-[#aaa]">Qty:</h5>
                                <div>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    autoComplete="off"
                                    name={'qty'}
                                    disabled={true}
                                    type="number"
                                    value={value['qty']}
                                    label="Qty"
                                    placeholder="Qty"
                                  />
                                </div>
                                <h5 className="mt-2 text-[#aaa]">Consumed Qty:</h5>
                                <div>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    autoComplete="off"
                                    name={'consumedQty'}
                                    type="number"
                                    required
                                    value={value['consumedQty']}
                                    error={validate([value])?.consumedQty}
                                    onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9]/g, '');
                                      arrayHelpers.replace(index, {
                                        ...values.products[index],
                                        consumedQty: value
                                      });
                                    }}
                                    label={consumeRequest ? 'Request Qty' : 'Consume Qty'}
                                    placeholder={consumeRequest ? 'Request Qty' : 'Consume Qty'}
                                    helperText={
                                      // validate([value])?.consumedQty ? `${consumeRequest ? 'Request' : 'Consume'} Qty is limited to Qty.` : ''
                                      validate([value])?.consumedQty ?? ''
                                    }
                                  />
                                </div>
                                <h5 className="mt-2 text-[#aaa]">Serial Number:</h5>
                                <div>
                                  <Autocomplete
                                    size="small"
                                    options={[]}
                                    freeSolo={true}
                                    multiple={true}
                                    disableCloseOnSelect
                                    value={values['serialNumber']}
                                    onChange={(_, val) => {
                                      arrayHelpers.replace(index, {
                                        ...values.products[index],
                                        serialNumber: val
                                      });
                                    }}
                                    isOptionEqualToValue={(item, current) => item === current}
                                    getOptionLabel={(option) => option}
                                    renderInput={(props) => (
                                      <TextField
                                        {...props}
                                        placeholder={'Enter serial number and press enter'}
                                        variant="outlined"
                                        name="serialNumber"
                                        required={serialNumberRequired}
                                        label={'Serial Number'}
                                        error={validate([value])?.serialNumber}
                                        helperText={validate([value])?.serialNumber}
                                      />
                                    )}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    />
                  </Form>
                </Box>
              ) : (
                <Box p={2} height={300}>
                  <CommonSkeleton lenArray={[...Array(6).keys()]} />
                </Box>
              )}
            </CustomDialogContent>
            <CustomDialogFooter>
              <ThemeButton buttonType="transparent" disabled={isSubmitting}  onClick={onClose}>
                Cancel
              </ThemeButton>
              {consumeRequest ? (
                <ThemeButton
                  onClick={() => {
                    if (
                      !validate(values.products).consumedQty &&
                      !validate(values.products).storageLocation &&
                      !Boolean(validate(values.products).serialNumber)
                    ) {
                      handleRequest(values);
                    }
                  }}
                  disabled={isSubmitting}
                  buttonType="theme"
                >
                  Request
                </ThemeButton>
              ) : (
                <ThemeButton
                  onClick={() => {
                    if (
                      !Boolean(validate(values.products).consumedQty) &&
                      !Boolean(validate(values.products).storageLocation) &&
                      !Boolean(validate(values.products).serialNumber)
                    ) {
                      handleSubmit(values);
                    }
                  }}
                  buttonType="theme"
                  disabled={isSubmitting}
                >
                  Save
                </ThemeButton>
              )}
            </CustomDialogFooter>
          </>
        )}
      </Formik>
    </Dialog>
  );
};

export default ConsumablesQtyDialog;
