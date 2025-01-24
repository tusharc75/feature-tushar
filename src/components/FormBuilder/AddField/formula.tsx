import { useState, useRef } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { checkFormula } from '../../../constants/formulaUtility';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid2';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { IconButton } from '@mui/material';
import { FiMaximize2 } from 'react-icons/fi';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { ThemeButton } from 'src/components/Helpers/Buttons';

export const Formula = ({ fields, values, setFieldValue, _id, touched, errors }) => {
  const [formulaError, setFormulaError] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const inputRef = useRef<any>();

  const handleCheckSyntax = () => {
    if (values['formula'] && values['formula'] !== '') {
      let inputValues = {};
      values['inputFields'] &&
        values['inputFields'].forEach((_input) => {
          inputValues[_input] = 1;
        });
      if (checkFormula(values['formula'], inputValues)) {
        setFormulaError('Valid Formula');
      } else {
        setFormulaError('Invalid Formula');
      }
    }
  };

  const handleAddInputField = (field) => {
    let pushPosition = inputRef.current.selectionStart;
    if (!values['formula']) {
      values['formula'] = '';
    }
    var new_formula = [values['formula'].slice(0, pushPosition), field, values['formula'].slice(pushPosition)].join('');
    setFieldValue('formula', new_formula);
    inputRef.current.focus();
  };

  const convertLabeltoValue = (value) => {
    const result = [];
    value.forEach((_v) => {
      if (fields.filter((data) => data.fieldLabel === _v || data.fieldName === _v).length) {
        result.push(fields.filter((data) => data.fieldLabel === _v || data.fieldName === _v)[0].fieldName);
      } else {
        result.push(_v);
      }
    });
    return result;
  };

  const convertValuetoLabel = (value) => {
    const result = [];
    value.forEach((_v) => {
      if (fields.filter((data) => data.fieldName === _v).length) {
        result.push(fields.filter((data) => data.fieldLabel === _v || data.fieldName === _v)[0].fieldLabel);
      } else {
        result.push(_v);
      }
    });
    return result;
  };

  const generateLabel = (label) => {
    const data = fields?.find((d) => d.fieldName === label);
    if (data) {
      return `${data.fieldLabel} - ${label}`;
    } else {
      return `${label}`;
    }
  };

  return (
    <Box>
      <Grid container justifyContent="flex-end">
        <HtmlTooltip title={`Full Screen`}>
          <IconButton
            aria-label="Full Screen"
            onClick={() => {
              setStepFullScreen(true);
            }}
            size="small"
          >
            <FiMaximize2 />
          </IconButton>
        </HtmlTooltip>
      </Grid>
      <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
        <Box>
          <FormControl variant="outlined" fullWidth margin="dense">
            <Autocomplete
              multiple
              disableCloseOnSelect={true}
              id="tags-filled"
              options={
                fields &&
                fields
                  .filter((_f) => _f._id !== _id)
                  .map((_field) => {
                    return _field.fieldLabel;
                  })
              }
              getOptionLabel={(option) => option || ''}
              value={values['inputFields'] ? convertValuetoLabel(values['inputFields']) : []}
              renderTags={(value: string[], getTagProps) =>
                value.map((option: string, index: number) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
              }
              onChange={(e, value) => setFieldValue('inputFields', convertLabeltoValue(value))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  size="small"
                  variant="outlined"
                  label="Input Parameters"
                  placeholder="Input Parameters"
                  name="inputFields"
                  error={touched['inputFields'] && Boolean(errors['inputFields'])}
                  helperText={touched['inputFields'] && errors['inputFields']}
                />
              )}
            />
          </FormControl>
          {values['inputFields'] && values['inputFields'].length > 0 && (
            <Box pt={0.5} pb={0.5}>
              {values['inputFields'].map((_field) => (
                <Chip className="mb-1 ml-1 cursor-pointer" key={_field} label={generateLabel(_field)} onClick={() => handleAddInputField(_field)} />
              ))}
            </Box>
          )}
          <Box pt={0.5}>
            <TextField
              id="standard-basic"
              name="formula"
              variant="outlined"
              label="Formula"
              margin="dense"
              size="small"
              fullWidth
              multiline
              rows={stepFullScreen ? 30 : 4}
              type="text"
              placeholder="Formula (return field1 + field2)"
              inputRef={inputRef}
              value={values['formula']}
              error={touched['formula'] && Boolean(errors['formula'])}
              helperText={touched['formula'] && errors['formula']}
              onKeyPress={(event) => {
                event.stopPropagation();
              }}
              onChange={(e) => {
                setFieldValue('formula', e.target.value);
              }}
            />
            <Grid container>
              <Grid size={{xs:6}}>
                {formulaError && (
                  <Typography variant="caption" display="block">
                    {formulaError}{' '}
                  </Typography>
                )}
                <ThemeButton buttonType='transparent' onClick={handleCheckSyntax}>
                  Check Syntax
                </ThemeButton>
              </Grid>
              <Grid size={{xs:6}}>
                {values['type'] === 'currencyAmount' && (
                  <FormControl fullWidth margin="dense" variant="outlined" size="small">
                    <InputLabel id="demo-simple-select-outlined-label">Formula applied on Currency</InputLabel>
                    <Select
                      labelId="demo-simple-select-outlined-label"
                      id="demo-simple-select-outlined"
                      value={values['formulaOnCurrency']}
                      onChange={(e) => setFieldValue('formulaOnCurrency', e.target.value)}
                      label="Formula applied on Currency"
                      name="formulaOnCurrency"
                    >
                      {values['displayCurrency'] && values['displayCurrency'].map((_currency) => <MenuItem value={_currency}>{_currency}</MenuItem>)}
                    </Select>
                  </FormControl>
                )}
              </Grid>
            </Grid>
          </Box>
        </Box>
      </ContentFullScreen>
    </Box>
  );
};
