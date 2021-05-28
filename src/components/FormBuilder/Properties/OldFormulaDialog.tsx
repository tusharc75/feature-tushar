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
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition} from "../../../constants/helpers";

const OperatorList = [
  { name: "Add", value: "+" },
  { name: "Subtract", value: "-" },
  { name: "Multiply", value: "*" },
  { name: "Divide", value: "/" },
  { name: "Remainder", value: "%" },
  { name: "Exponentiation", value: "^" },
  { name: "Open parenthesis", value: "(" },
  { name: "Close parenthesis", value: ")" },
  { name: "Not equal", value: "<>" },
  { name: "Equals", value: "=" },
  { name: "Less than", value: "<" },
  { name: "Greater than", value: ">" },
  { name: "Less than or equal", value: "<=" },
  { name: "Greater than or equal", value: ">=" },
]

const FunctionList = [
  { name: "IF", value: "IF(,,)" },
]


const styles = (theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(2),
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
});


const useStyles = makeStyles((theme) => ({
  active: {
    backgroundColor: theme.palette.grey[300],
  },
}));



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
  const [functionSelect, setFunctionSelect] = useState(null);
  const [fieldSelect, seFieldSelect] = useState(null);
  const [operatorSelect, setOperatorSelect] = useState(null);
  const [formulaError, setFormulaError] = useState(null);

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
          if (ele._id.toString() === fieldData._id.toString()) {
            ele.fieldLabel = state.fieldLabel
            ele.required = state.required
            ele.isTooltip = state.isTooltip
            ele.tooltipMessage = state.tooltipMessage
            ele.option = option
            ele.formula = state.formula
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
      //let values = { owner: 5, rate: 5, amount: 10 }
      let values = { rate: 10, qty: 5, fix: 12 }
      //getFormulaValue(state.formula, values, "decimal", 2)
      if (checkFormula(state.formula, values)) {
        setFormulaError("Valid Formula")
      }
      else {
        setFormulaError("Invalid Formula")
      }
    }
  }

  const handleAddSyntax = (from) => {
    let pushPosition = inputRef.current.selectionStart
    let content = ""
    if (from === "function") {
      if (functionSelect) {
        content = functionSelect;
      }
    }
    else if (from === "field") {
      if (fieldSelect) {
        content = "{" + fieldSelect + "}";
      }
    }
    else if (from === "operator") {
      if (operatorSelect) {
        content = operatorSelect;
      }
    }
    var contentPush = [state.formula.slice(0, pushPosition), content, state.formula.slice(pushPosition)].join('');
    setState({ ...state, formula: contentPush });
  }

  const classes = useStyles();
  return (
    <div>
      <Dialog 
      fullScreen={isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}onClose={handleClose} aria-labelledby="customized-dialog-title" fullWidth maxWidth={"md"} open={open}>
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
            <Grid container spacing={5}>
              <Grid item xs={4} >
                <Typography variant="subtitle2">Select Function</Typography>
                <Box mt={1} mb={1} border={1} borderColor="grey.300" minHeight={150} maxHeight={150} style={{ overflow: "auto" }}>
                  {FunctionList.map((_function) => (
                    <ListItem className={_function.value === functionSelect && classes.active} key={_function.name} dense button onClick={() => setFunctionSelect(_function.value)} >
                      <ListItemText primary={_function.name} />
                    </ListItem>
                  ))}
                </Box>
                <Button variant="outlined" size="small" onClick={() => handleAddSyntax("function")} color="primary">Insert</Button>
              </Grid>
              <Grid item xs={4} >
                <Typography variant="subtitle2">Select Field</Typography>
                <Box mt={1} mb={1} border={1} borderColor="grey.300" minHeight={150} maxHeight={150} style={{ overflow: "auto" }} >
                  {section.map((_section) => (
                    _section.field.map((_field) => (
                      _field.type !== FieldList.FORMULA.type &&
                      <ListItem className={(_field.fieldName ? _field.fieldName : camelCase(_field.fieldLabel)) === fieldSelect && classes.active} key={_field._id} dense button onClick={() => seFieldSelect(_field.fieldName ? _field.fieldName : camelCase(_field.fieldLabel))} >
                        <ListItemText primary={_field.fieldLabel + " (" + (_field.fieldName ? _field.fieldName : camelCase(_field.fieldLabel)) + ")"} />
                      </ListItem>
                    ))
                  ))}
                </Box>
                <Button variant="outlined" size="small" onClick={() => handleAddSyntax("field")} color="primary">Insert</Button>
              </Grid>
              <Grid item xs={4} >
                <Typography variant="subtitle2">Select Operator</Typography>
                <Box mt={1} mb={1} border={1} borderColor="grey.300" minHeight={150} maxHeight={150} style={{ overflow: "auto" }} >
                  {OperatorList.map((_operator) => (
                    <ListItem className={_operator.value === operatorSelect && classes.active} key={_operator.name} dense button onClick={() => setOperatorSelect(_operator.value)} >
                      <ListItemText primary={_operator.value + "  " + _operator.name} />
                    </ListItem>
                  ))}
                </Box>
                <Button variant="outlined" size="small" onClick={() => handleAddSyntax("operator")} color="primary">Insert</Button>
              </Grid>
            </Grid>
            <Box pt={2}>
              <TextField
                id="standard-basic"
                name="formula"
                variant="outlined"
                label="Formula"
                margin="dense"
                fullWidth
                multiline
                rows={4}
                value={state.formula}
                inputRef={inputRef}
                onChange={handleChange}
              />
              {formulaError && <Typography variant="caption" display="block">{formulaError} </Typography>}
              <Button size="small"  onClick={handleCheckSyntax} color="primary">Check Syntax</Button>
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