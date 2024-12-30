import React, { useEffect, useState, useContext } from 'react';
import { Dialog, Box, TextField, Table, TableHead, Paper, TableContainer, TableBody, TableCell, TableRow, Link, Checkbox } from '@mui/material';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { ASSET_NUMBER_TYPE, CustomDialogTransition, sidebarResource } from '../../../constants/helpers';
import { Formik, Form, FieldArray } from 'formik';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { read, utils, writeFile } from 'xlsx';
import { serializedAsset } from '../../../constants/helpers';
import Autocomplete from '@mui/material/Autocomplete';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const CustomAssetDialog = ({ products, loading, handleClose, handleSuccess, resource }) => {
  const { setToastConfig } = useContext(CustomToastContext);

  const [productList, setProductList] = useState(null);
  const [assetNumberTypeField, setAssetNumberTypeField] = useState(null);

  const [fullScreen, setFullScreen] = useState(true);

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        const assetNumberType = data.find((d) => d?.fieldData?.fieldName === 'assetNumberType')?.fieldData;
        if (assetNumberType) {
          setAssetNumberTypeField(assetNumberType);
        }
        const productsData = products.flatMap((product, index) =>
          [...Array(product?.qty).keys()].map((_, index2) => ({
            id: product?.id,
            index: `${index + 1}.${index2 + 1}`,
            productName: product?.productName,
            createAsset: true,
            assetNumberType: assetNumberType ? ASSET_NUMBER_TYPE.auto : ASSET_NUMBER_TYPE.manual,
            assetNumber: ''
          }))
        );
        setProductList(productsData);
      })
      .catch((err) => {
        setToastConfig(err);
      });
  }, [products]);

  const handleSubmit = (values) => {
    const data: any = [...products];
    data?.forEach((ele) => {
      ele.assetNumbers = values?.products
        ?.filter((e) => e.assetNumberType === ASSET_NUMBER_TYPE.manual && e.id === ele.id)
        ?.map((e) => {
          return { assetNumber: e.assetNumber, createAsset: e.createAsset };
        });
    });
    handleSuccess(data);
  };

  const handleExport = (values) => {
    let json_data = values.products?.map((data) => {
      const obj: any = {};
      obj['Index'] = data['index'];
      obj['Product Name'] = data['productName'];
      if (resource === sidebarResource.purchaseOrder) {
        obj['Create Assets'] = data['createAsset'] ? 'TRUE' : 'FALSE';
      }
      if (assetNumberTypeField) {
        obj['Asset Number Type'] = data['assetNumberType'];
      }
      obj['Asset Number'] = data['assetNumber'];
      return obj;
    });
    let header = [];
    header.push('Index');
    header.push('Product Name');
    if (resource === sidebarResource.purchaseOrder) {
      header.push('Create Assets');
    }
    if (assetNumberTypeField) {
      header.push('Asset Number Type');
    }
    header.push('Asset Number');
    const ws = utils.json_to_sheet(json_data);
    if (header.length) {
      utils.sheet_add_aoa(ws, [header]);
    }
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    writeFile(wb, resource === sidebarResource.purchaseOrder ? 'Purchase Order Assets.xlsx' : 'Inventory to Assets.xlsx');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>, setValues, values) => {
    e.preventDefault();
    const files = e.target.files,
      f = files[0];
    let reader = new FileReader();
    reader.onload = function (e) {
      const data = e.target.result;
      let readedData = read(data, { type: 'binary' });
      const wsname = readedData.SheetNames[0];
      const ws = readedData.Sheets[wsname];
      const dataParse = utils.sheet_to_json(ws, { header: 1 });
      if (dataParse.length > 1) {
        dataParse.splice(0, 1);
        let option = [];
        dataParse?.forEach((row) => {
          let rowInsert = {};
          rowInsert['index'] = row[0]?.toString();
          rowInsert['productName'] = row[1]?.toString();
          if (resource === sidebarResource.purchaseOrder) {
            rowInsert['createAsset'] = row[2]?.toString()?.trim() === 'TRUE' ? true : false;
            if (assetNumberTypeField) {
              rowInsert['assetNumberType'] = rowInsert['createAsset'] ? row[3]?.toString() : ASSET_NUMBER_TYPE.manual;
              rowInsert['assetNumber'] = row[4]?.toString();
            } else {
              rowInsert['assetNumber'] = row[3]?.toString();
            }
          } else {
            rowInsert['createAsset'] = true;
            if (assetNumberTypeField) {
              rowInsert['assetNumberType'] = row[2]?.toString();
              rowInsert['assetNumber'] = row[3]?.toString();
            } else {
              rowInsert['assetNumber'] = row[2]?.toString();
            }
          }
          option.push(rowInsert);
        });
        const updatedProducts = values.products.map((product) => {
          const matchingRow = option.find((e) => e.index === product.index && e.productName === product.productName);
          if (matchingRow) {
            return {
              ...product,
              createAsset: matchingRow.createAsset,
              assetNumberType: matchingRow.assetNumberType,
              assetNumber: matchingRow.assetNumber
            };
          }
          return product;
        });
        setValues((prevState) => ({
          ...prevState,
          products: updatedProducts
        }));
      }
    };
    reader.readAsBinaryString(f);
    e.target.value = null;
  };

  const validate = (values) => {
    let errors: any = {};
    if (values?.products?.length > 0) {
      const assetNumbersSet = new Set();
      values?.products?.map((e, index) => {
        if (e.assetNumberType === ASSET_NUMBER_TYPE.manual) {
          if (!e.assetNumber || e.assetNumber?.trim() === '') {
            errors[`assetNumber_${index}`] = 'Asset Number is required';
          } else {
            if (assetNumbersSet.has(e.assetNumber?.trim())) {
              errors[`assetNumber_${index}`] = 'Asset Number duplicate';
            } else {
              assetNumbersSet.add(e.assetNumber?.trim());
            }
          }
        }
      });
    }
    return errors;
  };

  return (
    <Dialog
      open
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      maxWidth="md"
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
    >
      {productList ? (
        <Formik initialValues={{ products: productList }} validateOnMount validate={validate} onSubmit={handleSubmit}>
          {({ submitForm, values, setValues, errors }) => (
            <Form autoComplete="off" autoCorrect="off" noValidate className="flex min-h-full flex-col">
              <CustomDialogHeader
                title={resource === sidebarResource.purchaseOrder ? 'Create/Assign Asset Numbers' : 'Assign Asset Numbers'}
                onClose={handleClose}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box mb={2} display="flex">
                    <Box>
                      <Link className="cursor-pointer" onClick={() => handleExport(values)}>
                        Export to excel
                      </Link>
                    </Box>
                    <Box ml={2}>
                      <input
                        accept="xlsx"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImport(e, setValues, values)}
                        id="import-file"
                        multiple
                        type="file"
                      />
                      <label htmlFor="import-file">
                        <Link className="cursor-pointer">Import from excel</Link>
                      </label>
                    </Box>
                  </Box>
                </Box>
                <Box display="flex" flexDirection="column">
                  <TableContainer component={Paper}>
                    <Table aria-label="customized table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Index</TableCell>
                          <TableCell align="left" width={200} className="min-w-[200px]">
                            Product
                          </TableCell>
                          {resource === sidebarResource.purchaseOrder ? (
                            <TableCell align="left" className="min-w-[200px]">
                              Create Assets
                            </TableCell>
                          ) : null}
                          {assetNumberTypeField ? <TableCell className="min-w-[200px]">Asset Number Type *</TableCell> : null}
                          <TableCell align="left" className="min-w-[200px]">
                            Asset Number *
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <FieldArray
                          name="products"
                          render={(arrayHelpers) =>
                            values?.products?.map((data, index) => (
                              <TableRow key={index}>
                                <TableCell component="th" scope="row">
                                  {data.index}
                                </TableCell>
                                <TableCell align="left">{data.productName}</TableCell>
                                {resource === sidebarResource.purchaseOrder ? (
                                  <TableCell align="left">
                                    <Checkbox
                                      checked={data?.createAsset}
                                      onChange={(event) => {
                                        arrayHelpers.replace(index, {
                                          ...values.products[index],
                                          createAsset: event.target.checked,
                                          assetNumberType: ASSET_NUMBER_TYPE.manual
                                        });
                                      }}
                                      inputProps={{ 'aria-label': 'primary checkbox' }}
                                    />
                                  </TableCell>
                                ) : null}
                                {assetNumberTypeField && (
                                  <TableCell align="left">
                                    <Autocomplete
                                      size="small"
                                      value={data.assetNumberType}
                                      getOptionLabel={(option: any) => (option ? option : '')}
                                      options={assetNumberTypeField?.option?.map((e) => e.optionLabel)}
                                      onChange={(_, newValue) => {
                                        arrayHelpers.replace(index, {
                                          ...values.products[index],
                                          ['assetNumberType']: newValue
                                        });
                                      }}
                                      disabled={data.createAsset ? false : true}
                                      disableClearable
                                      renderInput={(params) => (
                                        <TextField {...params} variant="outlined" name={`assetNumberType_${index}`} label="" required />
                                      )}
                                    />
                                  </TableCell>
                                )}
                                <TableCell align="left">
                                  <TextField
                                    fullWidth
                                    label=""
                                    variant="outlined"
                                    type="text"
                                    size="small"
                                    name={`assetNumber_${index}`}
                                    disabled={data.assetNumberType === ASSET_NUMBER_TYPE.auto ? true : false}
                                    placeholder="Asset Number"
                                    value={data.assetNumberType === ASSET_NUMBER_TYPE.auto ? 'Auto Generate' : data.assetNumber}
                                    onChange={(e) => {
                                      arrayHelpers.replace(index, {
                                        ...values.products[index],
                                        ['assetNumber']: e.target.value
                                      });
                                    }}
                                    error={Boolean(errors[`assetNumber_${index}`])}
                                    helperText={errors[`assetNumber_${index}`]}
                                    required
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          }
                        />
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton onClick={submitForm} buttonType="theme" disabled={loading} isLoading={loading}>
                  Submit
                </ThemeButton>
              </CustomDialogFooter>
            </Form>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default CustomAssetDialog;
