import React, { useState, useRef } from 'react';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import FieldList from '../FieldList';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { checkFormula, getFormulaValue } from "../../../constants/formulaUtility";
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import { camelCase } from "../../../constants/helpers";
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';

const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300,
    },
  },
};

export const FormulaDialog = ({ open, handleClose, fieldData, sectionId, section, setSection }) => {

  const [state, setState] = React.useState({
    fieldLabel: fieldData.fieldLabel,
    required: fieldData.required,
    isTooltip: fieldData.isTooltip,
    tooltipMessage: fieldData.tooltipMessage,
    formula: fieldData.formula ? fieldData.formula : "",
    returnType: fieldData.returnType,
    decimalPlaces: fieldData.decimalPlaces,
  });

  const inputRef = useRef<any>();
  const [option, setOption] = useState(fieldData.option ? fieldData.option : []);
  const [formulaError, setFormulaError] = useState(null);
  const [inputFields, setInputFields] = React.useState(fieldData.inputFields ? fieldData.inputFields : []);

  const handleChecked = (event) => {
    setState({ ...state, [event.target.name]: event.target.checked });
  };

  const handleChange = (event) => {
    setState({ ...state, [event.target.name]: event.target.value });
  };

  const onSubmitSave = () => {
    let data = [...section]
    data.forEach((row) => {
      if (row.sectionId.toString() === sectionId.toString()) {
        row.field.forEach((ele) => {
          if (ele.fieldId.toString() === fieldData.fieldId.toString()) {
            ele.fieldLabel = state.fieldLabel
            ele.required = state.required
            ele.isTooltip = state.isTooltip
            ele.tooltipMessage = state.tooltipMessage
            ele.option = option
            ele.formula = state.formula
            ele.inputFields = inputFields
            ele.returnType = state.returnType
            ele.decimalPlaces = state.decimalPlaces
          }
        })
      }
    });
    setSection(data)
    handleClose()
  };

  const handleCheckSyntax = () => {
    if (state.formula !== "") {
      let values = {}
      inputFields.forEach(_input => {
        values[_input] = 1;
      })
      //getFormulaValue(state.formula, values, "decimal", 2)
      if (checkFormula(state.formula, values)) {
        setFormulaError("Valid Formula")
      }
      else {
        setFormulaError("Invalid Formula")
      }
    }
  }

  const handleSelectChange = (event) => {
    setInputFields(event.target.value);
  };

  return (
    <div>
      <Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" fullWidth maxWidth={"md"} open={open}>
        <CustomDialogHeader title={`${FieldList[fieldData.type.toUpperCase()].label} Properties`} onClose={handleClose}></CustomDialogHeader>
        <CustomDialogContent >
          <Box padding={1}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  id="standard-basic"
                  name="fieldLabel"
                  variant="outlined"
                  label="Field Label"
                  margin="dense"
                  fullWidth
                  value={state.fieldLabel}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={3}>
                <FormControl fullWidth margin="dense" variant="outlined">
                  <InputLabel id="demo-simple-select-outlined-label">Return Type</InputLabel>
                  <Select
                    labelId="demo-simple-select-outlined-label"
                    id="demo-simple-select-outlined"
                    value={state.returnType}
                    onChange={handleChange}
                    label="Return Type"
                    name="returnType"
                  >
                    <MenuItem value="decimal">Decimal</MenuItem>
                    <MenuItem value="string">String</MenuItem>
                    <MenuItem value="boolean">Boolean</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={3}>
                {state && state.returnType && state.returnType === "decimal" &&
                  <FormControl fullWidth margin="dense" variant="outlined">
                    <InputLabel id="demo-simple-select-outlined-label">Number of decimal places</InputLabel>
                    <Select
                      labelId="demo-simple-select-outlined-label"
                      id="demo-simple-select-outlined"
                      value={state.decimalPlaces}
                      onChange={handleChange}
                      label="Number of decimal places"
                      name="decimalPlaces"
                    >
                      <MenuItem value={0}>0</MenuItem>
                      <MenuItem value={1}>1</MenuItem>
                      <MenuItem value={2}>2</MenuItem>
                      <MenuItem value={3}>3</MenuItem>
                      <MenuItem value={4}>4</MenuItem>
                    </Select>
                  </FormControl>}
              </Grid>
            </Grid>
            <FormControlLabel
              control={
                <Checkbox
                  name="required"
                  checked={state.required}
                  onChange={handleChecked}
                  color="primary"
                />
              }
              label="Required"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="isTooltip"
                  checked={state.isTooltip}
                  onChange={handleChecked}
                  color="primary"
                />
              }
              label="Show Tooltip"
            />
            {state.isTooltip ?
              <TextField
                id="standard-basic"
                name="tooltipMessage"
                variant="outlined"
                label="Tooltip Message"
                margin="dense"
                fullWidth
                value={state.tooltipMessage}
                onChange={handleChange}
              /> : null
            }
          </Box>
          <Box padding={1}>
            <Box>
              <FormControl variant="outlined" fullWidth margin="dense">
                <InputLabel htmlFor="filled-age-native-simple">Input Parameters</InputLabel>
                <Select
                  inputProps={{
                    name: 'reletedTo',
                    id: "demo-simple-select-outlined"
                  }}
                  margin="dense"
                  label="Input Parameters"
                  multiple
                  name="reletedTo"
                  value={inputFields}
                  onChange={handleSelectChange}
                  renderValue={(selected: any) => selected.join(', ')}
                  MenuProps={MenuProps}
                >
                  {section.map((_section) => (
                    _section.field.map((_field) => (_field.fieldId !== fieldData.fieldId &&
                      <MenuItem key={_field.fieldName} value={_field.fieldName ? _field.fieldName : camelCase(_field.fieldLabel.replace(/[^a-zA-Z ]/g, ""))}>
                        <Checkbox color="primary" checked={inputFields.indexOf(_field.fieldName ? _field.fieldName : camelCase(_field.fieldLabel.replace(/[^a-zA-Z ]/g, ""))) > -1} />
                        <ListItemText primary={_field.fieldLabel} />
                      </MenuItem>
                    ))
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box pt={2}>
              <TextField
                id="standard-basic"
                name="formula"
                variant="outlined"
                label="Formula"
                margin="dense"
                fullWidth
                multiline
                rows={8}
                value={state.formula}
                inputRef={inputRef}
                onChange={handleChange}
              />
              {formulaError && <Typography variant="caption" display="block">{formulaError} </Typography>}
              <Button onClick={handleCheckSyntax} color="primary">Check Syntax</Button>
            </Box>
          </Box>
        </CustomDialogContent>
        <CustomDialogFooter>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={onSubmitSave} color="primary" variant="contained">
            Save
          </Button>
        </CustomDialogFooter>
      </Dialog>
    </div>
  );
}