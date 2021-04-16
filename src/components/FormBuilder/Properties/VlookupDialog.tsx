import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import FieldList from '../FieldList';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import { camelCase, UnCamelCase } from "../../../constants/helpers";
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

export const VlookupDialog = ({ open, handleClose, fieldData, sectionId, section, setSection }) => {

  const [state, setState] = React.useState({
    fieldLabel: fieldData.fieldLabel,
    required: fieldData.required,
    isTooltip: fieldData.isTooltip,
    tooltipMessage: fieldData.tooltipMessage,
  });
  const [option, setOption] = useState(fieldData.option ? fieldData.option : []);
  const [reletedTo, setReletedTo] = React.useState(fieldData.reletedTo ? fieldData.reletedTo : []);


  const handleSelectChange = (event) => {
    setReletedTo(event.target.value);
  };


  const onChangeValue = (index, fieldName, value) => {
    let data = [...option]
    data[index][fieldName] = value
    setOption(data)
  };

  const AddRemoveValue = (type, index) => {
    let data = [...option]
    if (type === "add") {
      data.splice((index + 1), 0, { optionLabel: "" });
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
    option.forEach((ele) => {
      ele.optionValue = ele.optionLabel
    })
    data.forEach((row) => {
      if (row.sectionId.toString() === sectionId.toString()) {
        row.field.forEach((ele) => {
          if (ele.fieldId.toString() === fieldData.fieldId.toString()) {
            ele.fieldLabel = state.fieldLabel
            ele.required = state.required
            ele.isTooltip = state.isTooltip
            ele.tooltipMessage = state.tooltipMessage
            ele.reletedTo = reletedTo
            ele.option = option
          }
        })
      }
    });
    setSection(data)
    handleClose()
  };

  return (
    <div>
      <Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" fullWidth maxWidth={"md"} open={open}>
        <CustomDialogHeader title={`${FieldList[fieldData.type.toUpperCase()].label} Properties`} onClose={handleClose}></CustomDialogHeader>
        <CustomDialogContent>
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
              <Grid item xs={6}>
                <Box mt={1}>
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
                </Box>
              </Grid>
            </Grid>
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
            <FormControl variant="outlined" fullWidth margin="dense">
              <InputLabel htmlFor="filled-age-native-simple">Releted To</InputLabel>
              <Select
                inputProps={{
                  name: 'reletedTo',
                  id: "demo-simple-select-outlined"
                }}
                margin="dense"
                label="Releted To"
                multiple
                name="reletedTo"
                value={reletedTo}
                onChange={handleSelectChange}
                renderValue={(selected: any) => selected.join(', ')}
                MenuProps={MenuProps}
              >
                {section.map((_section) => (
                  _section.field.map((_field) => (_field.fieldId !== fieldData.fieldId &&
                    <MenuItem key={_field.fieldName} value={_field.fieldName ? _field.fieldName : camelCase(_field.fieldLabel.replace(/[^a-zA-Z ]/g, ""))}>
                      <Checkbox color="primary" checked={reletedTo.indexOf(_field.fieldName ? _field.fieldName : camelCase(_field.fieldLabel.replace(/[^a-zA-Z ]/g, ""))) > -1} />
                      <ListItemText primary={_field.fieldLabel} />
                    </MenuItem>
                  ))
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box padding={1}>
            <Typography variant="body2">Options</Typography>
            <Box border={1} mt={1} p={1} bgcolor="grey.100" borderColor="grey.300" maxHeight={300} style={{ overflow: "auto" }}>
              <Box bgcolor="white" border={1} mb={1} p={1} borderColor="grey.300" width={"100%"} >
                <Box display="flex" flexDirection="row">
                  <Box minWidth={100} pl={2}>
                    <Typography variant="body2">Action</Typography>
                  </Box>
                  <Box minWidth={200} pl={1}>
                    <Typography variant="body2">Option Label</Typography>
                  </Box>
                  {reletedTo.map((_row) => (
                    <Box minWidth={200} pl={1}>
                      <Typography variant="body2">{UnCamelCase(_row)}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              {option.map((data, index) => (
                <Box key={index} bgcolor="white" border={1} mb={1} p={1} borderColor="grey.300" width={"100%"} >
                  <Box display="flex" flexDirection="row" >
                    <Box minWidth={100}>
                      <IconButton aria-label="setting" onClick={() => AddRemoveValue("add", index)} >
                        <AddCircleOutlineIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="setting" onClick={() => AddRemoveValue("remove", index)} >
                        <RemoveCircleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Box minWidth={200} maxWidth={200} pl={1}>
                      <TextField
                        id="standard-basic"
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        style={{ margin: 0 }}
                        value={data.optionLabel}
                        onChange={(event) => onChangeValue(index, "optionLabel", event.target.value)}
                      />
                    </Box>
                    {reletedTo.map((_row) => (
                      <Box minWidth={200} maxWidth={200} pl={1}>
                        <TextField
                          id="standard-basic"
                          variant="outlined"
                          margin="dense"
                          fullWidth
                          style={{ margin: 0 }}
                          value={data[_row]}
                          onChange={(event) => onChangeValue(index, _row, event.target.value)}
                        />
                      </Box>))}
                  </Box>
                </Box>
              ))}
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