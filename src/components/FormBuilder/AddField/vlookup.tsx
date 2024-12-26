import React, { useState, useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { read, utils, writeFile } from 'xlsx';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { FixedSizeList } from 'react-window';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import axiosInstance from '../../../axios/axiosInstance';

export const Vlookup = ({ fields, values, setFieldValue, _id, touched, errors }) => {
  const [isUpdate, setUpdate] = useState(false);
  const [lookupOptions, setlookupOptions] = useState({});

  useEffect(() => {
    if (!values['option'] || values['option'].length === 0) {
      setFieldValue('option', [{ optionLabel: 'Option 1', optionValue: 'Option 1' }]);
    }
    GetLookupOption(values['vlookupInputFields']);
  }, []);

  useEffect(() => {
    setUpdate(!isUpdate);
  }, [lookupOptions]);

  const onChangeValue = (index, fieldName, value) => {
    let data = [...values['option']];
    data[index][fieldName] = value;
    setFieldValue('option', data);
  };

  const GetLookupOption = async (vlookupInputFields) => {
    var lookupResource = [];
    vlookupInputFields &&
      vlookupInputFields.forEach((element) => {
        const _filter = fields.filter((_f) => _f.fieldName === element);
        if (_filter.length) {
          if (_filter[0].lookup) {
            lookupResource.push(_filter[0].lookupResource);
          }
        }
      });
    if (lookupResource.length) {
      axiosInstance()
        .get(`/sa-formbuilder/lookup?lookupResource=` + lookupResource.join(','))
        .then(({ data: { data } }) => {
          setlookupOptions(data);
        })
        .catch((error) => {});
    }
  };

  const AddRemoveValue = (type, index) => {
    let data = [...values['option']];
    if (type === 'add') {
      data.splice(index + 1, 0, { optionLabel: '' });
    } else {
      if (data.length !== 1) {
        data.splice(index, 1);
      }
    }
    setFieldValue('option', data);
    setUpdate(!isUpdate);
  };

  const handleImportExcel = (e) => {
    e.preventDefault();
    const files = e.target.files;
    const f = files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const data = e.target.result;
      let readedData = read(data, { type: 'binary' });
      const wsname = readedData.SheetNames[0];
      const ws = readedData.Sheets[wsname];
      const dataParse = utils.sheet_to_json(ws, { header: 1 });
      if (dataParse.length) {
        dataParse.splice(0, 1);
        let option = [];
        dataParse.forEach((row) => {
          let rowInsert = {};
          rowInsert['optionLabel'] = row[0] ? row[0].toString() : '';
          values['vlookupInputFields'] &&
            values['vlookupInputFields'].forEach((coloum, index) => {
              rowInsert[coloum] = row[index + 1] ? row[index + 1].toString() : '';
            });
          option.push(rowInsert);
        });
        setFieldValue('option', option);
        setUpdate(!isUpdate);
      }
    };
    reader.readAsBinaryString(f);
  };

  const handleExportExcel = () => {
    const export_json = [...values['option']];
    export_json.forEach((_d) => {
      delete _d?.optionValue;
    });
    const header = [];
    if (export_json.length) {
      for (var key in export_json[0]) {
        if (key === 'optionLabel') {
          header.push(values['fieldLabel']);
        } else {
          const filter = fields.filter((_f) => _f.fieldName === key);
          if (filter.length) {
            header.push(filter[0]['fieldLabel']);
          } else {
            header.push(key);
          }
        }
      }
    }
    const ws = utils.json_to_sheet(export_json);
    if (header.length) {
      utils.sheet_add_aoa(ws, [header]);
    }
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sheet1');
    writeFile(wb, `${values['fieldLabel']} Vlookup Dropdown Options.xlsx`);
  };

  const convertLabelToValue = (value) => {
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

  const convertValueToLabel = (value) => {
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

  const Row = React.useMemo(() => {
    return React.forwardRef((props2: any, ref2: any) => (
      <div style={props2.style} ref={ref2}>
        <Box border={1} p={1} borderColor="var(--common-border-color)" width={'100%'}>
          <Box display="flex" flexDirection="row">
            <Box minWidth={100}>
              <IconButton aria-label="setting" onClick={() => AddRemoveValue('add', props2.index)}>
                <AddCircleOutlineIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="setting" onClick={() => AddRemoveValue('remove', props2.index)}>
                <RemoveCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box minWidth={200} maxWidth={200} pl={1}>
              <TextField
                key={props2.index}
                id="standard-basic"
                variant="outlined"
                margin="dense"
                size="small"
                fullWidth
                style={{ margin: 0 }}
                value={values['option'][props2.index] && values['option'][props2.index].optionLabel}
                onChange={(event) => {
                  onChangeValue(props2.index, 'optionLabel', event.target.value);
                }}
              />
            </Box>
            {values['vlookupInputFields'] &&
              values['vlookupInputFields'].map((_row) => (
                <Box minWidth={200} maxWidth={200} pl={1}>
                  {(fields.filter((_f) => _f.fieldName === _row).length &&
                    fields.filter((_f) => _f.fieldName === _row)[0].type === 'dropDown' &&
                    !fields.filter((_f) => _f.fieldName === _row)[0].lookup) ||
                  fields.filter((_f) => _f.fieldName === _row)[0].type === 'vlookupDropdown' ? (
                    <Select
                      id="demo-simple-select-outlined"
                      fullWidth
                      variant="outlined"
                      margin="dense"
                      size="small"
                      value={values['option'][props2.index] && values['option'][props2.index][_row] && values['option'][props2.index][_row]}
                      onChange={(event) => onChangeValue(props2.index, _row, event.target.value)}
                    >
                      {fields.filter((_f) => _f.fieldName === _row)[0].option &&
                        fields
                          .filter((_f) => _f.fieldName === _row)[0]
                          .option.map((_option) => {
                            return (
                              <MenuItem key={_option.optionLabel} value={_option.optionLabel}>
                                {_option.optionLabel}
                              </MenuItem>
                            );
                          })}
                    </Select>
                  ) : fields.filter((_f) => _f.fieldName === _row).length &&
                    fields.filter((_f) => _f.fieldName === _row)[0].type === 'dropDown' &&
                    fields.filter((_f) => _f.fieldName === _row)[0].lookup ? (
                    <Select
                      id="demo-simple-select-outlined"
                      fullWidth
                      variant="outlined"
                      margin="dense"
                      size="small"
                      value={values['option'][props2.index] && values['option'][props2.index][_row] && values['option'][props2.index][_row]}
                      onChange={(event) => onChangeValue(props2.index, _row, event.target.value)}
                    >
                      {lookupOptions &&
                        lookupOptions[fields.filter((_f) => _f.fieldName === _row)[0].lookupResource] &&
                        lookupOptions[fields.filter((_f) => _f.fieldName === _row)[0].lookupResource].map((_option) => {
                          return (
                            <MenuItem key={_option.optionValue} value={_option.optionValue}>
                              {_option.optionLabel}
                            </MenuItem>
                          );
                        })}
                    </Select>
                  ) : (
                    <TextField
                      id="standard-basic"
                      variant="outlined"
                      margin="dense"
                      size="small"
                      fullWidth
                      style={{ margin: 0 }}
                      value={values['option'][props2.index] && values['option'][props2.index][_row] && values['option'][props2.index][_row]}
                      onChange={(event) => onChangeValue(props2.index, _row, event.target.value)}
                    />
                  )}
                </Box>
              ))}
          </Box>
        </Box>
      </div>
    ));
  }, [isUpdate]);

  return (
    <Box marginTop={2}>
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
        value={values['vlookupInputFields'] ? convertValueToLabel(values['vlookupInputFields']) : []}
        renderTags={(value: string[], getTagProps) =>
          value.map((option: string, index: number) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
        }
        onChange={(e, value) => {
          setFieldValue('vlookupInputFields', convertLabelToValue(value));
          const vlookupInputFields = values['vlookupInputFields'] ? values['vlookupInputFields'] : [];
          GetLookupOption([...vlookupInputFields, ...convertLabelToValue(value)]);
          setUpdate(!isUpdate);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            margin="dense"
            size="small"
            variant="outlined"
            label="Input Parameters"
            placeholder="Input Parameters"
            name="vlookupInputFields"
            error={touched['vlookupInputFields'] && Boolean(errors['vlookupInputFields'])}
            helperText={touched['vlookupInputFields'] && errors['vlookupInputFields']}
          />
        )}
      />
      <Box marginTop={1} marginBottom={2}>
        <Box>
          <Grid spacing={3} container>
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="body2">Options</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={6} container justify="flex-end">
              <label htmlFor="vlookupimportFromExcel" className={`mr-3 cursor-pointer`}>
                Import from Excel
              </label>
              <input
                onClick={(e: any) => (e.target.value = null)}
                id="vlookupimportFromExcel"
                name="vlookupimportFromExcel"
                onChange={handleImportExcel}
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                style={{
                  opacity: '0',
                  position: 'absolute',
                  zIndex: -1
                }}
                type="file"
              />
              <label className={`cursor-pointer`} onClick={handleExportExcel}>
                Export to Excel
              </label>
            </Grid>
          </Grid>
        </Box>
        <Box border={1} mt={1} p={1} borderColor="var(--common-border-color)">
          <Box border={1} mb={1} p={1} borderColor="var(--common-border-color)" width={'100%'}>
            <Box display="flex" flexDirection="row">
              <Box minWidth={100} pl={2}>
                <Typography variant="body2">Action</Typography>
              </Box>
              <Box minWidth={200} pl={1}>
                <Typography variant="body2">Option Label</Typography>
              </Box>
              {values['vlookupInputFields'] &&
                convertValueToLabel(values['vlookupInputFields']).map((_row) => (
                  <Box minWidth={200} pl={1}>
                    <Typography variant="body2">{_row}</Typography>
                  </Box>
                ))}
            </Box>
          </Box>
          <FixedSizeList
            height={300}
            width={'100%'}
            itemSize={55}
            itemData={values['option'] && values['option']}
            itemCount={values['option'] && values['option'].length}
          >
            {Row}
          </FixedSizeList>
        </Box>
      </Box>
      {values['isConverter'] ||
        (values['type'] === 'converter' && (
          <Grid item xs={12} sm={4} md={4}>
            <FormControl fullWidth margin="dense" size="small" variant="outlined">
              <InputLabel id="vlookupOnConverter">Vlookup applied on converter</InputLabel>
              <Select
                labelId="vlookupOnConverter"
                id="vlookupOnConverter"
                value={values['vlookupOnConverter']}
                onChange={(e) => setFieldValue('vlookupOnConverter', e.target.value)}
                label="Vlookup applied on converter"
                name="vlookupOnConverter"
              >
                {values['formulaUnits'] && values['formulaUnits'].map((_unit) => <MenuItem value={_unit}>{_unit}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        ))}
      {!values['isVlookup'] && (
        <FormControlLabel
          control={
            <Checkbox
              name="isvlookupReverse"
              checked={values['isvlookupReverse']}
              onChange={(e) => setFieldValue('isvlookupReverse', e.target.checked)}
              color="primary"
            />
          }
          label="Vlookup Reverse"
        />
      )}
    </Box>
  );
};
