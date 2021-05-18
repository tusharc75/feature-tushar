import React, { useState, useEffect } from "react";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { GetUsers } from "../../../axios/activity";
import Chip from "@material-ui/core/Chip";
import PropTypes from "prop-types";
var _ = require("lodash");

export const UserDropdown = ({
  name,
  label,
  value,
  multiple,
  touched,
  errors,
  setFieldValue,
  required,
}) => {
  const [users, setUsers] = React.useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    await GetUsers()
      .then(({ data }) => {
        let userData = [];
        for (var _user of data) {
          userData.push({
            userId: _user._id,
            name: _user.firstName + " " + _user.lastName,
          });
        }
        setUsers(userData);
      })
      .catch((err) => {});
  };

  const setParticipants = (value) => {
    let content: any = "";
    if (value) {
      if (multiple == true) {
        let userIdList = [];
        for (var val of value) {
          userIdList.push({ userId: val.userId });
        }
        content = userIdList;
      } else {
        content = value.userId;
      }
    }
    setFieldValue(name, content);
  };

  return (
    <Autocomplete
      multiple={multiple}
      options={users ? users : []}
      getOptionLabel={(option) => (option ? option.name : "")}
      filterSelectedOptions={false}
      onChange={(e, value) => setParticipants(value)}
      value={
        users && multiple === true
          ? users.filter((data) =>
              _.flatMap(value, (nameObj) =>
                _.map(nameObj, (userId) => {
                  return userId;
                })
              ).includes(data.userId)
            )
          : users
          ? users.filter((data) => data.userId === value).length > 0
            ? users.filter((data) => data.userId === value)[0]
            : []
          : []
      }
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            variant="outlined"
            label={option && option.name}
            {...getTagProps({ index })}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label={label}
          placeholder={label}
          error={touched[name] && Boolean(errors[name])}
          helperText={touched[name] && errors[name]}
          margin="dense"
          required={required}
        />
      )}
    />
  );
};

UserDropdown.propTypes = {
  name: PropTypes.any,
  label: PropTypes.any,
  value: PropTypes.any,
  multiple: PropTypes.any,
  touched: PropTypes.any,
  errors: PropTypes.any,
  setFieldValue: PropTypes.any,
};
