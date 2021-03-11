import React, { Fragment, useState } from "react";
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';


export const AutocompleteField = ({
    input,
    label,
    //meta: { touched, error },
    options,
    variant,
    margin,
    ...custom
  }) => {
    var select_list = {};
    // if (input.value == "") {
    //   select_list = {}
    // }
    // else if (typeof input.value == "string") {
    //   select_list = options.filter(i => i.value == input.value)
    //   if (select_list.length > 0) {
    //     select_list = select_list[0]
    //   }
    // }
    return (
      <Autocomplete
        options={options}
        getOptionLabel={option => option.label}
        style={{ width: "100%" }}
        renderInput={params => (
          <TextField
            {...params}
            label={label}
            variant={variant}
            margin={margin}
            fullWidth
            // error={Boolean(touched && error)}
            // helperText={touched && error}
            {...input}
            onBlur={() => { }}
          />
        )}
        value={select_list}
        onChange={(event, value) => input.onChange(value)}
        {...custom}
      >
      </Autocomplete >
    )
  };