import { useState, useEffect, Fragment, FormEvent } from "react";
import PropTypes from "prop-types";
import { TextField, Chip } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { flatMap, map } from "lodash";

import axiosInstance from "../../../axios/axiosInstance";
import { useData } from "../../../StateProvider/Provider";

export const UserDropdown = ({
  email,
  name,
  label,
  value,
  multiple,
  touched,
  errors,
  setFieldValue,
  required,
}) => {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    await axiosInstance()
      .get("/activity/user")
      .then(({ data: { data } }) => {
        let userData = data.map((_user) => ({
          userId: _user._id,
          name: _user.firstName + " " + _user.lastName,
        }));

        if (Array.isArray(value) && value.length) {
          let filteredOptions = value.filter(
            (val) => userData.filter((u) => val.userId === u.userId).length <= 0
          );

          filteredOptions = filteredOptions.map((user) => ({
            userId: user.userId,
            name: user.userId,
          }));

          setUsers([...userData, ...filteredOptions, ...email]);
        } else {
          setUsers(userData);
        }
      })
      .catch((err) => { });
  };

  const setParticipants = (values, reason) => {
    if (values) {
      if (multiple === true) {
        if (reason === "clear" || reason === "clear-option") {
          setFieldValue(name, []);
        }

        if (reason === "remove-option") {
          if (value.length === 1) {
            setFieldValue(name, []);
          }
        }

        values.forEach((val: any) => {
          if (typeof val === "string") {
            if (val && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(val)) {
              setUsers([
                ...users,
                {
                  userId: val,
                  name: val,
                },
              ]);
              setFieldValue(name, [...value, { userId: val }]);
            }
          } else if (val && val.inputValue) {
            setUsers([
              ...users,
              {
                userId: val.inputValue,
                name: val.inputValue,
              },
            ]);
            setFieldValue(name, [...value, { userId: val.inputValue }]);
          } else {
            const nValues = [];
            values.forEach((val) => {
              if (typeof val !== "string") {
                nValues.push({ userId: val.userId });
              }
            });

            setFieldValue(name, nValues);
          }
        });
      } else {
        setFieldValue(name, values.userId);
      }
    }
  };

  return (
    <Fragment>
      <Autocomplete
        multiple={multiple}
        disableCloseOnSelect={multiple}
        options={users ? users : []}
        getOptionLabel={(option) => {
          if (typeof option === "string") {
            return option;
          }

          if (!Array.isArray(option)) {
            return option.name;
          }

          return "";
        }}
        freeSolo
        limitTags={5}
        getOptionSelected={(opt, val) => {
          return opt.userId === val.userId;
        }}
        filterSelectedOptions={false}
        onChange={(e, value, reason) => setParticipants(value, reason)}
        value={
          users && multiple === true
            ? users.filter((data) =>
              flatMap(value, (nameObj) =>
                map(nameObj, (userId) => {
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
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            margin="dense"
            required={required}
          />
        )}
      />
    </Fragment>
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
  requied: PropTypes.any,
  email: PropTypes.any,
};
