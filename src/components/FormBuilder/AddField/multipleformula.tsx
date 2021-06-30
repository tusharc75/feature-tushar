import React, { useState, useRef } from "react";
import TextField from "@material-ui/core/TextField";
import Box from "@material-ui/core/Box";
import FormControl from "@material-ui/core/FormControl";
import Chip from "@material-ui/core/Chip";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { startCase } from "lodash";

export const MultipleFormula = ({ fields, values, setFieldValue, _id }) => {
  let inputRef = useRef([]);
  const [isMyInputFocused, setIsMyInputFocused] = useState(null);

  const onChangeValue = (index, fieldName, value) => {
    let data = values["formulaoption"] ? values["formulaoption"] : {};
    data[fieldName] = value;
    setFieldValue("formulaoption", data);
  };

  const handleAddInputField = (field) => {
    if (isMyInputFocused || isMyInputFocused === 0) {
      let pushPosition =
        inputRef.current[isMyInputFocused].current.selectionStart;
      let fieldName = inputRef.current[isMyInputFocused].current.name;
      let data = values["formulaoption"] ? values["formulaoption"] : {};
      if (!data[fieldName]) {
        data[fieldName] = "";
      }
      data[fieldName] = [
        data[fieldName].slice(0, pushPosition),
        field,
        data[fieldName].slice(pushPosition),
      ].join("");
      setFieldValue("formulaoption", data);
      inputRef.current[isMyInputFocused].current.focus();
    }
  };

  const convertLabeltoValue = (value) => {
    const result = [];
    value.forEach((_v) => {
      if (
        fields.filter((data) => data.fieldLabel === _v || data.fieldName === _v)
          .length
      ) {
        result.push(
          fields.filter(
            (data) => data.fieldLabel === _v || data.fieldName === _v
          )[0].fieldName
        );
      } else {
        result.push(_v);
      }
    });
    return result;
  };

  const convertValuetoLabel = (value) => {
    const result = [];
    value.forEach((_v) => {
      if (fields.filter((data) => data.fieldName === _v).length) {
        result.push(
          fields.filter(
            (data) => data.fieldLabel === _v || data.fieldName === _v
          )[0].fieldLabel
        );
      } else {
        result.push(_v);
      }
    });
    return result;
  };

  if (values["formulaFields"] && values["formulaFields"].length) {
    inputRef.current =
      values["formulaFields"] &&
      values["formulaFields"].map(
        (_field, index) => (inputRef.current[index] = React.createRef())
      );
  }

  const generateLabel = (label) => {
    const data = fields?.find((d) => d.fieldName === label);
    return `${data.fieldLabel} - ${label}`;
  };

  return (
    <Box>
      <FormControl variant="outlined" fullWidth margin="dense">
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
          getOptionLabel={(option) => option}
          value={
            values["formulaFields"]
              ? convertValuetoLabel(values["formulaFields"])
              : []
          }
          freeSolo
          renderTags={(value: string[], getTagProps) =>
            value.map((option: string, index: number) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
              />
            ))
          }
          onChange={(e, value) =>
            setFieldValue("formulaFields", convertLabeltoValue(value))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              margin="dense"
              variant="outlined"
              label="Formula Fields"
              placeholder="Formula Fields"
            />
          )}
        />
      </FormControl>
      <FormControl variant="outlined" fullWidth margin="dense">
        <Autocomplete
          multiple
          disableCloseOnSelect={true}
          id="tags-filled"
          options={
            fields &&
            fields.map((_field) => {
              return _field.fieldLabel;
            })
          }
          getOptionLabel={(option) => option}
          value={
            values["formulainputFields"]
              ? convertValuetoLabel(values["formulainputFields"])
              : []
          }
          freeSolo
          renderTags={(value: string[], getTagProps) =>
            value.map((option: string, index: number) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
              />
            ))
          }
          onChange={(e, value) =>
            setFieldValue("formulainputFields", convertLabeltoValue(value))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              margin="dense"
              variant="outlined"
              label="Input Parameters"
              placeholder="Input Parameters"
            />
          )}
        />
      </FormControl>
      {values["formulainputFields"] && values["formulainputFields"].length > 0 && (
        <Box pt={0.5} pb={0.5}>
          {values["formulainputFields"].map((_field) => (
            <Chip
              className="ml-1 cursor-pointer"
              key={_field}
              label={generateLabel(_field)}
              onClick={() => handleAddInputField(_field)}
            />
          ))}
        </Box>
      )}
      {values["formulaFields"] && values["formulaFields"].length > 0 && (
        <Box
          marginTop={1}
          border={1}
          p={1}
          borderColor="grey.300"
          maxHeight={300}
          style={{ overflow: "auto" }}
        >
          <table style={{ width: "100%" }}>
            <tbody>
              {values["formulaFields"] &&
                values["formulaFields"].map((_field, i) => (
                  <tr key={i}>
                    <td
                      className="pt-2"
                      style={{ paddingRight: 10, width: "50px" }}
                    >
                      {_field}
                    </td>
                    <td className="pt-2">
                      <TextField
                        id="standard-basic"
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Formula (return field1 + field2)"
                        style={{ margin: 0 }}
                        name={_field}
                        inputRef={inputRef.current[i]}
                        //onBlur={() => setIsMyInputFocused(null)}
                        onFocus={() => setIsMyInputFocused(i)}
                        onKeyPress={(event) => {
                          event.stopPropagation();
                        }}
                        value={
                          values["formulaoption"] &&
                          values["formulaoption"][_field] &&
                          values["formulaoption"][_field]
                        }
                        onChange={(event) =>
                          onChangeValue(i, _field, event.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Box>
      )}
    </Box>
  );
};
