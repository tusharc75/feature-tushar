import React, { useEffect } from "react";
import PropTypes from "prop-types";
import {
  CircularProgress,
  Grid,
  TextField,
  Typography,
  Chip,
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import { startCase } from "lodash";

import { SearchActivity } from "../../../axios/activity";
import { useData } from "../../../StateProvider/Provider";
import { resActivityColors } from "../Helpers/utils";

export const capitalize = (string) => {
  return string && typeof string === "string"
    ? string.charAt(0).toUpperCase() + string.slice(1)
    : string;
};

export const SearchFilter = ({
  handleChangeFilter,
  filter,
  chip,
  dontShowMyActivity = false,
  activityName = null,
}) => {
  const {
    state: {
      user: { user },
    },
  } = useData();
  const [options, setOptions] = React.useState([]);
  const [inputValue, setInputValue] = React.useState("");
  const [value, setValue] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const allSearch = [
    { type: "customerAccount", name: "All", isAll: true },
    { type: "customerContact", name: "All", isAll: true },
    { type: "supplierAccount", name: "All", isAll: true },
    { type: "supplierContact", name: "All", isAll: true },
    { type: "lead", name: "All", isAll: true },
    { type: "opportunity", name: "All", isAll: true },
    { type: "my", name: user?._id, isAll: true },
  ];

  useEffect(() => {
    setValue(filter);
  }, [filter]);

  useEffect(() => {
    if (inputValue === "") {
      let filteredSearch = dontShowMyActivity
        ? allSearch.filter((_o) => _o.type !== "my")
        : allSearch;
      setOptions(filteredSearch);
    } else {
      setLoading(true);
      SearchActivity(inputValue)
        .then(({ data }) => {
          setLoading(false);
          setOptions(data);
        })
        .catch((err) => {
          setLoading(false);
        });
    }
  }, [inputValue]);

  const handleChangeValue = (newValue) => {
    setValue(newValue);
    handleChangeFilter(newValue);
  };

  return (
    <Autocomplete
      multiple={true}
      size="small"
      fullWidth
      loading={loading}
      options={options}
      getOptionLabel={(option) => (option ? option.name : "")}
      filterSelectedOptions={false}
      onChange={(event, newValue) => handleChangeValue(newValue)}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            size={chip?.size || "medium"}
            color={chip?.color || "primary"}
            style={{
              backgroundColor: resActivityColors[option.type],
              color: "white",
            }}
            label={
              option && option.type === "my"
                ? activityName ? "My" + " " + startCase(activityName) : "My activities"
                : startCase(option.type) + " - " + option.name
            }
            {...getTagProps({ index })}
          />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          variant="outlined"
          placeholder="Search or Filter"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      value={value}
      renderOption={(option) => {
        return (
          <Grid container alignItems="center" spacing={3}>
            <Grid item>
              <Chip
                size={chip?.size || "medium"}
                style={{
                  backgroundColor: resActivityColors[option.type],
                  color: "white",
                }}
                label={
                  option.isAll
                    ? option.type === "my"
                      ? activityName ? "My" + " " + startCase(activityName) : "My activities"
                      : option.name + " " + startCase(option.type)
                    : startCase(option.type)
                }
              />
            </Grid>
            <Grid item xs>
              {!option.isAll && (
                <Typography variant="body2">{option.name}</Typography>
              )}
            </Grid>
          </Grid>
        );
      }}
    />
  );
};

SearchFilter.propTypes = {
  handleChangeFilter: PropTypes.func.isRequired,
  filter: PropTypes.array.isRequired,

  chip: PropTypes.shape({
    variant: PropTypes.string,
    size: PropTypes.string,
    color: PropTypes.string,
  }),
};
