import { useState, useEffect, Fragment, FormEvent } from "react";
import PropTypes from "prop-types";
import {
  TextField,
  Chip,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@material-ui/core";
import Autocomplete, {
  createFilterOptions,
} from "@material-ui/lab/Autocomplete";
import _ from "lodash";

import axiosInstance from "../../../axios/axiosInstance";
import { useData } from "../../../StateProvider/Provider";

interface UserOptionType {
  inputValue?: string;
  userId?: string;
  name?: string;
}

const filter = createFilterOptions<UserOptionType>();

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
  const {
    state: {
      user: { user },
    },
  } = useData();
  const [users, setUsers] = useState(null);
  const [open, toggleOpen] = useState(false);
  const [dialogValue, setDialogValue] = useState({
    userId: "",
    name: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleClose = () => {
    setDialogValue({
      userId: "",
      name: "",
    });
    toggleOpen(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUsers([
      ...users,
      {
        userId: dialogValue.userId,
        name: dialogValue.name,
      },
    ]);
    setFieldValue(name, [...value, { userId: dialogValue.userId }]);
    handleClose();
  };

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

          setUsers([...userData, ...filteredOptions]);
        } else {
          setUsers(userData);
        }
      })
      .catch((err) => {});
  };

  const setParticipants = (value, reason) => {
    if (value) {
      if (multiple === true) {
        if (reason === "clear" || reason === "clear-option") {
          setFieldValue(name, []);
        }

        value.forEach((val: any) => {
          if (typeof val === "string") {
            setTimeout(() => {
              toggleOpen(true);
              setDialogValue({
                userId: val,
                name: "",
              });
            });
          } else if (val && val.inputValue) {
            toggleOpen(true);
            setDialogValue({
              userId: val.inputValue,
              name: "",
            });
          } else {
            const values = [];
            value.forEach((val) => {
              if (typeof val !== "string") {
                values.push({ userId: val.userId });
              }
            });

            setFieldValue(name, values);
          }
        });
      } else {
        setFieldValue(name, value.userId);
      }
    }
  };

  return (
    <Fragment>
      <Autocomplete
        multiple={multiple}
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
        filterOptions={(option, params) => {
          const filtered = filter(option, params) as UserOptionType[];

          if (params.inputValue !== "") {
            filtered.push({
              inputValue: params.inputValue,
              name: `Add "${params.inputValue}"`,
            });
          }
          return filtered;
        }}
        getOptionSelected={(opt, val) => {
          return opt.userId === val.userId;
        }}
        filterSelectedOptions={false}
        onChange={(e, value, reason) => setParticipants(value, reason)}
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
            error={touched[name] && Boolean(errors[name])}
            helperText={touched[name] && errors[name]}
            margin="dense"
            required={required}
          />
        )}
      />

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle style={{ color: "white" }}>
            Add a new participant
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please fill participant's email and name
            </DialogContentText>
            <TextField
              required
              autoFocus
              margin="dense"
              value={dialogValue.userId}
              onChange={(event) =>
                setDialogValue({ ...dialogValue, userId: event.target.value })
              }
              label="Participant Email"
              type="email"
            />
            <Box component="span" mx={1} />
            <TextField
              required
              margin="dense"
              value={dialogValue.name}
              onChange={(event) =>
                setDialogValue({ ...dialogValue, name: event.target.value })
              }
              label="Participant Name"
              type="text"
            />
          </DialogContent>
          <DialogActions>
            <Button size="small" onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button size="small" type="submit" color="primary">
              Add
            </Button>
          </DialogActions>
        </form>
      </Dialog>
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
};
