import { Chip, ChipProps, CircularProgress, Grid, TextField, Theme, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import Autocomplete from '@mui/material/Autocomplete';
import axios from 'axios';
import { camelCase, startCase } from 'lodash';
import React, { useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from '../StateProvider/Provider';
import ActivityModelHandler from './Activity/ActivityModelHandler';
import { get_activity_resource, get_dynamic_resource } from './Activity/Helpers/utils';

const useStyles = makeStyles((theme: Theme) => ({
  chipStyle: {
    textAlign: 'center',
    height: 'unset !important',
    padding: '2px 12px',
    maxWidth: '100%',
    margin: '3px',
    '& span.MuiChip-label': {
      fontWeight: '500'
    },
    '& svg': {
      fill: 'var(--primary)'
    }
  }
}));

export const capitalize = (string) => {
  return string && typeof string === 'string' ? string?.charAt(0)?.toUpperCase() + string.slice(1) : string;
};

type SearchFilterProps = {
  handleChangeFilter: (value) => void;
  filter: any[];
  chip?: ChipProps;
  dontShowMyActivity?: boolean;
  activityName?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const SearchFilter = ({
  handleChangeFilter,
  filter,
  chip = {},
  dontShowMyActivity = false,
  activityName,
  className = 'w-full sm:w-[unset] sm:max-w-[500px] sm:min-w-[200px] flex-grow',
  ...otherProps
}: SearchFilterProps) => {
  const classes = useStyles();
  const {
    state: {
      user: { user },
      permissions,
      resources
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
    setResource();
  }, []);

  const setResource = async () => {
    const resourceOptions = get_activity_resource(permissions, resources, false);
    const data = [];
    resourceOptions.forEach((ele) => {
      data.push({ label: ele.optionLabel, type: ele.optionValue, name: 'All', isAll: true });
    });
    data.push({ label: 'my', type: 'my', name: user?._id, isAll: true });

    const dynamicResource = await get_dynamic_resource(true);

    dynamicResource?.data?.forEach((_r) => {
      if (permissions[camelCase(_r.resource)]?.isRead) {
        data.push({ label: _r.resource, type: camelCase(_r.resource), name: 'All', isAll: true });
      }
    });

    setPermissionsSearch(data);
  };

  const activityType = ['task', 'event', 'case', 'note', 'email', 'attachment'];

  useEffect(() => {
    filter?.forEach((e) => {
      e.label = resources[e.type] ? resources[e.type]?.titleSingular : startCase(e.type);
    });
    setValue(filter.filter((d) => permissionsSearch?.some((f) => f.type === d.type)));
  }, [filter, permissionsSearch]);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    if (inputValue === '') {
      let filteredSearch = dontShowMyActivity ? permissionsSearch?.filter((_o) => _o.type !== 'my') : permissionsSearch;
      setOptions(filteredSearch);
    } else {
      setLoading(true);
      let _activityName = activityName;
      if (_activityName === 'calendar') {
        _activityName = 'task,event,case';
      }
      axiosInstance()
        .get(`/activity/search?searchText=${inputValue}&activity=${_activityName}`, { cancelToken: cancelTokenSource?.token })
        .then(({ data: { data } }) => {
          setLoading(false);
          data?.forEach((e) => {
            e.label = resources[e.type] && resources[e.type]?.titleSingular ? resources[e.type]?.titleSingular : e.type;
          });
          setOptions(data);
        })
        .catch((err) => {
          setLoading(false);
        });
    }
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className={`${className}`} {...otherProps}>
      <Autocomplete
        limitTags={1}
        multiple={true}
        disableCloseOnSelect={true}
        className={`flex-grow sm:min-w-[200px] sm:max-w-[500px]`}
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
          value.map((option, index) => {
            const { size, ...rest } = chip;
            return (
              <Chip
                size={size ?? 'medium'}
                {...rest}
                label={
                  option && option.type === 'my'
                    ? activityName
                      ? 'My' + ' ' + startCase(activityName)
                      : 'My activities'
                    : option.label + ' - ' + option.name
                }
                {...getTagProps({ index })}
                className={`${classes.chipStyle} `}
              />
            );
          })
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
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              )
            }}
          />
        )}
        value={value}
        renderOption={(option) => {
          const index = options.findIndex((o) => o.type === option.type);
          const { size, className, ...rest } = chip;
          return (
            <Grid container alignItems="center" spacing={3}>
              <Grid item>
                <Chip
                  size={size || 'medium'}
                  {...rest}
                  className={`${classes.chipStyle} ${className}`}
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
    </div>
  );
};
