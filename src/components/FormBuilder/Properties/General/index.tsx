import { Box, Button, Checkbox, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import Autocomplete from '@mui/material/Autocomplete';
import { Fragment, useEffect, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { fieldLabelToFieldName } from '../../../../constants/helpers';
import { Converter } from '../../AddField/converter';
import { Currency } from '../../AddField/currency';
import { DecimalPlaces } from '../../AddField/decimalPlaces';
import Description from '../../AddField/description';
import { Formula } from '../../AddField/formula';
import { MinMax } from '../../AddField/minMax';
import { MultipleFormula } from '../../AddField/multipleformula';
import { Option } from '../../AddField/option';
import PreFilter from '../../AddField/preFilter';
import { Vlookup } from '../../AddField/vlookup';
import { getLookupOption, getLookupResource } from '../../helper';
import FieldDependent from '../FieldDependent';
import LookUpDisplay from '../LookUpDisplay';
import FieldNameDialog from './FieldNameDialog';
import SubFieldsDialog from './SubFieldsDialog';

const General = ({ values, setFieldValue, fields, fieldData, touched, errors, module, isCalculativeField, handleChangeFieldName }) => {
  const [isInitialUpdated, setIsInitialUpdated] = useState({
    MultipleFormula: false,
    Currency: false,
    Converter: false
  });
  const [lookupResource, setLookupResource] = useState([]);
  const [changeFieldNameDialog, setChangeFieldNameDialog] = useState(false);
  const [dataList, setDataList] = useState([]);
  const [subFieldOpen, setSubFieldOpen] = useState(false);
  const [htmlDescription, setHtmlDescription] = useState(values['htmlDescription'] || '');

  useEffect(() => {
    getLookupList();
    getDataList();
  }, []);

  const getLookupList = async () => {
    const lookupResource = await getLookupResource();
    setLookupResource(lookupResource);
  };

  const getDataList = async () => {
    const dataList = await getLookupOption(null, 'Data List');
    setDataList(dataList);
  };

  const handleClick = () => {
    setChangeFieldNameDialog(true);
  };

  return (
    <Box>
      <Grid container spacing={1}>
        <Grid item xs={10} md={10} sm={10}>
          <TextField
            variant="outlined"
            type="text"
            label="Field Label"
            required={true}
            name="fieldLabel"
            fullWidth
            margin="dense"
            size="small"
            disabled={!values['editAble']}
            value={values['fieldLabel']}
            error={touched['fieldLabel'] && Boolean(errors['fieldLabel'])}
            helperText={touched['fieldLabel'] && errors['fieldLabel']}
            onChange={(e) => {
              setFieldValue('fieldLabel', e.target.value.trimStart());
            }}
          />
        </Grid>
        <Grid item xs={2} md={2} sm={2} container justify="flex-end">
          <HtmlTooltip title="Change Field Name">
            <IconButton aria-label="setting" onClick={handleClick} size="small">
              <SettingsIcon color="primary" fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        </Grid>
      </Grid>
      {changeFieldNameDialog && (
        <FieldNameDialog
          fieldData={fieldData}
          handleSave={(data) => {
            setChangeFieldNameDialog(false);
            handleChangeFieldName(data);
          }}
          handleClose={() => {
            setChangeFieldNameDialog(false);
          }}
        />
      )}
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="required"
                  checked={values['required']}
                  onChange={(e) => {
                    setFieldValue('required', e.target.checked);
                  }}
                  color="primary"
                />
              }
              label="Required"
            />
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      {(module === 'product-template' || module === 'price-template') && (
        <Box mb={1}>
          <TextField
            variant="outlined"
            type="text"
            label="Field Name"
            name="fieldName"
            fullWidth
            margin="dense"
            size="small"
            disabled={true}
            value={values['fieldName'] ? values['fieldName'] : fieldLabelToFieldName(values['fieldLabel'])}
          />
        </Box>
      )}
      {values['type'] === 'currencyAmount' && (
        <Currency
          values={values}
          setFieldValue={(name, value) => {
            if (!isInitialUpdated['Currency']) {
              setIsInitialUpdated((prevState) => ({ ...prevState, Currency: true }));
            }
            setFieldValue(name, value);
          }}
          refrence="form-builder"
          touched={touched}
          errors={errors}
        />
      )}
      {(values['type'] === 'decimal' ||
        values['type'] === 'formula' ||
        values['type'] === 'converter' ||
        values['type'] === 'percent' ||
        values['type'] === 'currencyAmount') && (
        <Grid spacing={3} container>
          {values['type'] === 'formula' && (
            <Grid item xs={12} sm={6} md={6}>
              <FormControl fullWidth margin="dense" size="small" variant="outlined">
                <InputLabel id="demo-simple-select-outlined-label">Return Type</InputLabel>
                <Select
                  labelId="demo-simple-select-outlined-label"
                  id="demo-simple-select-outlined"
                  value={values['returnType']}
                  onChange={(e) => {
                    setFieldValue('returnType', e.target.value);
                  }}
                  label="Return Type"
                  name="returnType"
                  size="small"
                >
                  <MenuItem value="decimal">Decimal</MenuItem>
                  <MenuItem value="string">String</MenuItem>
                  <MenuItem value="boolean">Boolean</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
          {(values['type'] === 'decimal' ||
            values['type'] === 'converter' ||
            values['type'] === 'percent' ||
            values['type'] === 'currencyAmount' ||
            values['returnType'] === 'decimal') && (
            <Grid item xs={12} sm={6} md={6}>
              <DecimalPlaces
                values={values}
                setFieldValue={(name, value) => {
                  setFieldValue(name, value);
                }}
              />
            </Grid>
          )}
        </Grid>
      )}
      {(values['type'] === 'dropDown' || values['type'] === 'multiSelect') && !values['dataList'] && (
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                name="lookup"
                checked={values['lookup']}
                onChange={(e) => {
                  const val = e.target.checked;
                  setFieldValue('lookup', val);
                  if (val) {
                    setFieldValue('addAdditionalOption', false);
                    setFieldValue('addManualOptionInExcel', false);
                    setFieldValue('addBulkOptions', false);
                  }
                }}
                color="primary"
              />
            }
            label="Lookup"
          />
          {values['lookup'] && (
            <Box pt={1} pb={1}>
              <Autocomplete
                id="lookupResource"
                options={lookupResource}
                getOptionLabel={(option: any) => (option ? option?.optionLabel || '' : '')}
                isOptionEqualToValue={(option: any, val) => option.optionValue === val}
                value={
                  lookupResource && lookupResource?.filter((data) => data.optionValue === values['lookupResource'])?.length
                    ? lookupResource && lookupResource?.filter((data) => data.optionValue === values['lookupResource'])[0]
                    : ''
                }
                onChange={(e: any, value) => {
                  setFieldValue('lookupResource', value && value?.optionValue ? value.optionValue : '');
                  setFieldValue('preFilters', []);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    size="small"
                    variant="outlined"
                    label="Lookup Resource"
                    placeholder="Lookup Resource"
                    name="lookupResource"
                    required
                    error={touched['lookupResource'] && Boolean(errors['lookupResource'])}
                    helperText={touched['lookupResource'] && errors['lookupResource']}
                  />
                )}
              />
              <FieldDependent
                fields={fields}
                values={values}
                fieldSet={(name, value) => {
                  setFieldValue(name, value);
                }}
              />
              {values['lookupResource'] && <PreFilter lookupResource={values['lookupResource']} values={values} setFieldValue={setFieldValue} />}
            </Box>
          )}
        </Box>
      )}
      {(values['type'] === 'dropDown' || values['type'] === 'multiSelect') && !values['lookup'] && (
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                name="dataList"
                checked={values['dataList']}
                onChange={(e) => {
                  const val = e.target.checked;
                  setFieldValue('dataList', val);
                  if (val) {
                    setFieldValue('addAdditionalOption', false);
                    setFieldValue('addManualOptionInExcel', false);
                    setFieldValue('addBulkOptions', false);
                  }
                }}
                color="primary"
              />
            }
            label="Data List"
          />
          {values['dataList'] && (
            <Box pt={1} pb={1}>
              <Autocomplete
                id="dataListId"
                options={dataList}
                getOptionLabel={(option: any) => (option ? option?.optionLabel || '' : '')}
                isOptionEqualToValue={(option: any, val) => option?.optionValue === val}
                value={
                  dataList && dataList?.filter((data) => data.optionValue === values['dataListId'])?.length
                    ? dataList && dataList?.filter((data) => data.optionValue === values['dataListId'])[0]
                    : ''
                }
                onChange={(e: any, value) => {
                  setFieldValue('dataListId', value && value?.optionValue ? value.optionValue : '');
                  setFieldValue('preFilters', []);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    size="small"
                    variant="outlined"
                    label="Data List"
                    placeholder="Data List"
                    name="dataListId"
                    required
                    error={touched['dataListId'] && Boolean(errors['dataListId'])}
                    helperText={touched['dataListId'] && errors['dataListId']}
                  />
                )}
              />

              {values['dataListId'] && <PreFilter dataList={true} dataListId={values['dataListId']} values={values} setFieldValue={setFieldValue} />}
            </Box>
          )}
        </Box>
      )}
      {(values['type'] === 'dropDown' || values['type'] === 'multiSelect' || values['type'] === 'radio' || values['type'] === 'process') &&
        !values['lookup'] &&
        !values['dataList'] && (
          <Option
            values={values}
            setFieldValue={(name, value) => {
              if (!isInitialUpdated['dropDown']) {
                setIsInitialUpdated((prevState) => ({ ...prevState, dropDown: true }));
              }
              setFieldValue(name, value);
            }}
            fields={fields}
            _id={fieldData._id}
          />
        )}
      {(values['type'] === 'currencyAmount' ||
        values['type'] === 'decimal' ||
        values['type'] === 'percent' ||
        values['type'] === 'date' ||
        values['type'] === 'converter') &&
        isCalculativeField && (
          <>
            <br></br>
            <FormControlLabel
              control={
                <Checkbox
                  name="isFormula"
                  checked={values['isFormula']}
                  onChange={(e) => {
                    setFieldValue('isFormula', e.target.checked);
                    setFieldValue('inputFields', []);
                    setFieldValue('formula', '');
                  }}
                  color="primary"
                />
              }
              label="Formula"
            />
          </>
        )}
      {(values['type'] === 'formula' || values['isFormula']) && (
        <Formula
          fields={fields}
          values={values}
          setFieldValue={(name, value) => {
            setFieldValue(name, value);
          }}
          _id={fieldData._id}
          touched={touched}
          errors={errors}
        />
      )}
      {(values['type'] === 'currencyAmount' || values['type'] === 'decimal') && (
        <Fragment>
          <br></br>
          <FormControlLabel
            control={
              <Checkbox
                name="isConverter"
                checked={values['isConverter']}
                onChange={(e) => {
                  setFieldValue('isConverter', e.target.checked);
                  setFieldValue('units', []);
                  setFieldValue('displayUnits', []);
                  setFieldValue('formulaUnits', []);
                }}
                color="primary"
              />
            }
            label="Converter"
          />
        </Fragment>
      )}
      {(values['type'] === 'converter' || values['isConverter']) && (
        <Converter
          fields={fields}
          values={values}
          setFieldValue={(name, value) => {
            if (!isInitialUpdated['Converter']) {
              setIsInitialUpdated((prevState) => ({ ...prevState, Converter: true }));
            }
            setFieldValue(name, value);
          }}
          touched={touched}
          errors={errors}
        />
      )}
      {(values['type'] === 'currencyAmount' || values['type'] === 'decimal' || values['type'] === 'percent' || values['type'] === 'converter') &&
        isCalculativeField && (
          <>
            <br></br>
            <FormControlLabel
              control={
                <Checkbox
                  name="isMulitFormula"
                  checked={values['isMulitFormula']}
                  onChange={(e) => {
                    setFieldValue('isMulitFormula', e.target.checked);
                    setFieldValue('formulaFields', []);
                    setFieldValue('formulainputFields', []);
                    setFieldValue('formulaoption', {});
                  }}
                  color="primary"
                />
              }
              label="Multiple Formula"
            />
          </>
        )}
      {values['isMulitFormula'] && (
        <MultipleFormula
          fields={fields}
          values={values}
          setFieldValue={(name, value) => {
            if (!isInitialUpdated['MultipleFormula']) {
              setIsInitialUpdated((prevState) => ({ ...prevState, MultipleFormula: true }));
            }
            setFieldValue(name, value);
          }}
          _id={fieldData._id}
          touched={touched}
          errors={errors}
        />
      )}

      {(values['type'] === 'currencyAmount' || values['type'] === 'decimal' || values['type'] === 'percent' || values['type'] === 'converter') &&
        isCalculativeField && (
          <>
            <br></br>
            <FormControlLabel
              control={
                <Checkbox
                  name="isVlookup"
                  checked={values['isVlookup']}
                  onChange={(e) => {
                    setFieldValue('isVlookup', e.target.checked);
                    setFieldValue('isDropdown', false);
                  }}
                  color="primary"
                />
              }
              label="Vlookup"
            />
          </>
        )}
      {(values['isVlookup'] || values['type'] === 'vlookupDropdown') && (
        <Vlookup
          fields={fields}
          values={values}
          setFieldValue={(name, value) => {
            setFieldValue(name, value);
          }}
          touched={touched}
          errors={errors}
          _id={fieldData._id}
        />
      )}

      {(values['type'] === 'converter' || values['type'] === 'formula') && isCalculativeField && (
        <>
          <br></br>
          <FormControlLabel
            control={
              <Checkbox
                name="isDropdown"
                checked={values['isDropdown']}
                onChange={(e) => {
                  setFieldValue('isDropdown', e.target.checked);
                  setFieldValue('isVlookup', false);
                }}
                color="primary"
              />
            }
            label="Dropdown"
          />
        </>
      )}
      {values['isDropdown'] && (
        <Option
          values={values}
          setFieldValue={(name, value) => {
            setFieldValue(name, value);
          }}
          fields={fields}
          _id={fieldData._id}
        />
      )}
      {fieldData.type === 'lookUpDisplay' && (
        <Box pt={1} pb={1}>
          <LookUpDisplay
            fields={fields}
            values={values}
            fieldSet={(name, value) => {
              setFieldValue(name, value);
            }}
          />
        </Box>
      )}
      {['groupSignature'].includes(fieldData.type) && <PreFilter lookupResource={'User'} values={values} setFieldValue={setFieldValue} />}
      {fieldData.type === 'decimal' && <MinMax values={values} setFieldValue={setFieldValue} errors={errors} touched={touched} />}
      {fieldData.type === 'description' && <Description values={htmlDescription} setFieldValue={setFieldValue} />}
      {fieldData.type === 'counter' && (
        <Box mt={1}>
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={() => {
              setSubFieldOpen(true);
            }}
          >
            Counter Sub Fields
          </Button>
        </Box>
      )}
      {subFieldOpen && (
        <SubFieldsDialog
          handleClose={() => {
            setSubFieldOpen(false);
          }}
          fields={values?.subFields || []}
          setFieldValue={setFieldValue}
        />
      )}
    </Box>
  );
};

export default General;
