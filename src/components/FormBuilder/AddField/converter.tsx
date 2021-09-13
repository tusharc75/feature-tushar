import { useState, useCallback, useRef, useEffect } from "react";
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Chip from '@material-ui/core/Chip';
import { makeStyles } from '@material-ui/core/styles';
import FormHelperText from '@material-ui/core/FormHelperText';

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300
    }
  }
};

const useStyles = makeStyles(() => ({
  tdWidth: {
    maxWidth: 100,
    minWidth: 100
  },
  headerHeight: {
    maxWidth: 100,
    minWidth: 100,
    height: 40,
  },
}));

export const Converter = ({ fields, values, setFieldValue, touched, errors }) => {


  const [isEditUnitName, setEditUnitName] = useState(null);
  const [newUnitName, setNewUnitName] = useState(null);


  const onChangeValue = (index, fieldName, value) => {
    let data = values['unitoption'] ? [...values['unitoption']] : [];
    data[index][fieldName] = value;
    setFieldValue('unitoption', data);
  };


  const handleChangeUnit = (value) => {
    setFieldValue(
      'units',
      value.map((_f) => _f.trim().replace(/[^a-zA-Z0-9/]/g, ''))
    );
    let data = values['unitoption'] ? [...values['unitoption']] : [];
    if (data.length > value.length) {
      let index = 0;
      let deleteindex = 0;
      for (var x in data[0]) {
        if (!value.includes(x)) {
          deleteindex = index;
        }
        index = index + 1;
      }
      data.splice(deleteindex, 1);
    }

    let newOptions = [];
    value.forEach((_unit, index) => {
      let row = {};
      value.forEach((__unit, i) => {
        row[__unit] = data && data[index] && data[index][__unit] ? data[index][__unit] : '';
      });
      newOptions.push(row);
    });
    setFieldValue('unitoption', newOptions);
    if (values['displayUnits']) {
      const result = [];
      values['displayUnits'].forEach((_unit) => {
        if (value.includes(_unit)) {
          result.push(_unit);
        }
      });
      setFieldValue('displayUnits', result);
    }
    if (values['formulaUnits']) {
      const result = [];
      values['formulaUnits'].forEach((_unit) => {
        if (value.includes(_unit)) {
          result.push(_unit);
        }
      });
      setFieldValue('formulaUnits', result);
    }
  };

  const handleChangeUnitName = () => {
    if (isEditUnitName === newUnitName) {
      setEditUnitName(null);
    }
    else if (newUnitName.trim() === "") {
      setEditUnitName(null);
      return;
    }
    else if (values['units'].includes(newUnitName)) {
      setEditUnitName(null);
      return;
    }
    else {
      const unitName = newUnitName.trim().replace(/[^a-zA-Z0-9/]/g, '')
      if (values['units'] && values['units'].includes(isEditUnitName)) {
        const units = values['units'];
        units[units.indexOf(isEditUnitName)] = unitName;
        setFieldValue('units', units);
      }
      if (values['displayUnits'] && values['displayUnits'].includes(isEditUnitName)) {
        const displayUnits = values['displayUnits'];
        displayUnits[displayUnits.indexOf(isEditUnitName)] = unitName;
        setFieldValue('displayUnits', displayUnits);
      }
      if (values['formulaUnits'] && values['formulaUnits'].includes(isEditUnitName)) {
        const formulaUnits = values['formulaUnits'];
        formulaUnits[formulaUnits.indexOf(isEditUnitName)] = unitName;
        setFieldValue('formulaUnits', formulaUnits);
      }
      if (values['unitoption']) {
        const unitoption = values['unitoption'];
        unitoption.forEach(element => {
          for (let row in element) {
            if (row === isEditUnitName) {
              element[unitName] = element[row];
              delete element[row];
            }
          }
        });
        setFieldValue('unitoption', unitoption);
      }
      setEditUnitName(null);
    }
  }

  const classes = useStyles();
  return (
    <Box marginTop={2}>
      <Autocomplete
        multiple
        disableCloseOnSelect={true}
        id="autocompleteunits"
        options={[]}
        value={values['units'] ? values['units'] : []}
        freeSolo
        renderTags={(value: string[], getTagProps) =>
          value.map((option: string, index: number) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
        }
        onChange={(e, value) => handleChangeUnit(value)}
        renderInput={(params) =>
          <TextField
            {...params}
            margin="dense"
            name="units"
            variant="outlined"
            label="Units"
            placeholder="Units"
            error={touched['units'] && Boolean(errors['units'])}
            helperText={touched['units'] && errors['units']}
          />}
      />
      {values['units'] && values['units'].length > 0 && (
        <Box marginTop={1} border={1} p={1} borderColor="grey.300" maxHeight={300} style={{ overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th></th>
                {values['units'] &&
                  values['units'].map((_unit, index) => (
                    <th key={index} className={classes.headerHeight}
                      onClick={() => {
                        setEditUnitName(_unit)
                        setNewUnitName(_unit)
                      }}  >
                      {isEditUnitName === _unit ?
                        <TextField
                          id="unitNameChangeField"
                          name={_unit}
                          variant="outlined"
                          margin="dense"
                          fullWidth
                          autoFocus
                          style={{ margin: 0 }}
                          value={newUnitName}
                          onKeyDown={(e: any) => {
                            if (e.keyCode == 13) {
                              handleChangeUnitName()
                            }
                          }}
                          onBlur={handleChangeUnitName}
                          onChange={(event) => setNewUnitName(event.target.value)}
                        />
                        : _unit
                      }
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {values['units'] &&
                values['units'].map((_unit, i) => (
                  <tr key={i}>
                    <th style={{ paddingRight: 10, minWidth: 50 }}>
                      {_unit}
                    </th>
                    {values['units'] &&
                      values['units'].map((_unit, index) => (
                        <td className={classes.tdWidth} key={index}>
                          <TextField
                            name={_unit + '_' + index}
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            style={{ margin: 0 }}
                            value={values['unitoption'] && values['unitoption'][i] && values['unitoption'][i][_unit]}
                            onChange={(event) => onChangeValue(i, _unit, event.target.value)}
                          />
                        </td>
                      ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </Box>
      )}
      {values['units'] && values['units'].length > 0 && (
        <Box mt={1}>
          <Grid spacing={3} container>
            <Grid item xs={12} sm={4} md={4}>
              <FormControl variant="outlined" fullWidth margin="dense" error={touched['displayUnits'] && Boolean(errors['displayUnits'])}>
                <InputLabel htmlFor="displayUnits">Display Units</InputLabel>
                <Select
                  inputProps={{
                    name: 'displayUnits',
                    id: 'displayUnits'
                  }}
                  margin="dense"
                  label="Display Units"
                  multiple
                  name="displayUnits"
                  value={values['displayUnits'] ? values['displayUnits'] : []}
                  onChange={(e: any) => {
                    const value: [] = e.target.value;
                    if (value[value.length - 1] === 'all') {
                      setFieldValue('displayUnits', values['displayUnits']?.length === values['units']?.length ? [] : values['units']);
                      return;
                    }
                    setFieldValue('displayUnits', value);
                  }}
                  renderValue={(selected: any) => selected.join(', ')}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="all">
                    <ListItemIcon>
                      <Checkbox
                        color="primary"
                        checked={
                          values['units'] &&
                          values['displayUnits'] &&
                          values['units'].length > 0 &&
                          values['displayUnits'].length === values['units'].length
                        }
                        indeterminate={
                          values['displayUnits'] &&
                          values['units'] &&
                          values['displayUnits'].length > 0 &&
                          values['displayUnits'].length < values['units'].length
                        }
                      />
                    </ListItemIcon>
                    <ListItemText primary="Select All" />
                  </MenuItem>
                  {values['units'] &&
                    values['units'].map((_unit) => (
                      <MenuItem key={_unit} value={_unit}>
                        <Checkbox color="primary" checked={values['displayUnits'] && values['displayUnits'].indexOf(_unit) > -1} />
                        <ListItemText primary={_unit} />
                      </MenuItem>
                    ))}
                </Select>
                <FormHelperText>{touched['displayUnits'] && errors['displayUnits']}</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={4}>
              <FormControl variant="outlined" fullWidth margin="dense" error={touched['formulaUnits'] && Boolean(errors['formulaUnits'])}>
                <InputLabel htmlFor="formulaUnits">Formula Units</InputLabel>
                <Select
                  inputProps={{
                    name: 'formulaUnits',
                    id: 'formulaUnits'
                  }}
                  error={touched['formulaUnits'] && Boolean(errors['formulaUnits'])}
                  margin="dense"
                  label="Formula Units"
                  multiple
                  name="formulaUnits"
                  value={values['formulaUnits'] ? values['formulaUnits'] : []}
                  onChange={(e: any) => {
                    const value: [] = e.target.value;
                    if (value[value.length - 1] === 'all') {
                      setFieldValue('formulaUnits', values['formulaUnits']?.length === values['units']?.length ? [] : values['units']);
                      return;
                    }
                    setFieldValue('formulaUnits', e.target.value);
                  }}
                  renderValue={(selected: any) => selected.join(', ')}
                  MenuProps={MenuProps}
                >
                  <MenuItem value="all">
                    <ListItemIcon>
                      <Checkbox
                        color="primary"
                        checked={
                          values['units'] &&
                          values['formulaUnits'] &&
                          values['units'].length > 0 &&
                          values['formulaUnits'].length === values['units'].length
                        }
                        indeterminate={
                          values['formulaUnits'] &&
                          values['units'] &&
                          values['formulaUnits'].length > 0 &&
                          values['formulaUnits'].length < values['units'].length
                        }
                      />
                    </ListItemIcon>
                    <ListItemText primary="Select All" />
                  </MenuItem>
                  {values['units'] &&
                    values['units'].map((_unit) => (
                      <MenuItem key={_unit} value={_unit}>
                        <Checkbox color="primary" checked={values['formulaUnits'] && values['formulaUnits'].indexOf(_unit) > -1} />
                        <ListItemText primary={_unit} />
                      </MenuItem>
                    ))}
                </Select>
                <FormHelperText>{touched['formulaUnits'] && errors['formulaUnits']}</FormHelperText>
              </FormControl>
            </Grid>
            {values['isFormula'] && (
              <Grid item xs={12} sm={4} md={4}>
                <FormControl fullWidth margin="dense" variant="outlined">
                  <InputLabel id="formulaOnConverter">Formula applied on converter</InputLabel>
                  <Select
                    labelId="formulaOnConverter"
                    id="formulaOnConverter"
                    value={values['formulaOnConverter']}
                    onChange={(e) => setFieldValue('formulaOnConverter', e.target.value)}
                    label="Formula applied on converter"
                    name="formulaOnConverter"
                  >
                    {values['formulaUnits'] && values['formulaUnits'].map((_unit) => <MenuItem value={_unit}>{_unit}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
    </Box>
  );
};
