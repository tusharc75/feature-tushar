import React, {
  useState,
  Fragment,
  useRef,
  useEffect,
  useContext,
} from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import FieldList from "../FieldList";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { camelCase } from "./../../../constants/helpers";
import { Vlookup } from "../AddField/vlookup";
import { Formula } from "../AddField/formula";
import { Converter } from "../AddField/converter";
import { Option } from "../AddField/option";
import { Currency } from "../AddField/currency";
import { DecimalPlaces } from "../AddField/decimalPlaces";
import { MultipleFormula } from "../AddField/multipleformula";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "../../../constants/helpers";
import { Autocomplete } from "@material-ui/lab";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import FormTypes from "../../Helpers/FormTypes";

const FieldSchema = Yup.object().shape({
  fieldLabel: Yup.string().required("please enter field label"),
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
  { name: "Product Category", value: "Product Category" },
  { name: "Product Template", value: "Product Template" },
  { name: "Price Template", value: "Price Template" },
];

export const Properties = ({
  module,
  handleClose,
  fieldData,
  sectionId,
  section,
  setSection,
  extraFields,
}) => {
  const [initialValues, setInitialValues] = useState(fieldData);
  const [isImgUploading, setImgUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const { setToastConfig } = useContext(CustomToastContext);

  //const [isChangeFieldName, setIsChangeFieldName] = useState(true);

  useEffect(() => {
    if (fieldData.type === "dropDown" && !fieldData.lookup) {
      if (
        fieldData.option &&
        fieldData.option.filter((data) => data.default === true).length
      ) {
        setInitialValues({
          ...initialValues,
          defaultDropdownOption: fieldData.option.filter(
            (data) => data.default === true
          )[0].optionValue,
        });
      }
    }
  }, []);

  useEffect(() => {
    if (initialValues) {
      const values = initialValues;

      if (!values.hiddenField) {
        values.hiddenField = false;
      }

      if (values.type === "process") {
        if (!values.showAdditionalInfoPopup) {
          values.showAdditionalInfoPopup = false;
        }

        if (!values.additionalInfoSection) {
          values.additionalInfoSection = "";
        }

        setInitialValues(values);
      }
    }
  }, [fieldData]);

  const fields = [];
  if (module === "product-template" || module === "price-template") {
    if (extraFields) {
      extraFields.forEach((_f) => {
        fields.push(_f);
      });
    }
  }

  section.forEach((_section) => {
    _section.field.forEach((_field) => {
      let ele = { ..._field };
      if (!ele.fieldName) {
        ele.fieldName = camelCase(
          ele.fieldLabel.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
        );
      }
      if (
        ele.type === "converter" ||
        ele.type === "currencyAmount" ||
        ele.isConverter === true
      ) {
        if (
          ele.type !== "currencyAmount" &&
          (ele.type === "converter" || ele.isConverter === true)
        ) {
          ele.displayUnits &&
            ele.displayUnits.forEach((_unit) => {
              fields.push({
                ...ele,
                fieldLabel: ele.fieldLabel + " (" + _unit + ")",
                fieldName: ele.fieldName + "_" + _unit.toLowerCase(),
              });
            });
        } else if (
          ele.type === "currencyAmount" &&
          (ele.type === "converter" || ele.isConverter === true)
        ) {
          ele.displayCurrency &&
            ele.displayCurrency.forEach((_currency) => {
              ele.displayUnits &&
                ele.displayUnits.forEach((_unit) => {
                  fields.push({
                    ...ele,
                    fieldLabel:
                      ele.fieldLabel + " (" + _currency + "/" + _unit + ")",
                    fieldName:
                      ele.fieldName +
                      "_" +
                      _currency.toLowerCase() +
                      "_" +
                      _unit.toLowerCase(),
                  });
                });
            });
        } else if (ele.type === "currencyAmount") {
          ele.displayCurrency &&
            ele.displayCurrency.forEach((_currency) => {
              fields.push({
                ...ele,
                fieldLabel: ele.fieldLabel + " (" + _currency + ")",
                fieldName: ele.fieldName + "_" + _currency.toLowerCase(),
              });
            });
        }
      } else {
        fields.push(ele);
      }
    });
  });

  const handleSave = (values) => {
    let data = [...section];
    data.forEach((row) => {
      if (row.sectionId.toString() === sectionId.toString()) {
        row.field.forEach((ele) => {
          if (ele._id.toString() === fieldData._id.toString()) {
            ele.fieldLabel = values.fieldLabel;
            ele.required = values.required;
            ele.isTooltip = values.isTooltip;
            ele.tooltipMessage = values.tooltipMessage;
            ele.isConverter = values.isConverter;
            ele.isFormula = values.isFormula;
            ele.isMulitFormula = values.isMulitFormula;
            ele.isUneditable = values.isUneditable;
            ele.isVlookup = values.isVlookup;
            ele.hiddenField = values.hiddenField;
            ele.showAdditionalInfoPopup = values.showAdditionalInfoPopup;
            ele.additionalInfoSection = values.additionalInfoSection;

            // if (isChangeFieldName && values["editAble"] && (module === "product-template" || module === "price-template")) {
            //   ele.fieldName = camelCase(ele.fieldLabel.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ''))
            // }

            if (
              fieldData.type === "dropDown" ||
              fieldData.type === "multiSelect" ||
              fieldData.type === "radio" ||
              fieldData.type === "process"
            ) {
              if (fieldData.type === "dropDown") {
                ele.isDependentDropdown = values.isDependentDropdown;
                ele.dropdowDependentOn = values.dropdowDependentOn;
              }
              values.option.forEach((ele, index) => {
                ele.order = index + 1;
                ele.default = false;
                if (fieldData.type === "dropDown" && !values["lookup"]) {
                  if (
                    values["defaultDropdownOption"] &&
                    values["defaultDropdownOption"] !== ""
                  ) {
                    if (values["defaultDropdownOption"] === ele.optionLabel) {
                      ele.default = true;
                    }
                  }
                }
              });
              ele.option = values.option.map((item, idx) => ({
                ...item,
                order: idx + 1,
              }));
            }
            if (
              fieldData.type === "decimal" ||
              fieldData.type === "converter" ||
              fieldData.type === "currencyAmount"
            ) {
              ele.decimalPlaces = values.decimalPlaces;
            }
            if (values.lookup) {
              ele.lookup = values.lookup;
              ele.lookupResource = values.lookupResource;
            }
            if (fieldData.type === "formula" || values.isFormula === true) {
              ele.formula = values.formula;
              ele.inputFields = values.inputFields;
              ele.returnType = values.returnType
                ? values.returnType
                : "decimal";
              ele.decimalPlaces = values.decimalPlaces
                ? values.decimalPlaces
                : 2;
            }
            if (fieldData.type === "vlookupDropdown" || fieldData.isVlookup) {
              values.option.forEach((ele) => {
                ele.optionValue = ele.optionLabel;
              });
              ele.inputFields = values.inputFields;
              ele.option = values.option;
              ele.isvlookupReverse = values.isvlookupReverse;
            }
            if (
              fieldData.type === "converter" ||
              fieldData.isConverter === true
            ) {
              ele.units = values.units;
              ele.displayUnits = values.displayUnits;
              ele.option = values.option;
              if (fieldData.type === "formula" || values.isFormula === true) {
                ele.formulaOnConverter = values.formulaOnConverter;
              }
            }
            if (fieldData.type === "currencyAmount") {
              delete ele.currency;
              ele.displayCurrency = values.displayCurrency;
              if (fieldData.type === "formula" || values.isFormula === true) {
                ele.formulaOnCurrency = values.formulaOnCurrency;
              }
            }
            if (fieldData.isMulitFormula) {
              ele.formulaFields = values.formulaFields;
              ele.formulainputFields = values.formulainputFields;
              ele.formulaoption = values.formulaoption;
            }
            ele.isDefaultValue = values.isDefaultValue
              ? values.isDefaultValue
              : false;
            ele.defaultValue = "";
            if (ele.isDefaultValue) {
              ele.defaultValue = values.defaultValue;
            }
          }
        });
      }
    });
    setSection(data);
    handleClose();
  };

  const onKeyPress = (event) => {
    if (event.which === 13) {
      event.preventDefault();
    }
  };

  return (
    <Dialog
      fullScreen={isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      fullWidth
      maxWidth={"md"}
      open={true}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={FieldSchema}
        onSubmit={handleSave}
      >
        {({ submitForm, touched, errors, setFieldValue, values }) => (
          <Form
            autoComplete="off"
            autoCorrect="off"
            noValidate
            onKeyPress={onKeyPress}
          >
            <CustomDialogHeader
              title={`${
                FieldList[fieldData.type.toUpperCase()].label
              } Properties`}
              onClose={handleClose}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <TextField
                variant="outlined"
                type="text"
                label="Field Label"
                required={true}
                name="fieldLabel"
                fullWidth
                margin="dense"
                //disabled={!values["editAble"]}
                value={values["fieldLabel"]}
                error={touched["fieldLabel"] && Boolean(errors["fieldLabel"])}
                helperText={touched["fieldLabel"] && errors["fieldLabel"]}
                onChange={(e) =>
                  setFieldValue("fieldLabel", e.target.value.trimStart())
                }
              />
              {/* {((module === "product-template" || module === "price-template") && values["editAble"]) &&
              <Box display="flex" >
                <Box mb={1}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isChangeFieldName"
                        checked={isChangeFieldName}
                        onChange={(e) => setIsChangeFieldName(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Change Field Name"
                  />
                </Box>
              </Box>
            } */}

              {(values["type"] === "decimal" ||
                values["type"] === "formula" ||
                values["type"] === "converter") && (
                <Grid spacing={3} container>
                  {values["type"] === "formula" && (
                    <Grid item xs={12} sm={6} md={6}>
                      <FormControl fullWidth margin="dense" variant="outlined">
                        <InputLabel id="demo-simple-select-outlined-label">
                          Return Type
                        </InputLabel>
                        <Select
                          labelId="demo-simple-select-outlined-label"
                          id="demo-simple-select-outlined"
                          value={values["returnType"]}
                          onChange={(e) =>
                            setFieldValue("returnType", e.target.value)
                          }
                          label="Return Type"
                          name="returnType"
                        >
                          <MenuItem value="decimal">Decimal</MenuItem>
                          <MenuItem value="string">String</MenuItem>
                          <MenuItem value="boolean">Boolean</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  {(values["type"] === "decimal" ||
                    values["returnType"] === "decimal") && (
                    <Grid item xs={12} sm={6} md={6}>
                      <DecimalPlaces
                        values={values}
                        setFieldValue={setFieldValue}
                      />
                    </Grid>
                  )}
                </Grid>
              )}
              {(values["type"] === "dropDown" ||
                values["type"] === "multiSelect") && (
                <Fragment>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="lookup"
                        checked={values["lookup"]}
                        onChange={(e) =>
                          setFieldValue("lookup", e.target.checked)
                        }
                        color="primary"
                      />
                    }
                    label="Lookup"
                  />
                  {values["lookup"] && (
                    <Box pt={1} pb={1}>
                      <FormControl fullWidth margin="dense" variant="outlined">
                        <InputLabel id="demo-simple-select-outlined-label">
                          Lookup Resource
                        </InputLabel>
                        <Select
                          labelId="demo-simple-select-outlined-label"
                          id="demo-simple-select-outlined"
                          value={values["lookupResource"]}
                          onChange={(e) =>
                            setFieldValue("lookupResource", e.target.value)
                          }
                          label="Lookup Resource"
                          name="lookupResource"
                        >
                          {LookupResource.map((_data) => (
                            <MenuItem value={_data.value}>
                              {_data.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                </Fragment>
              )}

              {values["type"] === "currencyAmount" && (
                <Currency
                  values={values}
                  setFieldValue={setFieldValue}
                  refrence="form-builder"
                />
              )}
              <DndProvider backend={HTML5Backend}>
                {(values["type"] === "dropDown" ||
                  values["type"] === "multiSelect" ||
                  values["type"] === "radio" ||
                  values["type"] === "process") &&
                  !values["lookup"] && (
                    <Option
                      values={values}
                      setFieldValue={setFieldValue}
                      fields={fields}
                      _id={fieldData._id}
                    />
                  )}
              </DndProvider>
              {(values["type"] === "currencyAmount" ||
                values["type"] === "decimal" ||
                values["type"] === "percent" ||
                values["type"] === "converter") &&
                module !== "form-builder" && (
                  <>
                    <br></br>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="isFormula"
                          checked={values["isFormula"]}
                          onChange={(e) => {
                            setFieldValue("isFormula", e.target.checked);
                          }}
                          color="primary"
                        />
                      }
                      label="Formula"
                    />
                  </>
                )}
              {(values["type"] === "formula" || values["isFormula"]) && (
                <Formula
                  fields={fields}
                  values={values}
                  setFieldValue={setFieldValue}
                  _id={fieldData._id}
                />
              )}
              {values["type"] === "currencyAmount" && (
                <Fragment>
                  <br></br>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isConverter"
                        checked={values["isConverter"]}
                        onChange={(e) => {
                          setFieldValue("isConverter", e.target.checked);
                        }}
                        color="primary"
                      />
                    }
                    label="Converter"
                  />
                </Fragment>
              )}
              {(values["type"] === "converter" || values["isConverter"]) && (
                <Converter
                  fields={fields}
                  values={values}
                  setFieldValue={setFieldValue}
                />
              )}
              {(values["type"] === "currencyAmount" ||
                values["type"] === "decimal" ||
                values["type"] === "percent" ||
                values["type"] === "converter") &&
                module !== "form-builder" && (
                  <>
                    <br></br>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="isMulitFormula"
                          checked={values["isMulitFormula"]}
                          onChange={(e) => {
                            setFieldValue("isMulitFormula", e.target.checked);
                          }}
                          color="primary"
                        />
                      }
                      label="Multiple Formula"
                    />
                  </>
                )}
              {values["isMulitFormula"] && (
                <MultipleFormula
                  fields={fields}
                  values={values}
                  setFieldValue={setFieldValue}
                  _id={fieldData._id}
                />
              )}

              {(values["type"] === "currencyAmount" ||
                values["type"] === "decimal" ||
                values["type"] === "percent" ||
                values["type"] === "converter") &&
                module !== "form-builder" && (
                  <>
                    <br></br>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="isVlookup"
                          checked={values["isVlookup"]}
                          onChange={(e) => {
                            setFieldValue("isVlookup", e.target.checked);
                          }}
                          color="primary"
                        />
                      }
                      label="Vlookup"
                    />
                  </>
                )}
              {(values["isVlookup"] ||
                values["type"] === "vlookupDropdown") && (
                <Vlookup
                  fields={fields}
                  values={values}
                  setFieldValue={setFieldValue}
                  _id={fieldData._id}
                />
              )}

              <Box pt={1} pb={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="required"
                      disabled={
                        !values["editAble"] && values["required"] ? true : false
                      }
                      checked={values["required"]}
                      onChange={(e) =>
                        setFieldValue("required", e.target.checked)
                      }
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
                      onChange={(e) =>
                        setFieldValue("isTooltip", e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label="Show Tooltip"
                />
                {values["isTooltip"] && (
                  <TextField
                    variant="outlined"
                    type="text"
                    label="Tooltip Message"
                    required={true}
                    name="tooltipMessage"
                    fullWidth
                    margin="dense"
                    value={values["tooltipMessage"]}
                    error={
                      touched["tooltipMessage"] &&
                      Boolean(errors["tooltipMessage"])
                    }
                    helperText={
                      touched["tooltipMessage"] && errors["tooltipMessage"]
                    }
                    onChange={(e) =>
                      setFieldValue(
                        "tooltipMessage",
                        e.target.value.trimStart()
                      )
                    }
                  />
                )}
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isDefaultValue"
                      checked={values["isDefaultValue"]}
                      onChange={(e) =>
                        setFieldValue("isDefaultValue", e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label="Default Value"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="Uneditable"
                      checked={values["isUneditable"]}
                      onChange={(e) =>
                        setFieldValue("isUneditable", e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label="Uneditable"
                />

                {fieldData.type !== "imageUpload" &&
                values["isDefaultValue"] ? (
                  <TextField
                    variant="outlined"
                    type="text"
                    label="Default Value"
                    required={true}
                    multiline={fieldData.type === "multiLine"}
                    name="defaultValue"
                    rows={4}
                    fullWidth
                    margin="dense"
                    value={values["defaultValue"]}
                    error={
                      touched["defaultValue"] && Boolean(errors["defaultValue"])
                    }
                    helperText={
                      touched["defaultValue"] && errors["defaultValue"]
                    }
                    onChange={(e) =>
                      setFieldValue("defaultValue", e.target.value.trimStart())
                    }
                  />
                ) : (
                  <FormTypes
                    values={{ defaultValue: values["defaultValue"] }}
                    errors={errors}
                    touched={touched}
                    label={""}
                    name={"defaultValue"}
                    type={fieldData.type}
                    setFieldValue={setFieldValue}
                    isTooltip={false}
                  />
                )}
                <FormControlLabel
                  disabled={values["required"]}
                  control={
                    <Checkbox
                      name="ishiddenField"
                      checked={
                        values["required"] ? false : values["hiddenField"]
                      }
                      onChange={(e) =>
                        setFieldValue("hiddenField", e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label="Hidden Field"
                />
                {fieldData.type === "process" && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="showAdditionalInfoPopup"
                        checked={values["showAdditionalInfoPopup"]}
                        onChange={(e) =>
                          setFieldValue(
                            "showAdditionalInfoPopup",
                            e.target.checked
                          )
                        }
                        color="primary"
                      />
                    }
                    label="Show Additional Information Popup On Close"
                  />
                )}
                {values["showAdditionalInfoPopup"] && (
                  <Autocomplete
                    value={values["additionalInfoSection"]}
                    size="small"
                    options={section.map((s) => s.sectionName)}
                    getOptionLabel={(option) => option}
                    onChange={(event: any, newValue: string | null) => {
                      setFieldValue("additionalInfoSection", newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Additional Info Section"
                        variant="outlined"
                        name="additionalInfoSection"
                      />
                    )}
                  />
                )}
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button size="small" onClick={handleClose} color="primary">
                Cancel
              </Button>
              <Button
                size="small"
                type="submit"
                color="primary"
                variant="contained"
              >
                Save
              </Button>
            </CustomDialogFooter>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};
