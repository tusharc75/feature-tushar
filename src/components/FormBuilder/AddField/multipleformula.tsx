import React, { useState, useRef, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import { Button, Typography } from '@mui/material';
import { checkFormula } from '../../../constants/formulaUtility';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { IconButton } from '@mui/material';
import { FiMaximize2 } from 'react-icons/fi';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Grid from '@mui/material/Grid';

export const MultipleFormula = ({ fields, values, setFieldValue, _id, touched, errors }) => {
  useEffect(() => {
    values['formulaFields'] &&
      values['formulaFields'].forEach((_f) => {
        setFieldValue('formulaoption_' + _f, values['formulaoption'][_f] ? values['formulaoption'][_f] : '');
      });
  }, [values['formulaFields']]);

  let inputRef = useRef([]);

  const [isMyInputFocused, setIsMyInputFocused] = useState(null);
  const [formulaError, setFormulaError] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const handleCheckSyntax = () => {
    if (values['formulaoption'] && values['formulaoption'].length !== 0) {
      let inputValues = {};
      let invalidFormulas = '';
      values['formulainputFields'] &&
        values['formulainputFields'].forEach((_input) => {
          inputValues[_input] = 1;
        });
      Object.keys(values['formulaoption']).forEach((_formula) => {
        if (!checkFormula(values['formulaoption'][_formula] ? values['formulaoption'][_formula] : '', inputValues))
          invalidFormulas = invalidFormulas + `${_formula} `;
      });
      invalidFormulas !== '' ? setFormulaError(' Invalid formulas are ' + invalidFormulas) : setFormulaError(' All formulas are valid ');
    }
  };

  const onChangeValue = (index, fieldName, value) => {
    const data = values['formulaoption'] ? { ...values['formulaoption'] } : {};
    data[fieldName] = value;
    setFieldValue('formulaoption', data);
  };

  const handleAddInputField = (field) => {
    if (isMyInputFocused || isMyInputFocused === 0) {
      let pushPosition = inputRef.current[isMyInputFocused].current.selectionStart;
      let fieldName = inputRef.current[isMyInputFocused].current.name;
      fieldName = fieldName.replace('formulaoption_', '');
      let data = values['formulaoption'] ? values['formulaoption'] : {};
      if (!data[fieldName]) {
        data[fieldName] = '';
      }
      data[fieldName] = [data[fieldName].slice(0, pushPosition), field, data[fieldName].slice(pushPosition)].join('');
      setFieldValue('formulaoption', data);
      inputRef.current[isMyInputFocused].current.focus();
    }
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

  if (values['formulaFields'] && values['formulaFields'].length) {
    inputRef.current = values['formulaFields'] && values['formulaFields'].map((_field, index) => (inputRef.current[index] = React.createRef()));
  }

  const generateLabel = (label) => {
    const data = fields?.find((d) => d.fieldName === label);
    if (data) {
      return `${data.fieldLabel} - ${label}`;
    } else {
      return `${label}`;
    }
  };

  const handleChangeFormulaField = (value) => {
    const convertedValue = convertLabeltoValue(value);
    setFieldValue('formulaFields', convertedValue);
    var formulaoption = {};
    let oldformulaoption = values['formulaoption'] ? values['formulaoption'] : {};
    convertedValue &&
      convertedValue.forEach((_f) => {
        formulaoption[_f] = oldformulaoption[_f] ? oldformulaoption[_f] : '';
      });
    setFieldValue('formulaoption', formulaoption);
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
        <>
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
              value={values['formulaFields'] ? convertValuetoLabel(values['formulaFields']) : []}
              renderTags={(value: string[], getTagProps) =>
                value.map((option: string, index: number) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
              }
              onChange={(e, value) => handleChangeFormulaField(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  size="small"
                  variant="outlined"
                  label="Formula Fields"
                  placeholder="Formula Fields"
                  name="formulaFields"
                  error={touched['formulaFields'] && Boolean(errors['formulaFields'])}
                  helperText={touched['formulaFields'] && errors['formulaFields']}
                />
              )}
            />
          </FormControl>
          <FormControl variant="outlined" fullWidth margin="dense">
            <Autocomplete
              multiple
              disableCloseOnSelect={true}
              id="tags-filled"
              options={
                fields &&
                fields.map((_field) => {
                  return _field.fieldLabel;
                })
              }
              getOptionLabel={(option) => option}
              value={values['formulainputFields'] ? convertValuetoLabel(values['formulainputFields']) : []}
              renderTags={(value: string[], getTagProps) =>
                value.map((option: string, index: number) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
              }
              onChange={(e, value) => setFieldValue('formulainputFields', convertLabeltoValue(value))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  size="small"
                  variant="outlined"
                  label="Input Parameters"
                  placeholder="Input Parameters"
                  name="formulainputFields"
                  error={touched['formulainputFields'] && Boolean(errors['formulainputFields'])}
                  helperText={touched['formulainputFields'] && errors['formulainputFields']}
                />
              )}
            />
          </FormControl>
          {values['formulainputFields'] && values['formulainputFields'].length > 0 && (
            <Box pt={0.5} pb={0.5}>
              {values['formulainputFields'].map((_field) => (
                <Chip className="ml-1 cursor-pointer" key={_field} label={generateLabel(_field)} onClick={() => handleAddInputField(_field)} />
              ))}
            </Box>
          )}
          {values['formulaFields'] && values['formulaFields'].length > 0 && (
            <Box marginTop={1} border={1} p={1} borderColor="var(--common-border-color)" maxHeight={500} style={{ overflow: 'auto' }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  <>
                    {values['formulaFields'] &&
                      values['formulaFields'].map((_field, i) => (
                        <tr key={i}>
                          <td className="pt-2" style={{ paddingRight: 10, width: '50px' }}>
                            {_field}
                          </td>
                          <td className="pt-2">
                            <TextField
                              name={'formulaoption_' + _field}
                              id={'formulaoption_' + _field}
                              variant="outlined"
                              margin="dense"
                              size="small"
                              fullWidth
                              multiline
                              rows={stepFullScreen ? 20 : 2}
                              placeholder="Formula (return field1 + field2)"
                              style={{ margin: 0 }}
                              inputRef={inputRef.current[i]}
                              //onBlur={() => setIsMyInputFocused(null)}
                              onFocus={() => setIsMyInputFocused(i)}
                              onKeyPress={(event) => {
                                event.stopPropagation();
                              }}
                              value={values['formulaoption'] && values['formulaoption'][_field] && values['formulaoption'][_field]}
                              onChange={(event) => onChangeValue(i, _field, event.target.value)}
                              error={touched['formulaoption_' + _field] && Boolean(errors['formulaoption_' + _field])}
                              helperText={touched['formulaoption_' + _field] && errors['formulaoption_' + _field]}
                            />
                          </td>
                        </tr>
                      ))}
                    {
                      <tr>
                        <td colSpan={2}>
                          {formulaError && (
                            <Typography variant="caption" display="block">
                              {formulaError}
                            </Typography>
                          )}
                          <Button size="small" onClick={handleCheckSyntax} color="primary">
                            Check Syntax
                          </Button>
                        </td>
                      </tr>
                    }
                  </>
                </tbody>
              </table>
            </Box>
          )}
        </>
      </ContentFullScreen>
    </Box>
  );
};
