import React, { useState, Fragment } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import FieldList from '../FieldList';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';

const LookupResource = [
  { name: "Supplier Account", value: "Supplier Account" },
  { name: "Customer Account", value: "Customer Account" },
  { name: "User", value: "User" },
  { name: "Supplier Contact", value: "Supplier Contact" },
  { name: "Customer Contact", value: "Customer Contact" },
  { name: "Brand", value: "Brand" },
  { name: "Entity", value: "Entity" },
  { name: "Role", value: "Role" },
  { name: "Lead", value: "Lead" },
  { name: "Opportunity", value: "Opportunity" },
  { name: "Product Category", value: "ProductCategory" },
]

export const PropertieDialog = ({ open, handleClose, fieldData, sectionId, section, setSection }) => {

  const [state, setState] = React.useState({
    fieldLabel: fieldData.fieldLabel,
    required: fieldData.required,
    isTooltip: fieldData.isTooltip,
    tooltipMessage: fieldData.tooltipMessage,
    decimalPlaces: fieldData.decimalPlaces,
    lookup: fieldData.lookup,
    lookupResource: fieldData.lookupResource,
  });
  const [option, setOption] = useState(fieldData.option ? fieldData.option : []);

  const onChangeValue = (index, value) => {
    let data = [...option]
    data[index].optionLabel = value
    data[index].optionValue = value
    setOption(data)
  };

  const AddRemoveValue = (type, index) => {
    let data = [...option]
    if (type === "add") {
      data.splice((index + 1), 0, { optionLabel: "", optionValue: "" });
    }
    else {
      if (data.length !== 1) {
        data.splice(index, 1);
      }
    }
    setOption(data)
  };

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
            option.forEach((ele, index) => {
              ele.order = index + 1
              ele.default = false
              if (index === 0) {
                ele.default = true
              }
            })
            ele.option = option
            if (fieldData.type === "decimal") {
              ele.decimalPlaces = state.decimalPlaces
            }
            if (state.lookup) {
              ele.lookup = state.lookup
              ele.lookupResource = state.lookupResource
            }
          }
        })
      }
    });
    setSection(data)
    handleClose()
  };

  return (
    <div>
      <Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" fullWidth maxWidth={"sm"} open={open}>
        <CustomDialogHeader title={`${FieldList[fieldData.type.toUpperCase()].label} Properties`} onClose={handleClose}></CustomDialogHeader>
        <CustomDialogContent>
          <Box padding={1}>
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
            {fieldData.type === "decimal" &&
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
            {(fieldData.type === "multiSelect" || fieldData.type === "dropDown") &&
              <Fragment>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="lookup"
                      checked={state.lookup}
                      onChange={handleChecked}
                      color="primary"
                    />
                  }
                  label="Lookup"
                />
                {state.lookup &&
                  <Box pt={2} pb={2}>
                    <FormControl fullWidth margin="dense" variant="outlined">
                      <InputLabel id="demo-simple-select-outlined-label">Lookup Resource</InputLabel>
                      <Select
                        labelId="demo-simple-select-outlined-label"
                        id="demo-simple-select-outlined"
                        value={state.lookupResource}
                        onChange={handleChange}
                        label="Lookup Resource"
                        name="lookupResource"
                      >
                        {LookupResource.map((_data) => (
                          <MenuItem value={_data.value}>{_data.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>}
              </Fragment>}
            {(option.length > 0 && !state.lookup) ?
              <Box pt={2} pb={2}>
                <Typography variant="body2">Options</Typography>
                <Box border={1} mt={1} p={1} bgcolor="grey.100" borderColor="grey.300">
                  {option.map((data, index) => (
                    <Box key={index} bgcolor="white" border={1} mb={1} p={1} borderColor="grey.300" >
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <TextField
                            id="standard-basic"
                            variant="outlined"
                            margin="dense"
                            fullWidth
                            style={{ margin: 0 }}
                            value={data.optionLabel}
                            onChange={(event) => onChangeValue(index, event.target.value)}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <IconButton aria-label="setting" onClick={() => AddRemoveValue("add", index)} >
                            <AddCircleOutlineIcon fontSize="small" />
                          </IconButton>
                          <IconButton aria-label="setting" onClick={() => AddRemoveValue("remove", index)} >
                            <RemoveCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Box>
              </Box> : null}
            <br></br>
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
            <br></br>
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