import { Box, Checkbox, FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField } from '@material-ui/core';
import { TEXTBOX, DROPDOWN, DATE } from '../FieldList';
import { ShowFieldDependentOn } from './Field/ShowFieldDependentOn';
import { ResourceDropdown } from './Field/ResourceDropdown';
import ImageUpload from './Field/ImageUpload';

export default function Setting({ fields, fieldData, values, touched, errors, setFieldValue }) {
  const FormControlLavel = ({ data }) => {
    return <FormControlLabel value={data?.type} control={<Radio />} label={data?.label} />;
  };

  return (
    <Box p={1}>
      {Object.keys({ ...TEXTBOX, ...DROPDOWN, ...DATE })
        .map((o) => ({ ...TEXTBOX, ...DROPDOWN, ...DATE }[o]?.type))
        ?.includes(values?.type) && (
        <Box>
          <FormControl>
            <FormLabel id="demo-row-radio-buttons-group-label">Type</FormLabel>
            <RadioGroup
              aria-label="setting"
              name="type"
              value={values['type']}
              row
              onChange={(e) => {
                setFieldValue('type', e.target.value);
              }}
            >
              {Object.keys(TEXTBOX)
                ?.map((o) => TEXTBOX[o]?.type)
                ?.includes(values?.type) &&
                Object.keys(TEXTBOX)?.map((t) => {
                  return <FormControlLavel data={TEXTBOX[t]} />;
                })}
              {Object.keys(DROPDOWN)
                ?.map((o) => DROPDOWN[o]?.type)
                ?.includes(values?.type) &&
                Object.keys(DROPDOWN)?.map((t) => {
                  return <FormControlLavel data={DROPDOWN[t]} />;
                })}
              {Object.keys(DATE)
                ?.map((o) => DATE[o]?.type)
                ?.includes(values?.type) &&
                Object.keys(DATE)?.map((t) => {
                  return <FormControlLavel data={DATE[t]} />;
                })}
            </RadioGroup>
          </FormControl>
        </Box>
      )}

      <Box pt={1}>
        <Grid container>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  name="isShowFieldDependentOn"
                  checked={values['isShowFieldDependentOn']}
                  onChange={(e) => {
                    setFieldValue('isShowFieldDependentOn', e.target.checked);
                  }}
                  color="primary"
                />
              }
              label="Show Field Dependent On"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            {values['isShowFieldDependentOn'] && (
              <ShowFieldDependentOn values={values} name={'showFieldDependentOn'} setFieldValue={setFieldValue} fields={fields} />
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
              label="Show Warning Tooltip"
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
                <ImageUpload
                  values={{ defaultValue: values['defaultValue'] }}
                  errors={errors}
                  touched={touched}
                  name={'defaultValue'}
                  setFieldValue={(name, value) => {
                    setFieldValue(name, value);
                  }}
                />
              ) : fieldData.type === 'colorPicker' ? (
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
              ) : (fieldData.type === 'dropDown' || fieldData.type === 'multiSelect') && values['lookup'] ? (
                <ResourceDropdown
                  type={fieldData.type}
                  lookupResource={values['lookupResource']}
                  value={values['defaultValue']}
                  setFieldValue={setFieldValue}
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
            {values?.hasOwnProperty('disableOnEdit') && (
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
            {values.hasOwnProperty('unique') && (
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
            {values.type === 'singleLine' && (
              <FormControlLabel
                control={
                  <Checkbox
                    name="isSystemGenerate"
                    checked={values['isSystemGenerate']}
                    onChange={(e) => {
                      setFieldValue('isSystemGenerate', e.target.checked);
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
              <>
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
              </>
            )}
          </Grid>
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
    </Box>
  );
}
