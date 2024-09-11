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
  IconButton,
  useMediaQuery,
  Menu,
  MenuItem,
  Typography
} from '@material-ui/core';
import { ACTIVITY_RESOURCE, CustomDialogTransition, downloadExcel } from 'src/constants/helpers';
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
import { read, utils, write, writeFile } from 'xlsx';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { AddField } from 'src/components/FormBuilder/AddField';
import { AddColumnDialog } from 'src/components/productBuilder/CustomImport/AddColumnDialog';
import { Add, Delete } from '@material-ui/icons';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';
import RowNumberDialog from 'src/components/productBuilder/CustomImport/RowNumberDialog';
import ImportedDataDialog from 'src/components/productBuilder/CustomImport/ImpoetedDataDialog';
import ViewDialog from 'src/components/productBuilder/CustomImport/ViewDialog';

export const CustomImport = ({ handleClose, onSuccess, refrenceId, currency = 'USD' }) => {
  const walkmeInstance = useGetWalkmeInstance();
  const toastConfig = useContext(CustomToastContext);
  const isMobile = useMediaQuery('(max-width:600px)');
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({ productCategory: '', productTemplate: '', priceTemplate: '' });
  const [productCategory, setProductCategory] = useState([]);
  const [productTemplate, setProductTemplate] = useState([]);
  const [priceTemplate, setPriceTemplate] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [templateImportHeader, setTemplateImportHeader] = useState([]);
  const [customImportHeader, setCustomImportHeaader] = useState([]);
  const [keyValue, setKeyValue] = useState([]);
  const [files, setFiles] = useState();
  const [file, setFile] = useState();
  const [addSystemColumn, setAddSystemColumn] = useState(false);
  const [addImportedColumn, setAddImportedColumn] = useState(false);
  const [addedField, setAddedField] = useState([]);
  const [fieldLabelOptions, setFieldLabelOptions] = useState([]);
  const [addAnchorEl, setAddAnchorEl] = useState(null);
  const [openRowNumberDialog, setOpenRowNumberDialog] = useState(false);
  const [showImportedData, setShowImportedData] = useState({ open: false, data: null });
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [excelMappingExtraData, setExcelMappingExtraData] = useState(null);
  const [selectedView, setSelectedView] = useState(null);

  const charToNum = (char) => {
    let num = 0;
    for (let i = 0; i < char?.length; i++) {
      num = num * 26 + (char?.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return num;
  };

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
    if (selectedView) {
      _keyValue = selectedView && selectedView?.column ? selectedView?.column : [];
    } else {
      customImportHeader?.forEach((_value) => {
        if (templateImportHeader?.find((templateImportHeader) => templateImportHeader?.value === _value?.value) ? true : false) {
          _keyValue = [..._keyValue, { systemColumn: _value?.value, importedColumn: _value?.value }];
        }
      });
    }

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

  const getDataHeaderRowWise = (headerRow = 1, header: any, fromCol = 0, toCol = 0, fromRow = 0, newHeaders: any, jsonData: any) => {
    if (headerRow === 1) {
      header?.forEach((h, i) => {
        if (i >= fromCol && i <= toCol) {
          newHeaders.push({
            header: h,
            column: i
          });
        }
      });
    } else if (headerRow === 2) {
      const headers2: any = jsonData[fromRow + 1];
      let j;
      header.forEach((h, i) => {
        if (i >= fromCol && i <= toCol) {
          let name = headers2[i] ? h + ' ' + headers2[i] : h;
          let index = i;

          const diff = i - j;
          if (diff != 1) {
            for (let k = j + 1; k < i; k++) {
              if (headers2[k]) {
                newHeaders.push({
                  header: header[j] + ' ' + headers2[k],
                  column: k
                });
              }
            }
          }
          j = index;

          newHeaders.push({
            header: name,
            column: index
          });
        }
      });
    }
  }

  const handleImport = (e) => {
    let files = e.target.files[0];
    setFiles(files);
    setOpenRowNumberDialog(true);
  };

  const handleFileImport = (values) => {
    setOpenRowNumberDialog(false);
    if (values?.length > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        let readedData = read(data, { type: 'array' });
        const newData: any = [];

        values?.forEach((value: any) => {
          const ws = readedData.Sheets[value?.sheetName || readedData.SheetNames[0]];
          const jsonData = utils.sheet_to_json(ws, { header: 1 });

          const newHeaders: any = [];

          const headerRow = +value?.headerRow;
          if (value?.startRowCell && value?.endRowCell) {
            const startRowCell = value?.startRowCell?.match(/^(\D+)(\d+)$/);
            const endRowCell = value?.endRowCell?.match(/^(\D+)(\d+)$/);
            const fromCol = charToNum(startRowCell[1]) - 1;
            const fromRow = +startRowCell[2] - 1;
            const toCol = charToNum(endRowCell[1]) - 1;
            const toRow = +endRowCell[2] - 1;

            const header: any = jsonData[fromRow];

            getDataHeaderRowWise(headerRow, header, fromCol, toCol, fromRow, newHeaders, jsonData)
            newData.push({
              header: newHeaders,
              data: jsonData,
              fromRow: headerRow === 1 ? fromRow + 1 : fromRow + 2,
              toRow: toRow
            });
          } else {
            const header: any = jsonData[0];
            getDataHeaderRowWise(headerRow, header, 0, (header?.length - 1), 0, newHeaders, jsonData)
            newData.push({
              header: newHeaders,
              data: jsonData,
              fromRow: headerRow === 1 ? 1 : 2,
              toRow: (jsonData?.filter(d => !isEmpty(d))?.length - 1)
            });
          }
        });

        const newJsonData: any = [];

        const noOfRow = Math.max(...newData?.map((obj) => obj.toRow - obj.fromRow));
        for (let i = 0; i <= noOfRow; i++) {
          const obj: any = {};
          newData?.forEach((_data) => {
            _data?.header.forEach((_header) => {
              obj[_header.header.toUpperCase()] = _data?.data[_data?.fromRow][_header?.column] || '';
            });
            _data.fromRow = _data.fromRow + 1;
          });
          newJsonData.push(obj);
        }

        const worksheet = utils.json_to_sheet(newJsonData);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: fileType });

        handleFileImport1(blob);
      }
      reader.readAsArrayBuffer(files);
    } else {
      handleFileImport1(files);
    }
  };

  const handleFileImport1 = (file) => {
    setCustomImportHeaader([]);
    setIsUploading(true);
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      let readedData = read(data, { type: 'array' });
      const wsname = readedData.SheetNames[0];
      const ws = readedData.Sheets[wsname];
      const jsonData = utils.sheet_to_json(ws, { header: 1 });

      let headers: any = jsonData[0];
      setFieldLabelOptions(
        headers?.map((e, i) => {
          let type = 'singleLine';
          let decimalPlaces = 2;
          if (jsonData && jsonData[1] && jsonData[1][i]) {
            if (typeof jsonData[1][i] === 'number') {
              type = 'decimal';
              const numStr = jsonData[1][i]?.toString();
              if (numStr.includes('.')) {
                decimalPlaces = numStr.split('.')[1].length;
              }
            }
          }
          return {
            fieldLabel: e,
            type: type,
            ...(type === 'decimal' ? { decimalPlaces: decimalPlaces } : {})
          };
        })
      );
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
    reader.readAsArrayBuffer(file);
  };

  const generateTemplateHeader = (fields) => {
    setTemplateImportHeader([]);
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

    setTemplateImportHeader(_templateHeader);
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
          const _header = keyValue?.find((k) => k?.importedColumn === header);
          if (_header) {
            return _header?.systemColumn;
          }
          return header;
        });

        jsonData[0] = newHeaders;

        const indexes = [];
        // const updatedData = jsonData?.filter((row) => !isEmpty(row));
        const updatedData = jsonData
          ?.filter((row) => !isEmpty(row))
          ?.map((_r: any, i) => {
            const _row: any = [];
            if (i === 0) {
              _r?.forEach((ele, j) => {
                if (templateImportHeader?.some((t) => t?.value === ele)) {
                  _row.push(ele);
                } else {
                  indexes.push(j);
                }
              });
            } else {
              _r?.forEach((ele, j) => {
                if (!indexes?.includes(j)) {
                  _row.push(ele);
                }
              });
            }
            return _row;
          });

        if (updatedData[0]?.some((u) => u === 'PRODUCT DESCRIPTION')) {
          rowDataToFile(updatedData);
        } else {
          updatedData?.forEach((row, i) => {
            if (i === 0) {
              row.unshift('PRODUCT DESCRIPTION');
            } else {
              row.unshift('');
            }
          });
          setShowImportedData({ open: true, data: updatedData });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const rowDataToFile = (rowData) => {
    const newWorksheet = utils.json_to_sheet(rowData, { skipHeader: true });

    const newWorkbook = utils.book_new();
    utils.book_append_sheet(newWorkbook, newWorksheet, 'sheet1');

    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const excelBuffer = write(newWorkbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: fileType });
    setShowImportedData({ open: false, data: null });

    handleSave(blob);
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
    formData.append('customImport', "1");
    if (addedField?.length > 0) {
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

  const handleDeleteCustomColumns = (obj) => {
    setAddedField([...addedField?.filter((f) => f?.fieldLabel?.toUpperCase() != obj?.label)]);
    setTemplateImportHeader([...templateImportHeader?.filter((t) => t?.value != obj?.value)]);
  };


  return (
    <>
      <Dialog open={true} onClose={handleClose} TransitionComponent={CustomDialogTransition} fullScreen={true} fullWidth maxWidth="md">
        <>
          <CustomDialogHeader title="Custom File Import" onClose={handleClose} />
          <CustomDialogContent>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Autocomplete
                  id="product-category"
                  style={{ minWidth: '250px', flexGrow: 1 }}
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
                <Autocomplete
                  id="product-template"
                  style={{ minWidth: '250px', flexGrow: 1 }}
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
                <Autocomplete
                  id="price-template"
                  style={{ minWidth: '250px', flexGrow: 1 }}
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
                <input
                  id={`customImportFile`}
                  name={`customImportFile`}
                  onChange={handleImport}
                  style={{ display: 'none' }}
                  onClick={(e: any) => (e.target.value = null)}
                  type="file"
                  accept=".xlsx,.csv"
                  disabled={_.some(_.values(values), (v) => v === '')}
                />
                <label htmlFor={`customImportFile`}>
                  <HtmlTooltip title={'Import File'}>
                    <span>
                      <Button
                        variant={isMobile ? 'text' : 'outlined'}
                        color="primary"
                        size="small"
                        className={`${isMobile ? 'btn-outline-v1  with-border max-[600px]:[max-width:36px_!important]' : ''}`}
                        component="span"
                        disabled={_.some(_.values(values), (v) => v === '')}
                        startIcon={isMobile ? null : <AiOutlineImport />}
                      >
                        {isMobile ? <AiOutlineImport /> : 'Import File'}
                      </Button>
                    </span>
                  </HtmlTooltip>
                </label>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <>
                  <HtmlTooltip title={'Add Column'}>
                    <span>
                      <Button
                        id={'custom-import-dialog-add-menu-button'}
                        variant={isMobile ? 'text' : 'outlined'}
                        color="primary"
                        size="small"
                        disabled={isUploading || templateImportHeader?.length === 0 || customImportHeader?.length === 0}
                        className={`${isMobile ? 'btn-outline-v1  with-border max-[600px]:[max-width:36px_!important]' : ''}`}
                        startIcon={isMobile ? null : <Add />}
                        onClick={(e) => {
                          setAddAnchorEl(e.currentTarget);
                        }}
                        aria-controls="add-menu"
                      >
                        {isMobile ? <Add /> : 'Add Column'}
                      </Button>
                    </span>
                  </HtmlTooltip>
                  <Menu
                    anchorEl={addAnchorEl}
                    keepMounted
                    getContentAnchorEl={null}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'left'
                    }}
                    id="add-menu"
                    open={Boolean(addAnchorEl)}
                    onClose={() => setAddAnchorEl(null)}
                    TransitionProps={{ unmountOnExit: true, timeout: walkmeInstance ? 0 : 200 }}
                  >
                    <MenuItem
                      button
                      onClick={(e) => {
                        setAddAnchorEl(null);
                        setAddSystemColumn(true);
                      }}
                    >
                      Add System Column
                    </MenuItem>
                    <MenuItem
                      button
                      onClick={(e) => {
                        setAddAnchorEl(null);
                        setAddImportedColumn(true);
                      }}
                    >
                      Add From Imported Excel Column
                    </MenuItem>
                  </Menu>
                </>
                <Button
                  id={'custom-import-dialog-add-view-menu-button'}
                  variant={'outlined'}
                  color="primary"
                  size="small"
                  disabled={isUploading || templateImportHeader?.length === 0 || customImportHeader?.length === 0}
                  onClick={(e) => {
                    setShowViewDialog(true);
                  }}
                  aria-controls="add-view-menu"
                >
                  Save Excel Mapping
                </Button>
              </div>
            </div>
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
                        </div>
                      </TableCell>
                      <TableCell style={{ width: '50%' }}>Imported Excel Columns</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templateImportHeader?.map((_key) => {
                      const selectedCustomInputHeader = keyValue.find((kv) => kv.systemColumn === _key?.value)?.importedColumn;
                      const field = fields?.find((f) => f?.fieldName === 'productName');
                      return (
                        <TableRow key={_key?.value}>
                          <TableCell component="th" scope="row">
                            {' '}
                            {_key?.label}
                            {/* {_key?.value === field?.fieldLabel?.toUpperCase() && <span style={{ color: '#dc3545' }}>*</span>} */}
                            {addedField?.map((f) => f?.fieldLabel?.toUpperCase())?.includes(_key?.label) && (
                              <IconButton
                                size="small"
                                onClick={() => {
                                  handleDeleteCustomColumns(_key);
                                }}
                              >
                                <Delete fontSize="small" color="error" />
                              </IconButton>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Autocomplete
                              size="small"
                              id={_key?.value}
                              options={customImportHeader?.filter(
                                (ele) => !keyValue.some((e) => e.importedColumn === ele.value) || ele?.value === selectedCustomInputHeader
                              )}
                              getOptionLabel={(option) => option?.label || ''}
                              value={
                                customImportHeader?.filter((h) => h?.value === selectedCustomInputHeader)?.length > 0
                                  ? customImportHeader?.filter((h) => h?.value === selectedCustomInputHeader)[0]
                                  : ''
                              }
                              onChange={(event, newValue) => {
                                let tempKeyValues = keyValue?.filter((e) => e.systemColumn !== _key?.value);
                                if (newValue) {
                                  tempKeyValues = [...tempKeyValues, { systemColumn: _key?.value, importedColumn: newValue?.value }]
                                }
                                setKeyValue(tempKeyValues);
                              }}
                              style={{ maxWidth: '500px' }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label=""
                                  variant="outlined"
                                // error={
                                //   _key?.value === field?.fieldLabel?.toUpperCase() &&
                                //   !keyValue?.some((k) => k?.templateImportHeader === field?.fieldLabel?.toUpperCase() && k?.customImportHeader)
                                // }
                                // helperText={
                                //   _key?.value === field?.fieldLabel?.toUpperCase() &&
                                //   !keyValue?.some((k) => k?.templateImportHeader === field?.fieldLabel?.toUpperCase() && k?.customImportHeader) &&
                                //   'Required field'
                                // }
                                />
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
              disabled={loading || !values?.productCategory
                || !values?.productTemplate || !values?.priceTemplate
                || templateImportHeader?.length === 0 || customImportHeader?.length === 0}
              loading={loading}
            >
              Submit
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
                setTemplateImportHeader([
                  ...templateImportHeader,
                  { value: _data?.fieldLabel?.toUpperCase(), label: _data?.fieldLabel?.toUpperCase() }
                ]);
                setAddSystemColumn(false);
              }}
              fields={fields}
              section={uniqBy(fields, 'sectionName')?.map((_section: any) => _section?.sectionName)}
            />
          )}
          {addImportedColumn && (
            <AddColumnDialog
              fieldLabelOptions={fieldLabelOptions?.filter((e) => !keyValue?.map((e) => e?.importedColumn)?.includes(e?.fieldLabel))}
              handleClose={() => {
                setAddImportedColumn(false);
              }}
              handleAddField={(_data) => {
                _data.leval = 'price-builder-custom';
                if (fields?.filter((_f) => _f.sectionName === _data?.sectionName).length) {
                  if (fields?.filter((_f) => _f.sectionName === _data?.sectionName)[0].leval !== 'price-template') {
                    _data.leval = 'product-builder-custom';
                  }
                }
                setAddedField([...addedField, { ..._data }]);
                setTemplateImportHeader([
                  ...templateImportHeader,
                  { value: _data?.fieldLabel?.toUpperCase(), label: _data?.fieldLabel?.toUpperCase() }
                ]);
                setKeyValue([
                  ...keyValue,
                  { importedColumn: _data?.fieldLabel, systemColumn: _data?.fieldLabel }
                ]);
                setAddImportedColumn(false);
              }}
              fields={fields}
              section={uniqBy(fields, 'sectionName')?.map((_section: any) => _section?.sectionName)}
            />
          )}
          {openRowNumberDialog && files && (
            <RowNumberDialog
              handleClose={() => {
                setOpenRowNumberDialog(false);
              }}
              onSuccess={(data, excelMappingView) => {
                handleFileImport(data);
                setExcelMappingExtraData(data);
                setSelectedView(excelMappingView);
              }}
              file={files}
              resource={ACTIVITY_RESOURCE.quote}
            />
          )}
          {showImportedData.open && (
            <ImportedDataDialog
              handleClose={() => {
                setShowImportedData({ open: false, data: null });
              }}
              data={showImportedData.data}
              productCategory={values?.productCategory}
              productTemplate={values?.productTemplate}
              onSuccess={(data) => {
                rowDataToFile(data);
              }}
            />
          )}
          {showViewDialog && (
            <ViewDialog
              onClose={() => {
                setShowViewDialog(false);
              }}
              resource={ACTIVITY_RESOURCE.quote}
              extraData={{ column: keyValue, sheet: excelMappingExtraData }}
              selectedView={selectedView}
              onSuccess={(view) => {
                setSelectedView(view);
                setShowViewDialog(false);
              }}
            />
          )}
        </>
      </Dialog>
    </>
  );
};
