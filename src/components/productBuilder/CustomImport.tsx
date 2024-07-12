import { useContext, useEffect, useState } from 'react';
import {
  Dialog,
  Button,
  Grid,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Table,
  Box,
  Paper,
  IconButton
} from '@material-ui/core';
import { CustomDialogTransition, downloadExcel } from 'src/constants/helpers';
import { Autocomplete } from '@material-ui/lab';
import { AiOutlineImport } from 'react-icons/ai';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import _, { isEmpty, uniqBy } from 'lodash';
import { read, utils, write } from 'xlsx';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { AddField } from 'src/components/FormBuilder/AddField';

export const CustomImport = ({ handleClose, onSuccess, refrenceId, currency = 'USD' }) => {
  const toastConfig = useContext(CustomToastContext);

  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({ productCategory: '', productTemplate: '', priceTemplate: '' });
  const [productCategory, setProductCategory] = useState([]);
  const [productTemplate, setProductTemplate] = useState([]);
  const [priceTemplate, setPriceTemplate] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [templateImportHeader, setTemplateImportHeaader] = useState([]);
  const [customImportHeader, setCustomImportHeaader] = useState([]);
  const [keyValue, setKeyValue] = useState([]);
  const [file, setFile] = useState();
  const [addSystemColumn, setAddSystemColumn] = useState(false);
  const [addedField, setAddedField] = useState([]);

  useEffect(() => {
    axiosInstance()
      .get(`/product-category?sortBy=name&orderBy=asc`)
      .then(({ data }) => {
        data.data = data.data?.map((u) => ({
          optionValue: u._id,
          optionLabel: u.name
        }));
        setProductCategory(data.data);
      });
  }, []);

  const handleChangeCategory = () => {
    const value = values['productCategory'];
    const label = productCategory?.find((p) => p?.optionValue === value)?.optionLabel || '';
    if (value && value !== '') {
      axiosInstance()
        .post(`/product-template/template/` + value, { entity: null })
        .then(({ data: { data } }) => {
          setProductTemplate(data.data);
          if (data.data.length) {
            var defaultproductTemplate = data.data[0].optionValue;
            data.data.forEach((_f) => {
              let re = new RegExp(_f.optionLabel);
              if (label.match(re)) {
                defaultproductTemplate = _f.optionValue;
                return;
              }
            });
            setValues({ ...values, productTemplate: defaultproductTemplate });
          }
        });
    }
  };

  useEffect(() => {
    handleChangeCategory();
  }, [values?.productCategory]);

  useEffect(() => {
    handleChangeProductTemplate();
  }, [values?.productTemplate]);

  const handleChangeProductTemplate = () => {
    const value = values['productTemplate'];
    if (value) {
      axiosInstance()
        .get(`/price-template/product-template/` + value)
        .then(({ data: { data } }) => {
          setPriceTemplate(data.data);
          if (data.data.length) {
            if (data.data.length) {
              setValues({ ...values, priceTemplate: data.data[0].optionValue });
            }
          }
        });
    }
  };

  useEffect(() => {
    let _keyValue = [];
    customImportHeader?.forEach((_value) => {
      if (templateImportHeader?.find((templateImportHeader) => templateImportHeader?.value === _value?.value) ? true : false) {
        _keyValue = [..._keyValue, { templateImportHeader: _value?.value, customImportHeader: _value?.value }];
      }
    });

    setKeyValue(_keyValue);
  }, [templateImportHeader, customImportHeader]);

  const fetchTemplate = () => {
    axiosInstance()
      .get(`/productbuilder/custom-import-template?productTemplate=${values?.productTemplate}&priceTemplate=${values?.priceTemplate}`)
      .then(({ data: { data } }) => {
        setFields(data);
        generateTemplateHeader(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  useEffect(() => {
    if (values?.productCategory && values?.productTemplate && values?.priceTemplate) {
      fetchTemplate();
    }
  }, [values]);

  const handleFileImport = (e) => {
    setCustomImportHeaader([]);
    setIsUploading(true);
    let files = e.target.files[0];
    setFile(files);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;

      let readedData = read(data, { type: 'array' });
      const wsname = readedData.SheetNames[0];
      const ws = readedData.Sheets[wsname];
      const jsonData = utils.sheet_to_json(ws, { header: 1 });

      let headers: any = jsonData[0];
      headers = headers?.reduce((result, curr) => {
        if (curr == null) {
          return result;
        }
        result.push({ value: curr, label: curr });
        return result;
      }, []);
      setCustomImportHeaader(headers);
      setIsUploading(false);
    };
    reader.readAsArrayBuffer(files);
  };

  const generateTemplateHeader = (fields) => {
    setTemplateImportHeaader([]);
    const templateHeader: any = [];
    fields?.forEach((_field) => {
      if (_field?.type === 'converter' || _field?.type === 'currencyAmount' || _field?.isConverter === true) {
        if (_field?.type !== 'currencyAmount' && (_field?.type === 'converter' || _field?.isConverter === true)) {
          _field?.displayUnits?.forEach((_unit: any) => {
            templateHeader.push(_field?.fieldLabel.toUpperCase() + ' ' + _unit.toUpperCase());
          });
        } else if (_field?.type === 'currencyAmount' && (_field?.type === 'converter' || _field?.isConverter === true)) {
          _field?.displayUnits.forEach((_unit: any) => {
            _field?.displayCurrency.forEach((_currency: any) => {
              if (_currency === 'CUR') {
                _currency = currency;
              }
              templateHeader.push(_field?.fieldLabel.toUpperCase() + ' ' + _currency.toUpperCase() + ' ' + _unit.toUpperCase());
            });
          });
        } else if (_field?.type === 'currencyAmount') {
          _field?.displayCurrency.forEach((_currency: any) => {
            if (_currency === 'CUR') {
              _currency = currency;
            }
            templateHeader.push(_field?.fieldLabel.toUpperCase() + ' ' + _currency.toUpperCase());
          });
        }
      } else {
        templateHeader.push(_field?.fieldLabel?.toUpperCase());
      }
    });

    const _templateHeader = templateHeader.reduce((result, curr) => {
      if (curr == null) {
        return result;
      }
      result.push({ value: curr, label: curr });
      return result;
    }, []);

    setTemplateImportHeaader(_templateHeader);
  };

  const handleCustomImport = () => {
    if (!file) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Please Upload File'
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;

        let readedData = read(data, { type: 'array' });
        const wsname = readedData.SheetNames[0];
        const ws = readedData.Sheets[wsname];
        const jsonData = utils.sheet_to_json(ws, { header: 1 });

        const headers: any = jsonData[0];
        const newHeaders = headers?.map((header) => {
          const _header = keyValue?.find((k) => k?.customImportHeader === header);
          if (_header) {
            return _header?.templateImportHeader;
          }
          return header;
        });

        jsonData[0] = newHeaders;

        const updatedData = jsonData?.filter((row) => !isEmpty(row));

        const newWorksheet = utils.json_to_sheet(updatedData, { skipHeader: true });

        const newWorkbook = utils.book_new();
        utils.book_append_sheet(newWorkbook, newWorksheet, wsname);

        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const excelBuffer = write(newWorkbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: fileType });

        handleSave(blob);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleSave = (file) => {
    setLoading(true);
    toastConfig.setToastConfig({
      hideDuration: null,
      open: true,
      type: 'info',
      message: `Uploading builder, Please wait...`
    });

    let formData = new FormData();
    formData.append('file', file);
    formData.append('refrenceId', refrenceId);
    formData.append('productCategory', values?.productCategory);
    formData.append('productTemplate', values?.productTemplate);
    formData.append('priceTemplate', values?.priceTemplate);
    if(addedField?.length > 0){
      formData.append('fields', JSON.stringify(addedField));
    }

    axiosInstance()
      .post(`/productbuilder/import`, formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then((response) => {
        if (!response.headers['content-disposition']) {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'All Records Added Successfully'
          });
          onSuccess();
          setLoading(false);
        } else {
          const fileName = response.headers['content-disposition'].split('filename=')[1];
          downloadExcel(response.data, fileName);
          toastConfig.setToastConfig({
            open: true,
            type: 'error',
            message: `Found some issue(s) while importing builder`
          });
          setLoading(false);
        }
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      <Dialog open={true} onClose={handleClose} TransitionComponent={CustomDialogTransition} fullScreen={true} fullWidth maxWidth="md">
        <>
          <CustomDialogHeader title="Custom File Import" onClose={handleClose} />
          <CustomDialogContent>
            <Grid container xs={12} lg={12} md={12} spacing={2}>
              <Grid item lg={2} md={2}>
                <Box display={'flex'} alignItems={'center'} mt={1}>
                  <Box>
                    <input
                      id={`customImportFile`}
                      name={`customImportFile`}
                      onChange={handleFileImport}
                      style={{ display: 'none' }}
                      onClick={(e: any) => (e.target.value = null)}
                      type="file"
                      accept=".xlsx,.csv"
                      disabled={_.some(_.values(values), (v) => v === '')}
                    />
                    <label htmlFor={`customImportFile`}>
                      <Button
                        size="medium"
                        variant="outlined"
                        component="span"
                        disabled={_.some(_.values(values), (v) => v === '')}
                        startIcon={<AiOutlineImport />}
                      >
                        Import File
                      </Button>
                    </label>
                  </Box>
                </Box>
              </Grid>
              <Grid item lg={10} md={10}>
                <Grid container spacing={2}>
                  <Grid item md={3} lg={3}>
                    <Autocomplete
                      id="product-category"
                      options={productCategory}
                      getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                      getOptionSelected={(option: any, val) => option.optionValue === val}
                      value={
                        productCategory?.filter((p) => p?.optionValue === values['productCategory'])?.length > 0
                          ? productCategory?.filter((p) => p?.optionValue === values['productCategory'])[0]
                          : ''
                      }
                      onChange={(e, val) => {
                        setValues({ productCategory: val && val.optionValue ? val.optionValue : '', productTemplate: '', priceTemplate: '' });
                      }}
                      renderInput={(params) => (
                        <TextField {...params} margin="dense" variant="outlined" label="Product Category" placeholder="Product Category" />
                      )}
                    />
                  </Grid>
                  <Grid item md={3} lg={3}>
                    <Autocomplete
                      id="product-template"
                      options={productTemplate}
                      getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                      getOptionSelected={(option: any, val) => option.optionValue === val}
                      value={
                        productTemplate?.filter((p) => p?.optionValue === values['productTemplate'])?.length > 0
                          ? productTemplate?.filter((p) => p?.optionValue === values['productTemplate'])[0]
                          : ''
                      }
                      onChange={(e, val) => {
                        setValues({ ...values, productTemplate: val && val.optionValue ? val.optionValue : '' });
                      }}
                      renderInput={(params) => (
                        <TextField {...params} margin="dense" variant="outlined" label="Product Template" placeholder="Product Template" />
                      )}
                    />
                  </Grid>
                  <Grid item md={3} lg={3}>
                    <Autocomplete
                      id="price-template"
                      options={priceTemplate}
                      getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
                      getOptionSelected={(option: any, val) => option.optionValue === val}
                      value={
                        priceTemplate?.filter((p) => p?.optionValue === values['priceTemplate'])?.length > 0
                          ? priceTemplate?.filter((p) => p?.optionValue === values['priceTemplate'])[0]
                          : ''
                      }
                      onChange={(e, val) => {
                        setValues({ ...values, priceTemplate: val && val.optionValue ? val.optionValue : '' });
                      }}
                      renderInput={(params) => (
                        <TextField {...params} margin="dense" variant="outlined" label="Price Template" placeholder="Price Template" />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            {isUploading ? (
              <Box p={2} height={500}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            ) : templateImportHeader?.length > 0 && customImportHeader?.length ? (
              <TableContainer style={{ marginTop: '16px' }} component={Paper}>
                <Table aria-label="customized table">
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ width: '50%' }}>
                        <div>
                          <span>System Columns</span>
                          <span style={{ marginLeft: '10px' }}>
                            <HtmlTooltip enterTouchDelay={0} title={'Add System Column'}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  setAddSystemColumn(true);
                                }}
                              >
                                <ControlPointIcon fontSize="small" color="primary" />
                              </IconButton>
                            </HtmlTooltip>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell style={{ width: '50%' }}>Imported Excel Columns</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templateImportHeader?.map((_key) => (
                      <TableRow key={_key?.value}>
                        <TableCell component="th" scope="row">
                          {' '}
                          {_key?.label}{' '}
                        </TableCell>
                        <TableCell align="right">
                          <Autocomplete
                            size="small"
                            id={_key?.value}
                            options={customImportHeader}
                            getOptionLabel={(option) => option?.label || ''}
                            value={customImportHeader.find((_value) => {
                              if (_value?.value === _key?.value) {
                                return true;
                              }
                              return null;
                            })}
                            onChange={(event, newValue) => {
                              setKeyValue([...keyValue, { templateImportHeader: _key?.value, customImportHeader: newValue?.value }]);
                            }}
                            style={{ maxWidth: '500px' }}
                            renderInput={(params) => <TextField {...params} label="" variant="outlined" />}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : null}
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button color="primary" size="small" onClick={handleClose}>
              Cancel
            </Button>
            <CustomButton
              onClick={handleCustomImport}
              variant="contained"
              color="primary"
              disabled={loading || !values?.productCategory || !values?.productTemplate || !values?.priceTemplate}
              loading={loading}
            >
              Save
            </CustomButton>
          </CustomDialogFooter>
          {addSystemColumn && (
            <AddField
              refrence="formAddInlineEdit"
              fieldData={null}
              handleClose={() => {
                setAddSystemColumn(false);
              }}
              handleAddField={(_data) => {
                _data.leval = 'price-builder-custom';
                if (fields?.filter((_f) => _f.sectionName === _data?.sectionName).length) {
                  if (fields?.filter((_f) => _f.sectionName === _data?.sectionName)[0].leval !== 'price-template') {
                    _data.leval = 'product-builder-custom';
                  }
                }
                setAddedField([...addedField, { ..._data }]);
                setTemplateImportHeaader([
                  ...templateImportHeader,
                  { value: _data?.fieldLabel?.toUpperCase(), label: _data?.fieldLabel?.toUpperCase() }
                ]);
                setAddSystemColumn(false);
              }}
              fields={fields}
              section={uniqBy(fields, 'sectionName')?.map((_section: any) => _section?.sectionName)}
            />
          )}
        </>
      </Dialog>
    </>
  );
};
