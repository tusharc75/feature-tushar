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
import FormHelperText from '@material-ui/core/FormHelperText';
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { camelCase } from "./../../../constants/helpers";
import { Vlookup } from "./vlookup";
import { Formula } from "./formula";
import { Converter } from "./converter";
import { Currency } from "./currency";
import { Option } from "../AddField/option";
import Divider from '@material-ui/core/Divider';
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "../../../constants/helpers";
import axiosInstance from "../../../axios/axiosInstance";

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

export const AddField = (props) => {

  const { fieldData, handleClose, handleAddField, fields, refrence, section } = props;


  const [initialValues, setInitialValues] = useState(fieldData ? fieldData : {
    sectionName: "", type: "singleLine", fieldLabel: "", required: false, isTooltip: false,
    tooltipMessage: "", returnType: "decimal", decimalPlaces: 2, inputFields: [], option: [{ optionLabel: "Option 1", optionValue: "Option 1" }], formula: "return ", isvlookupReverse: false,
    units: [], displayUnits: [], isConverter: false, isFormula: false, isMulitFormula: false, displayCurrency: refrence !== "formAdd" ? ["CUR"] : ["USD"]
  });

  let new_fields = []
  fields && fields.forEach(_field => {
    if (_field.type !== "currencyAmount" && (_field.type === "converter" || _field.isConverter === true)) {
      _field.displayUnits && _field.displayUnits.forEach(_unit => {
        new_fields.push({ ..._field, fieldLabel: _field.fieldLabel + " " + _unit, fieldName: _field.fieldName + "_" + _unit.toLowerCase() })
      })
    }
    else if (_field.type === "currencyAmount") {
      _field.displayCurrency && _field.displayCurrency.forEach(_currency => {
        if (_field.isConverter) {
          _field.displayUnits && _field.displayUnits.forEach(_unit => {
            new_fields.push({ ..._field, fieldLabel: _field.fieldLabel + " " + _unit, fieldName: _field.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase() })
          })
        }
        else {
          new_fields.push({ ..._field, fieldLabel: _field.fieldLabel + " " + _currency, fieldName: _field.fieldName + "_" + _currency.toLowerCase() })
        }
      })
    }
    else {
      new_fields.push(_field)
    }
  })

  const ref = useRef(null);

  const handleSave = (values) => {

    let data: any = {}
    data._id = fieldData && fieldData._id ? fieldData._id : parseInt((Math.random() * 100000).toString())
    if (refrence === "builder") {
      data.sectionName = values.sectionName
    }
    data.type = values.type
    data.fieldLabel = values.fieldLabel
    data.fieldName = camelCase(values.fieldLabel.replace(/[^a-zA-Z0-9]/g, ''))

    if (refrence !== "custom") {
      if (fields.filter((t) => t.fieldName === data.fieldName).length) {
        alert("Field name alredy exist")
        return
      }
    }

    data.required = values.required
    data.isTooltip = values.isTooltip
    data.tooltipMessage = values.tooltipMessage
    data.isConverter = values.isConverter
    data.isFormula = values.isFormula
    data.isMulitFormula = values.isMulitFormula

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
    if (values.type === "decimal" || values.type === "converter" || values.type === "currencyAmount") {
      data.decimalPlaces = values.decimalPlaces
    }
    if (values.lookup) {
      data.lookup = values.lookup
      data.lookupResource = values.lookupResource
    }
    if (values.type === "formula" || values.isFormula) {
      data.formula = values.formula
      data.inputFields = values.inputFields
      data.returnType = values.returnType ? values.returnType : "decimal"
      data.decimalPlaces = values.decimalPlaces ? values.decimalPlaces : 2
    }
    if (values.type === "vlookupDropdown") {
      values.option.forEach((ele) => {
        ele.optionValue = ele.optionLabel
      })
      data.inputFields = values.inputFields
      data.option = values.option
      data.isvlookupReverse = values.isvlookupReverse
    }
    if (values.type === "converter" || values.isConverter) {
      data.units = values.units
      data.displayUnits = values.displayUnits
      data.formulaUnits = values.formulaUnits
      data.option = values.option
    }
    if (values.type === "currencyAmount") {
      data.displayCurrency = values.displayCurrency
    }

    if (values.type === "currencyAmount" && refrence === "formAdd") {
      axiosInstance().get(`/converter?type=currency`).then((result: any) => {
        data.currency = result.data.data.currency;
        data.currencyoption = result.data.data.option;
        handleAddField(data)
      }).catch((error) => {
      });
    }
    else {
      handleAddField(data)
    }
  }

  const onKeyPress = (event) => {
    if (event.which === 13) {
      event.preventDefault();
    }
  }

  function validate(values) {
    const errors = {};
    if (refrence === "builder") {
      if (!values.sectionName || values.sectionName === "") {
        errors["sectionName"] = "Please select section name";
      }
    }
    return errors;
  }


  return (<Dialog aria-labelledby="customized-dialog-title" fullWidth
    fullScreen={isMobile || isTablet}
    TransitionComponent={CustomDialogTransition}
    maxWidth={"md"} open={true}>
    <Formik innerRef={ref} initialValues={initialValues} validationSchema={FieldSchema} onSubmit={handleSave} validate={validate}>
      {({ submitForm, touched, errors, setFieldValue, values }) => (
        <Fragment>
          <CustomDialogHeader title={fieldData ? "Update Field" : "Add Field"} onClose={handleClose}></CustomDialogHeader>
          <CustomDialogContent>
            <Form autoComplete="off" autoCorrect="off" noValidate onKeyPress={onKeyPress} >
              {refrence === "builder" &&
                <FormControl fullWidth margin="dense" variant="outlined" error={touched["sectionName"] && Boolean(errors["sectionName"])}>
                  <InputLabel id="demo-simple-select-outlined-label">Section Name</InputLabel>
                  <Select
                    labelId="demo-simple-select-outlined-label"
                    id="demo-simple-select-outlined"
                    value={values["sectionName"]}
                    onChange={(e) => setFieldValue("sectionName", e.target.value)}
                    label="Section Name"
                    name="sectionName"
                  >
                    {section && section.map((_section) => (
                      <MenuItem value={_section}>{_section}</MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>{errors["sectionName"]}</FormHelperText>
                </FormControl>
              }
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
                  <MenuItem value={"dropDown"}>Dropdown</MenuItem>
                  <MenuItem value={"vlookupDropdown"}>Vlookup Dropdown</MenuItem>
                  <MenuItem value={"converter"}>Converter</MenuItem>
                  <MenuItem value={"currencyAmount"}>Currency Amount</MenuItem>
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

              {(values["type"] === "decimal" || values["type"] === "formula" || values["type"] === "converter") &&
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
                  {(values["type"] === "decimal" || values["type"] === "converter" || values["returnType"] === "decimal") &&
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


              {values["type"] === "currencyAmount" && <Currency
                values={values}
                setFieldValue={setFieldValue}
                refrence={refrence}
              />}

              {(values["type"] === "currencyAmount" || values["type"] === "percent") &&
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isFormula"
                      checked={values["isFormula"]}
                      onChange={(e) => {
                        setFieldValue("isFormula", e.target.checked)
                      }}
                      color="primary"
                    />
                  }
                  label="Formula"
                />}

              {(values["type"] === "formula" || values["isFormula"]) && <Formula
                fields={new_fields}
                values={values}
                setFieldValue={setFieldValue}
                _id={fieldData && fieldData._id ? fieldData._id : ""}
              />}

              {values["type"] === "vlookupDropdown" &&
                <Vlookup
                  fields={new_fields}
                  values={values}
                  setFieldValue={setFieldValue}
                  _id={fieldData && fieldData._id ? fieldData._id : ""}
                />}

              {(values["type"] === "currencyAmount" || values["type"] === "decimal") &&
                <Fragment>
                  <br></br>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isConverter"
                        checked={values["isConverter"]}
                        onChange={(e) => {
                          setFieldValue("isConverter", e.target.checked)
                        }}
                        color="primary"
                      />
                    }
                    label="Converter"
                  />
                </Fragment>
              }
              {(values["type"] === "converter" || values["isConverter"]) && <Converter
                fields={new_fields}
                values={values}
                setFieldValue={setFieldValue}
              />}

              {((values["type"] === "dropDown" || values["type"] === "multiSelect" || values["type"] === "radio" || values["type"] === "process") && !values["lookup"]) &&
                <Option
                  values={values}
                  setFieldValue={setFieldValue}
                  fields={new_fields}
                  _id={fieldData && fieldData._id ? fieldData._id : ""}
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
            </Form>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button size="small" onClick={handleClose} color="primary">Cancel</Button>
            <Button size="small" type="submit" color="primary" onClick={submitForm} variant="contained">{fieldData ? "Update" : "Add"}</Button>
          </CustomDialogFooter>
        </Fragment>
      )}
    </Formik>
  </Dialog>
  );
}