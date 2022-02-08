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
import ActivityModelHandler from "../ActivityModelHandler";
import {isMobile, isTablet} from "react-device-detect";

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
  activityName,
  permissions
}) => {
  const { state: { user: { user }, }, } = useData();
  const [options, setOptions] = React.useState([]);
  const [inputValue, setInputValue] = React.useState("");
  const [value, setValue] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedActivityId, setSelectedActivityId] = React.useState(null);
  const [selectedActivityType, setSelectedActivityType] = React.useState(null);

  const allSearch = [
    { type: "customerAccount", name: "All", isAll: true },
    { type: "customerContact", name: "All", isAll: true },
    { type: "supplierAccount", name: "All", isAll: true },
    { type: "supplierContact", name: "All", isAll: true },
    { type: "lead", name: "All", isAll: true },
    { type: "opportunity", name: "All", isAll: true },
    { type: "quote", name: "All", isAll: true },
    { type: "projectSales", name: "All", isAll: true },
    { type: "rentalManagement", name: "All", isAll: true },
    { type: "repairJob", name: "All", isAll: true },
    { type: "transferAsset", name: "All", isAll: true },
    { type: "purchaseOrder", name: "All", isAll: true },
    { type: "deliveryTicket", name: "All", isAll: true },
    { type: "my", name: user?._id, isAll: true },
  ];


  let permissionsSearch =  allSearch.filter((item) => permissions[item.type]?.isRead === true)

  

  const activityType = ["task", "event", "case", "note", "email", "attachment"]

  useEffect(() => {
    setValue(filter.filter(d => permissionsSearch.some(f => f.type === d.type)));
  }, [filter]);

  useEffect(() => {
    if (inputValue === "") {
      let filteredSearch = dontShowMyActivity ? permissionsSearch .filter((_o) => _o.type !== "my") : permissionsSearch ; setOptions(filteredSearch);
    } else {
      setLoading(true);
      let _activityName = activityName;
      if (_activityName === "calendar") {
        _activityName = "task,event,case"
      }
      SearchActivity(inputValue, _activityName)
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
    let filterActivity = newValue.slice().reverse().find(d => activityType.includes(d.type))
    if (filterActivity) {
      setSelectedActivityId(filterActivity._id)
      setSelectedActivityType(filterActivity.type)
    }
    setValue(newValue.filter(d => permissionsSearch.some(f => f.type === d.type)));
    handleChangeFilter(newValue.filter(d => permissionsSearch.some(f => f.type === d.type)));
  };

  return (
    <>
      <Autocomplete
        multiple={true}
        disableCloseOnSelect={true}
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
            isMobile && !isTablet ?    <TextField
                    {...params}
                    size="small"
                    variant="standard"
                    placeholder="Search or Filter"
                    className= {isMobile ? "serchBox" : "" }
                    InputProps={{
                      ...params.InputProps,
                      disableUnderline: true,
                      endAdornment: (
                          <React.Fragment>
                            {loading ? (
                                <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </React.Fragment>
                      ),
                    }}
                /> :

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
      {selectedActivityId && (
        <ActivityModelHandler
          setActivityData={setSelectedActivityId}
          activityType={selectedActivityType}
          fetchBoard={() => { }}
          activityId={selectedActivityId}
        />
      )}
    </>
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
