import React, { useContext, useEffect, useState } from 'react';
import { Dialog, Box, TextField, Table, TableHead, Paper, TableContainer, TableBody, TableCell, TableRow, Link } from '@material-ui/core';
import { ASSET_NUMBER_TYPE, CustomDialogTransition, sublease } from '../../../constants/helpers';
import { Formik, Form, FieldArray } from 'formik';
import CustomButton from 'src/components/Helpers/CustomButton';
import { read, utils, writeFile } from 'xlsx';
import { Autocomplete } from '@material-ui/lab';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axiosInstance from 'src/axios/axiosInstance';
import { uniqBy } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const AssetDialog = ({ products, loading, handleClose, handleSuccess, subleaseId }) => {
  const toastConfig = useContext(CustomToastContext);

  const [productList, setProductList] = useState(null);
  const [fullScreen, setFullScreen] = useState(true);
  const [existingAssets, setExistingAssets] = useState([]);

  useEffect(() => {
    const productsData = products.flatMap((product, index) =>
      [...Array(product?.qty).keys()].map((_, index2) => ({
        _id: product?._id,
        index: `${index + 1}.${index2 + 1}`,
        productName: product?.productName,
        product: product?.product,
        assetNumberType: ASSET_NUMBER_TYPE.auto,
        assetNumber: ''
      }))
    );
    setProductList(productsData);
  }, [products]);

  useEffect(() => {
    if (productList) {
      fetchExistingAssets();
    }
  }, [productList]);

  const fetchExistingAssets = () => {
    axiosInstance()
      .get(`${sublease.api}/${subleaseId}/existing-assets?products=${JSON.stringify(uniqBy(productList, 'product')?.map((p: any) => p?.product))}`)
      .then(({ data: { data } }) => {
        setExistingAssets(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSubmit = (values) => {
    handleSuccess(values?.products);
  };

  const handleExport = (values) => {
    let json_data = values.products?.map((data) => {
      const obj: any = {};
      obj['Index'] = data['index'];
      obj['Product Name'] = data['productName'];
      obj['Asset Number Type'] = data['assetNumberType'];
      obj['Asset Number'] = data['assetNumber'];
      return obj;
    });
    let header = [];
    header.push('Index');
    header.push('Product Name');
    header.push('Asset Number Type');
    header.push('Asset Number');
    const ws = utils.json_to_sheet(json_data);
    if (header.length) {
      utils.sheet_add_aoa(ws, [header]);
    }
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    writeFile(wb, 'Sublease to Assets.xlsx');
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
          rowInsert['assetNumberType'] = row[2]?.toString();
          rowInsert['assetNumber'] = row[3]?.toString();
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
        if ([ASSET_NUMBER_TYPE.manual, ASSET_NUMBER_TYPE.existing].includes(e.assetNumberType)) {
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
      <CustomDialogHeader
        title={'Create/Assign Asset Numbers'}
        onClose={handleClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      ></CustomDialogHeader>
      {productList ? (
        <Formik initialValues={{ products: productList }} validateOnMount validate={validate} onSubmit={handleSubmit}>
          {({ submitForm, values, setValues, errors }) => (
            <>
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
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Box display="flex" flexDirection="column">
                    <TableContainer component={Paper}>
                      <Table aria-label="customized table">
                        <TableHead>
                          <TableRow>
                            <TableCell width="10%">Index</TableCell>
                            <TableCell width="30%" align="left" className="min-w-[200px]">
                              Product
                            </TableCell>
                            <TableCell width="30%" align="left" className="min-w-[200px]">
                              Asset Number Type *
                            </TableCell>
                            <TableCell width="30%" align="left" className="min-w-[200px]">
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
                                  <TableCell align="left">
                                    <Autocomplete
                                      size="small"
                                      value={data.assetNumberType}
                                      getOptionLabel={(option: any) => (option ? option : '')}
                                      options={Object.values(ASSET_NUMBER_TYPE)}
                                      onChange={(_, newValue) => {
                                        arrayHelpers.replace(index, {
                                          ...values.products[index],
                                          ['assetNumberType']: newValue,
                                          ['assetNumber']: newValue === ASSET_NUMBER_TYPE.auto ? 'Auto Generate' : ''
                                        });
                                      }}
                                      disableClearable
                                      renderInput={(params) => (
                                        <TextField {...params} variant="outlined" name={`assetNumberType_${index}`} label="" required />
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell align="left">
                                    {data.assetNumberType === ASSET_NUMBER_TYPE.existing ? (
                                      <Autocomplete
                                        fullWidth
                                        options={existingAssets ? existingAssets?.filter((e) => e?.product === data?.product) : []}
                                        getOptionLabel={(option: any) => (option ? option?.assetNumber : '')}
                                        getOptionSelected={(option: any, val) => option.assetNumber === val}
                                        value={
                                          existingAssets?.filter((e) => e?.assetNumber === data.assetNumber)?.length > 0
                                            ? existingAssets?.filter((e) => e?.assetNumber === data.assetNumber)[0]
                                            : ''
                                        }
                                        onChange={(e, val) => {
                                          arrayHelpers.replace(index, {
                                            ...values.products[index],
                                            ['assetNumber']: val ? val?.assetNumber : ''
                                          });
                                        }}
                                        renderInput={(params) => (
                                          <TextField
                                            {...params}
                                            margin="dense"
                                            name={`assetNumber_${index}`}
                                            label=""
                                            variant="outlined"
                                            error={Boolean(errors[`assetNumber_${index}`])}
                                            helperText={errors[`assetNumber_${index}`]}
                                            required
                                            fullWidth
                                          />
                                        )}
                                      />
                                    ) : (
                                      <TextField
                                        fullWidth
                                        label=""
                                        variant="outlined"
                                        type="text"
                                        size="small"
                                        name={`assetNumber_${index}`}
                                        disabled={data.assetNumberType === ASSET_NUMBER_TYPE.auto ? true : false}
                                        placeholder="Asset Number"
                                        value={data.assetNumber}
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
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            }
                          />
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <CustomButton
                  id="receive-dialog-submit-button"
                  onClick={submitForm}
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  loading={loading}
                >
                  Submit
                </CustomButton>
              </CustomDialogFooter>
            </>
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

export default AssetDialog;
