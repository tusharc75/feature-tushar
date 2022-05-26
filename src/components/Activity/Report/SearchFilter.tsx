import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress, Grid, TextField, Typography, Chip } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { startCase } from 'lodash';
import { SearchActivity } from '../../../axios/activity';
import { useData } from '../../../StateProvider/Provider';
import { resActivityColors, resActivityTextColors } from '../Helpers/utils';
import ActivityModelHandler from '../ActivityModelHandler';
import { isMobile, isTablet } from 'react-device-detect';
import { get_activity_resource } from '../Helpers/utils';
import routes from '../../Helpers/Routes';

export const capitalize = (string) => {
  return string && typeof string === 'string' ? string.charAt(0).toUpperCase() + string.slice(1) : string;
};

export const SearchFilter = ({ handleChangeFilter, filter, chip, dontShowMyActivity = false, activityName }) => {
  const {
    state: {
      user: { user },
      permissions
    }
  } = useData();
  const [options, setOptions] = React.useState([]);
  const [inputValue, setInputValue] = React.useState('');
  const [value, setValue] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedActivityId, setSelectedActivityId] = React.useState(null);
  const [selectedActivityType, setSelectedActivityType] = React.useState(null);
  const [permissionsSearch, setPermissionsSearch] = React.useState([]);

  useEffect(() => {
    const resourceOptions = get_activity_resource(permissions);
    const data = [];
    resourceOptions.forEach((ele) => {
      data.push({ label: ele.optionLabel, type: ele.optionValue, name: 'All', isAll: true });
    });
    data.push({ label: 'my', type: 'my', name: user?._id, isAll: true });
    setPermissionsSearch(data);
  }, []);

  const activityType = ['task', 'event', 'case', 'note', 'email', 'attachment'];

  useEffect(() => {
    filter?.forEach((e) => {
      e.label = routes[e.type] ? routes[e.type].title : e.type;
    });
    setValue(filter.filter((d) => permissionsSearch?.some((f) => f.type === d.type)));
  }, [filter, permissionsSearch]);

  useEffect(() => {
    if (inputValue === '') {
      let filteredSearch = dontShowMyActivity ? permissionsSearch?.filter((_o) => _o.type !== 'my') : permissionsSearch;
      setOptions(filteredSearch);
    } else {
      setLoading(true);
      let _activityName = activityName;
      if (_activityName === 'calendar') {
        _activityName = 'task,event,case';
      }
      SearchActivity(inputValue, _activityName)
        .then(({ data }) => {
          setLoading(false);
          data?.forEach((e) => {
            e.label = routes[e.type] && routes[e.type]?.title ? routes[e.type]?.title : e.type;
          });
          setOptions(data);
        })
        .catch((err) => {
          setLoading(false);
        });
    }
  }, [inputValue, permissionsSearch]);

  const handleChangeValue = (newValue) => {
    let filterActivity = newValue
      .slice()
      .reverse()
      .find((d) => activityType.includes(d.type));
    if (filterActivity) {
      setSelectedActivityId(filterActivity._id);
      setSelectedActivityType(filterActivity.type);
    }
    setValue(newValue.filter((d) => permissionsSearch?.some((f) => f.type === d.type)));
    handleChangeFilter(newValue.filter((d) => permissionsSearch?.some((f) => f.type === d.type)));
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
        getOptionLabel={(option) => (option ? option.name : '')}
        filterSelectedOptions={false}
        onChange={(event, newValue) => handleChangeValue(newValue)}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              size={chip?.size || 'medium'}
              color={chip?.color || 'primary'}
              style={{
                backgroundColor: resActivityColors[option.type],
                color: resActivityTextColors[option.type]
              }}
              label={
                option && option.type === 'my'
                  ? activityName
                    ? 'My' + ' ' + startCase(activityName)
                    : 'My activities'
                  : option.label + ' - ' + option.name
              }
              {...getTagProps({ index })}
            />
          ))
        }
        renderInput={(params) =>
          isMobile && !isTablet ? (
            <TextField
              {...params}
              size="small"
              variant="standard"
              placeholder="Search or Filter"
              className={isMobile ? 'serchBox' : ''}
              InputProps={{
                ...params.InputProps,
                disableUnderline: true,
                endAdornment: (
                  <React.Fragment>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                )
              }}
            />
          ) : (
            <TextField
              {...params}
              size="small"
              variant="outlined"
              placeholder="Search or Filter"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                )
              }}
            />
          )
        }
        value={value}
        renderOption={(option) => {
          return (
            <Grid container alignItems="center" spacing={3}>
              <Grid item>
                <Chip
                  size={chip?.size || 'medium'}
                  style={{
                    backgroundColor: resActivityColors[option.type],
                    color: resActivityTextColors[option.type]
                  }}
                  label={
                    option.isAll
                      ? option.type === 'my'
                        ? activityName
                          ? 'My' + ' ' + startCase(activityName)
                          : 'My activities'
                        : option.name + ' ' + option.label
                      : option.label
                  }
                />
              </Grid>
              <Grid item xs>
                {!option.isAll && <Typography variant="body2">{option.name}</Typography>}
              </Grid>
            </Grid>
          );
        }}
      />
      {selectedActivityId && (
        <ActivityModelHandler
          setActivityData={setSelectedActivityId}
          activityType={selectedActivityType}
          fetchBoard={() => {}}
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
    color: PropTypes.string
  })
};
