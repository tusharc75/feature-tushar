import React, { useState, Fragment, useRef } from 'react';
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
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { camelCase } from "./../../../constants/helpers";
import ListItemText from '@material-ui/core/ListItemText';
import { Vlokup } from "./vlokup";
import { Formula } from "./formula";
import { Converter } from "./converter";

import Divider from '@material-ui/core/Divider';

const FieldSchema = Yup.object().shape({
  type: Yup.string()
    .required("please select field type"),
  fieldLabel: Yup.string()
    .required("please enter field label"),
});


const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: 300,
    },
  },
};

export const AddField = ({ fieldData, handleClose, handleAddField, fields }) => {


  const [initialValues, setInitialValues] = useState(fieldData ? fieldData : {
    type: "singleLine", fieldLabel: "", required: false, isTooltip: false,
    tooltipMessage: "", returnType: "decimal", decimalPlaces: 2, inputFields: [], option: [{ optionLabel: "" }], formula: "return ", isvlookupReverse: false,
    units: [], displayUnits: []
  });
  const ref = useRef(null);

  const handleSave = (values) => {

    let data: any = {}
    data.fieldLabel = values.fieldLabel
    data.fieldName = camelCase(values.fieldLabel.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ''))
    data.required = values.required
    data.isTooltip = values.isTooltip
    data.tooltipMessage = values.tooltipMessage

    if (values.type === "dropDown" || values.type === "multiSelect" || values.type === "radio" || values.type === "process") {
      values.option.forEach((ele, index) => {
        ele.order = index + 1
        ele.default = false
        if (index === 0) {
          ele.default = true
        }
      })
      data.option = values.option
    }
    if (values.type === "decimal") {
      data.decimalPlaces = values.decimalPlaces
    }
    if (values.lookup) {
      data.lookup = values.lookup
      data.lookupResource = values.lookupResource
    }
    if (values.type === "formula") {
      data.formula = values.formula
      data.inputFields = values.inputFields
      data.returnType = values.returnType
      data.decimalPlaces = values.decimalPlaces
    }
    if (values.type === "vlookupDropdown") {
      values.option.forEach((ele) => {
        ele.optionValue = ele.optionLabel
      })
      data.inputFields = values.inputFields
      data.option = values.option
      data.isvlookupReverse = values.isvlookupReverse
    }
    if (values.type === "converter") {
      data.units = values.units
      data.displayUnits = values.displayUnits
      data.option = values.option
    }
    handleAddField(data)
  }


  return (<Dialog aria-labelledby="customized-dialog-title" fullWidth maxWidth={"md"} open={true}>
    <Formik innerRef={ref} initialValues={initialValues} validationSchema={FieldSchema} onSubmit={handleSave}>
      {({ submitForm, touched, errors, setFieldValue, values }) => (
        <Form autoComplete="off" autoCorrect="off" noValidate >
          <CustomDialogHeader title={fieldData ? "Update Field" : "Add Field"} onClose={handleClose}></CustomDialogHeader>
          <CustomDialogContent>
            <FormControl fullWidth margin="dense" variant="outlined">
              <InputLabel id="demo-simple-select-outlined-label">Field Type</InputLabel>
              <Select
                labelId="demo-simple-select-outlined-label"
                id="demo-simple-select-outlined"
                value={values["type"]}
                onChange={(e) => setFieldValue("type", e.target.value)}
                label="Type"
                name="type"
                error={touched["type"] && Boolean(errors["type"])}
              >
                <MenuItem value={"singleLine"}>Single Line</MenuItem>
                <MenuItem value={"multiLine"}>Multi-Line</MenuItem>
                <MenuItem value={"decimal"}>Decimal</MenuItem>
                <MenuItem value={"percent"}>Percent</MenuItem>
                <MenuItem value={"formula"}>Formula</MenuItem>
                <MenuItem value={"vlookupDropdown"}>Vlookup Dropdown</MenuItem>
                <MenuItem value={"converter"}>Converter</MenuItem>
              </Select>
            </FormControl>
            <TextField
              variant="outlined"
              type="text"
              label="Field Label"
              required={true}
              name="fieldLabel"
              fullWidth
              margin="dense"
              value={values["fieldLabel"]}
              error={touched["fieldLabel"] && Boolean(errors["fieldLabel"])}
              helperText={touched["fieldLabel"] && errors["fieldLabel"]}
              onChange={(e) => setFieldValue("fieldLabel", e.target.value.trimStart())}
            />

            {(values["type"] === "decimal" || values["type"] === "formula") &&
              <Grid spacing={3} container>
                {values["type"] === "formula" && <Grid item xs={12} sm={6} md={6}>
                  <FormControl fullWidth margin="dense" variant="outlined">
                    <InputLabel id="demo-simple-select-outlined-label">Return Type</InputLabel>
                    <Select
                      labelId="demo-simple-select-outlined-label"
                      id="demo-simple-select-outlined"
                      value={values["returnType"]}
                      onChange={(e) => setFieldValue("returnType", e.target.value)}
                      label="Return Type"
                      name="returnType"
                    >
                      <MenuItem value="decimal">Decimal</MenuItem>
                      <MenuItem value="string">String</MenuItem>
                      <MenuItem value="boolean">Boolean</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                }
                {(values["type"] === "decimal" || values["returnType"] === "decimal") &&
                  <Grid item xs={12} sm={6} md={6}>
                    <FormControl fullWidth margin="dense" variant="outlined">
                      <InputLabel id="demo-simple-select-outlined-label">Number of decimal places</InputLabel>
                      <Select
                        labelId="demo-simple-select-outlined-label"
                        id="demo-simple-select-outlined"
                        value={values["decimalPlaces"]}
                        onChange={(e) => setFieldValue("decimalPlaces", e.target.value)}
                        label="Number of decimal places"
                        name="decimalPlaces"
                      >
                        <MenuItem value={0}>0</MenuItem>
                        <MenuItem value={1}>1</MenuItem>
                        <MenuItem value={2}>2</MenuItem>
                        <MenuItem value={3}>3</MenuItem>
                        <MenuItem value={4}>4</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>}
              </Grid>}


            {values["type"] === "formula" && <Formula
              fields={fields}
              values={values}
              setFieldValue={setFieldValue}
            />}

            {values["type"] === "vlookupDropdown" &&
              <Vlokup
                fields={fields}
                values={values}
                setFieldValue={setFieldValue}
              />}

            {values["type"] === "converter" && <Converter
              fields={fields}
              values={values}
              setFieldValue={setFieldValue}
            />}

            <Box pt={1} pb={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="required"
                    checked={values["required"]}
                    onChange={(e) => setFieldValue("required", e.target.checked)}
                    color="primary"
                  />
                }
                label="Required"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    name="isTooltip"
                    checked={values["isTooltip"]}
                    onChange={(e) => setFieldValue("isTooltip", e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Tooltip"
              />
              {values["isTooltip"] &&
                <TextField
                  variant="outlined"
                  type="text"
                  label="Tooltip Message"
                  required={true}
                  name="tooltipMessage"
                  fullWidth
                  margin="dense"
                  value={values["tooltipMessage"]}
                  error={touched["tooltipMessage"] && Boolean(errors["tooltipMessage"])}
                  helperText={touched["tooltipMessage"] && errors["tooltipMessage"]}
                  onChange={(e) => setFieldValue("tooltipMessage", e.target.value.trimStart())}
                />
              }
            </Box>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button onClick={handleClose} color="primary">Cancel</Button>
            <Button type="submit" color="primary" variant="contained">{fieldData ? "Update" : "Add"}</Button>
          </CustomDialogFooter>
        </Form>)}
    </Formik>
  </Dialog>
  );
}