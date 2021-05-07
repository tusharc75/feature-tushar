import React, { useState, Fragment, useRef } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import FieldList from '../FieldList';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { camelCase } from "./../../../constants/helpers";
import { Vlokup } from "../AddField/vlokup";
import { Formula } from "../AddField/formula";
import { Converter } from "../AddField/converter";
import { Option } from "../AddField/option";

const FieldSchema = Yup.object().shape({
  fieldLabel: Yup.string()
    .required("please enter field label"),
});

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

export const Properties = ({ handleClose, fieldData, sectionId, section, setSection }) => {

  const [initialValues, setInitialValues] = useState(fieldData);

  const fields = [];
  section.forEach(_section => {
    _section.field.forEach(_field => {
      let fid = { ..._field }
      if (!fid.fieldName) {
        fid.fieldName = camelCase(fid.fieldLabel.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ''));
      }
      if (fid._id.toString() !== fieldData._id.toString()) {
        if (fid.type === "converter") {
          fid.displayUnits && fid.displayUnits.forEach(_unit => {
            fields.push({ ...fid, fieldLabel: fid.fieldLabel + " " + _unit, fieldName: fid.fieldName + _unit.toLowerCase() })
          })
        }
        else {
          fields.push(fid)
        }
      }
    })
  })


  const handleSave = (values) => {
    let data = [...section]
    data.forEach((row) => {
      if (row.sectionId.toString() === sectionId.toString()) {
        row.field.forEach((ele) => {
          if (ele._id.toString() === fieldData._id.toString()) {
            ele.fieldLabel = values.fieldLabel
            ele.required = values.required
            ele.isTooltip = values.isTooltip
            ele.tooltipMessage = values.tooltipMessage

            if (fieldData.type === "dropDown" || fieldData.type === "multiSelect" || fieldData.type === "radio" || fieldData.type === "process") {
              values.option.forEach((ele, index) => {
                ele.order = index + 1
                ele.default = false
                if (index === 0) {
                  ele.default = true
                }
              })
              ele.option = values.option
            }
            if (fieldData.type === "decimal") {
              ele.decimalPlaces = values.decimalPlaces
            }
            if (values.lookup) {
              ele.lookup = values.lookup
              ele.lookupResource = values.lookupResource
            }
            if (fieldData.type === "formula") {
              ele.formula = values.formula
              ele.inputFields = values.inputFields
              ele.returnType = values.returnType
              ele.decimalPlaces = values.decimalPlaces
            }
            if (fieldData.type === "vlookupDropdown") {
              values.option.forEach((ele) => {
                ele.optionValue = ele.optionLabel
              })
              ele.inputFields = values.inputFields
              ele.option = values.option
              ele.isvlookupReverse = values.isvlookupReverse
            }
            if (fieldData.type === "converter") {
              ele.units = values.units
              ele.displayUnits = values.displayUnits
              ele.option = values.option
            }
          }
        })
      }
    });
    setSection(data)
    handleClose()
  }

  return (<Dialog aria-labelledby="customized-dialog-title" fullWidth maxWidth={initialValues["type"] === "formula" ||
    initialValues["type"] === "vlookupDropdown" || initialValues["type"] === "converter" ? "md" : "sm"} open={true}>
    <Formik initialValues={initialValues} validationSchema={FieldSchema} onSubmit={handleSave}>
      {({ submitForm, touched, errors, setFieldValue, values }) => (
        <Form autoComplete="off" autoCorrect="off" noValidate >
          <CustomDialogHeader title={`${FieldList[fieldData.type.toUpperCase()].label} Properties`} onClose={handleClose}></CustomDialogHeader>
          <CustomDialogContent>
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
            {(values["type"] === "dropDown" || values["type"] === "multiSelect") &&
              <Fragment>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="lookup"
                      checked={values["lookup"]}
                      onChange={(e) => setFieldValue("lookup", e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Lookup"
                />
                {values["lookup"] &&
                  <Box pt={1} pb={1}>
                    <FormControl fullWidth margin="dense" variant="outlined">
                      <InputLabel id="demo-simple-select-outlined-label">Lookup Resource</InputLabel>
                      <Select
                        labelId="demo-simple-select-outlined-label"
                        id="demo-simple-select-outlined"
                        value={values["lookupResource"]}
                        onChange={(e) => setFieldValue("lookupResource", e.target.value)}
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


            {((values["type"] === "dropDown" || values["type"] === "multiSelect" || values["type"] === "radio" || values["type"] === "process") && !values["lookup"]) &&
              <Option
                values={values}
                setFieldValue={setFieldValue}
              />}

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
            <Button type="submit" color="primary" variant="contained">Save</Button>
          </CustomDialogFooter>
        </Form>)}
    </Formik>
  </Dialog>
  );
}