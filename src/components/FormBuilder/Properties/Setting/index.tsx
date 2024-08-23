import { Box, Checkbox, FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField, Typography } from '@material-ui/core';
import FormTypes from 'src/components/Helpers/FormTypes';
import { ResourceDropdown } from '../resourceDropdown';
import { Autocomplete } from '@material-ui/lab';
import { Entity } from '../../AddField/entity';

const Setting = ({ initialValues, values, setFieldValue, fields, fieldData, section, touched, errors, module, brandId }) => {
  return (
    <Box pb={1}>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="isDefaultValue"
                  disabled={values['type'] === 'freeStyleMultiSelect'}
                  checked={values['isDefaultValue']}
                  onChange={(e) => {
                    setFieldValue('isDefaultValue', e.target.checked);
                  }}
                  color="primary"
                />
              }
              label="Default Value"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            {values['isDefaultValue'] ? (
              fieldData.type === 'imageUpload' ? (
                <FormTypes
                  values={{ defaultValue: values['defaultValue'] }}
                  errors={errors}
                  touched={touched}
                  label={''}
                  name={'defaultValue'}
                  type={fieldData.type}
                  setFieldValue={(name, value) => {
                    setFieldValue(name, value);
                  }}
                  isTooltip={false}
                />
              ) : fieldData.type === 'colorPicker' ? (
                <Box>
                  <Box>
                    <input
                      value={values['defaultValue']}
                      type="color"
                      onChange={(e) => {
                        setFieldValue('defaultValue', e.target.value);
                      }}
                    />
                    <Box component="span" ml={2}>
                      {values['defaultValue']}
                    </Box>
                  </Box>
                  {touched['defaultValue'] && Boolean(errors['defaultValue']) && (
                    <Typography color="error" style={{ fontSize: '11px' }}>
                      {errors['defaultValue']}
                    </Typography>
                  )}
                </Box>
              ) : (fieldData.type === 'dropDown' || fieldData.type === 'multiSelect') && values['lookup'] ? (
                <ResourceDropdown
                  type={fieldData.type}
                  lookupResource={values['lookupResource']}
                  value={values['defaultValue']}
                  setFieldValue={setFieldValue}
                  brandId={brandId}
                  touched={touched}
                  errors={errors}
                />
              ) : (
                <Box display="block">
                  <TextField
                    variant="outlined"
                    type="text"
                    label="Default Value"
                    name="defaultValue"
                    rows={4}
                    fullWidth
                    margin="dense"
                    value={values['defaultValue']}
                    error={touched['defaultValue'] && Boolean(errors['defaultValue'])}
                    helperText={touched['defaultValue'] && errors['defaultValue']}
                    onChange={(e) => {
                      setFieldValue('defaultValue', e.target.value.trimStart());
                    }}
                  />
                </Box>
              )
            ) : null}
          </Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="isTooltip"
                  checked={values['isTooltip']}
                  onChange={(e) => {
                    setFieldValue('isTooltip', e.target.checked);
                  }}
                  color="primary"
                />
              }
              label="Show Tooltip"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            {values['isTooltip'] && (
              <TextField
                variant="outlined"
                type="text"
                label="Tooltip Message"
                required={true}
                name="tooltipMessage"
                fullWidth
                margin="dense"
                value={values['tooltipMessage']}
                error={touched['isTooltip'] && Boolean(errors['tooltipMessage'])}
                helperText={touched['isTooltip'] && errors['tooltipMessage']}
                onChange={(e) => {
                  setFieldValue('tooltipMessage', e.target.value.trimStart());
                }}
              />
            )}
          </Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="isWarningTooltip"
                  checked={values['isWarningTooltip']}
                  onChange={(e) => {
                    setFieldValue('isWarningTooltip', e.target.checked);
                  }}
                  color="primary"
                />
              }
              label="Show Warning Message"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            {values['isWarningTooltip'] && (
              <TextField
                variant="outlined"
                type="text"
                label="Warning Tooltip Message"
                required={true}
                name="warningTooltipMessage"
                fullWidth
                margin="dense"
                value={values['warningTooltipMessage']}
                error={touched['warningTooltipMessage'] && Boolean(errors['warningTooltipMessage'])}
                helperText={touched['warningTooltipMessage'] && errors['warningTooltipMessage']}
                onChange={(e) => {
                  setFieldValue('warningTooltipMessage', e.target.value.trimStart());
                }}
              />
            )}
          </Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="isColumnEditable"
                  checked={values['isColumnEditable']}
                  onChange={(e) => {
                    setFieldValue('isColumnEditable', e.target.checked);
                  }}
                  color="primary"
                />
              }
              label="Editable Column"
            />
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="stopHideColumn"
                  checked={values['stopHideColumn']}
                  onChange={(e) => {
                    setFieldValue('stopHideColumn', e.target.checked);
                  }}
                  color="primary"
                />
              }
              label="Stop Hide Column"
            />
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="isHideColumnSum"
                  checked={values['isHideColumnSum']}
                  onChange={(e) => {
                    setFieldValue('isHideColumnSum', e.target.checked);
                  }}
                  color="primary"
                />
              }
              label="Hide Column Sum"
            />
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="Uneditable"
                  disabled={values['type'] === 'freeStyleMultiSelect'}
                  checked={values['isUneditable']}
                  onChange={(e) => {
                    setFieldValue('isUneditable', e.target.checked);
                  }}
                  color="primary"
                />
              }
              label="Uneditable"
            />
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            {initialValues?.hasOwnProperty('disableOnEdit') && (
              <FormControlLabel
                control={
                  <Checkbox
                    name="disableEdit"
                    checked={values['disableOnEdit']}
                    onChange={(e) => {
                      setFieldValue('disableOnEdit', e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label="Disable On Edit"
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            {initialValues?.hasOwnProperty('unique') && (
              <FormControlLabel
                control={
                  <Checkbox
                    name="isUnique"
                    checked={values['unique']}
                    onChange={(e) => {
                      setFieldValue('unique', e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label="Unique"
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="primaryField"
                  checked={values['primaryField']}
                  onChange={(e) => {
                    setFieldValue('primaryField', e.target.checked);
                  }}
                  color="primary"
                />
              }
              label="Primary Field"
            />
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            {fieldData.type === 'singleLine' && (
              <FormControlLabel
                control={
                  <Checkbox
                    name="isSystemGenerate"
                    checked={values['isSystemGenerate']}
                    onChange={(e) => {
                      setFieldValue('isSystemGenerate', e.target.checked);
                      if (!e.target.checked) {
                        setFieldValue('systemGeneratedPrefix', '');
                        setFieldValue('systemGeneratedAutoIncrement', false);
                      }
                    }}
                    color="primary"
                  />
                }
                label="System Generated"
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            {values['isSystemGenerate'] && (
              <Box display="block">
                <TextField
                  variant="outlined"
                  type="text"
                  label="System Generated Prefix"
                  name="systemGeneratedPrefix"
                  rows={4}
                  fullWidth
                  margin="dense"
                  value={values['systemGeneratedPrefix']}
                  error={touched['systemGeneratedPrefix'] && Boolean(errors['systemGeneratedPrefix'])}
                  helperText={touched['systemGeneratedPrefix'] && errors['systemGeneratedPrefix']}
                  onChange={(e) => {
                    setFieldValue('systemGeneratedPrefix', e.target.value.trimStart());
                  }}
                />
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            {values['isSystemGenerate'] && (
              <FormControlLabel
                control={
                  <Checkbox
                    name="systemGeneratedAutoIncrement"
                    checked={values['systemGeneratedAutoIncrement']}
                    onChange={(e) => {
                      setFieldValue('systemGeneratedAutoIncrement', e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label="System Generated Auto Increment"
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              disabled={values['required']}
              control={
                <Checkbox
                  name="ishiddenField"
                  checked={values['required'] ? false : values['hiddenField']}
                  onChange={(e) => {
                    setFieldValue('hiddenField', e.target.checked);
                  }}
                  color="primary"
                />
              }
              label="Hidden Field"
            />
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="showInPdf"
                  checked={values['showInPdf']}
                  onChange={(e) => {
                    setFieldValue('showInPdf', e.target.checked);
                  }}
                  color="primary"
                />
              }
              label="Show In Pdf"
            />
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            {(fieldData.type === 'multiSelect' || fieldData.type === 'dropDown') && (
              <FormControlLabel
                control={
                  <Checkbox
                    disabled={values?.lookup}
                    name="isAdditionalOption"
                    checked={values['addAdditionalOption']}
                    onChange={(e) => {
                      setFieldValue('addAdditionalOption', e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label="Add Additional Option"
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            {(fieldData.type === 'multiSelect' || fieldData.type === 'dropDown') && (
              <FormControlLabel
                control={
                  <Checkbox
                    // disabled={values?.lookup}
                    name="isAddBukOption"
                    checked={values['addBulkOptions']}
                    onChange={(e) => {
                      setFieldValue('addBulkOptions', e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label="Add Bulk Options"
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            {values['lookup'] && (
              <FormControlLabel
                control={
                  <Checkbox
                    name="entityWiseLookup"
                    checked={values['entityWiseLookup']}
                    onChange={(e) => setFieldValue('entityWiseLookup', e.target.checked)}
                    color="primary"
                  />
                }
                label="Entity Wise Lookup"
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            {fieldData.type === 'dropDown' && (
              <FormControlLabel
                control={
                  <Checkbox
                    disabled={values?.lookup}
                    name="isManualOption"
                    checked={values['addManualOptionInExcel']}
                    onChange={(e) => {
                      setFieldValue('addManualOptionInExcel', e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label="Add Manual Option In Excel"
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            {fieldData.type === 'process' && (
              <FormControlLabel
                control={
                  <Checkbox
                    name="showAdditionalInfoPopup"
                    checked={values['showAdditionalInfoPopup']}
                    onChange={(e) => {
                      setFieldValue('showAdditionalInfoPopup', e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label="Show Additional Information Popup On Close"
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            {values['showAdditionalInfoPopup'] && (
              <Autocomplete
                value={values['additionalInfoSection']}
                size="small"
                options={section.map((s) => s.sectionName)}
                getOptionLabel={(option) => option}
                onChange={(event: any, newValue: string | null) => {
                  setFieldValue('additionalInfoSection', newValue);
                }}
                renderInput={(params) => <TextField {...params} label="Additional Info Section" variant="outlined" name="additionalInfoSection" />}
              />
            )}
          </Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            {module === 'form-builder-master' && (
              <FormControlLabel
                control={
                  <Checkbox
                    name="editAble"
                    checked={values['editAble']}
                    onChange={(e) => {
                      setFieldValue('editAble', e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label="Editable"
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Box>
        <Grid container>
          <Grid item xs={12} md={6}>
            {module === 'form-builder-master' && (
              <FormControlLabel
                control={
                  <Checkbox
                    name="deletAble"
                    checked={values['deletAble']}
                    onChange={(e) => {
                      setFieldValue('deletAble', e.target.checked);
                    }}
                    color="primary"
                  />
                }
                label="Deletable"
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}></Grid>
        </Grid>
      </Box>
      <Entity values={values} setFieldValue={setFieldValue} errors={errors} touched={touched} brandId={brandId} />
      <Box mt={1}>
        <FormControl component="fieldset">
          <FormLabel component="legend">
            Column Size
          </FormLabel>
          <RadioGroup
            aria-label="columnSize"
            name="columnSize"
            value={values['columnSize']}
            style={{ flexDirection: 'row' }}
            onChange={(e) => {
              setFieldValue('columnSize', Number(e?.target?.value));
            }}
          >
            <FormControlLabel value={6} control={<Radio size='small' />} label="Col 6" />
            <FormControlLabel value={12} control={<Radio size='small' />} label="Col 12" />
          </RadioGroup>
        </FormControl>
      </Box>
    </Box>
  );
};

export default Setting;
