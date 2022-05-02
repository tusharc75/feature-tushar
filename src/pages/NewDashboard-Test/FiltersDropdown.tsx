import React from 'react';
import { Popover, TextField, Box } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

interface Props {
  filters: { key: string; title: string; multiple: boolean }[];
  anchorEl: any;
  closeAnchor: () => any;
  values: any;
  setValues: any;
  filterOptions: any;
  isAssetDashboard: boolean;
}

const FiltersDropdown = ({ filterOptions, filters, anchorEl, closeAnchor, values, setValues, isAssetDashboard }: Props) => {
  React.useEffect(() => {
    if (!filters) return;
    filters.forEach((filter) => {
      setValues((prevState: any) => ({
        ...prevState,
        [filter.key]: filter.multiple ? [] : filter.key === 'status' && !isAssetDashboard ? { optionValue: 'open', optionLabel: 'Open' } : {}
      }));
    });
  }, [filters]);

  const handleChange = (key: string, val: any) => {
    if (key === 'status' && !val && !isAssetDashboard) {
      setValues((prevState: any) => ({ ...prevState, [key]: { optionValue: 'open', optionLabel: 'Open' } }));
      return;
    }
    setValues((prevState: any) => ({ ...prevState, [key]: val }));
  };

  if (!values) return <p>Loading...</p>;

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={closeAnchor}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
    >
      <Box width={300} padding={'0px 16px 16px 16px'}>
        {filters.map((filter, index) => (
          <Box mt={'16px'} key={index}>
            {filterOptions[filter.key] ? (
              <Autocomplete
                size="small"
                multiple={filter.multiple}
                fullWidth
                options={
                  filter.key.includes('subMarket')
                    ? filterOptions[filter.key].filter((d: any) => d?.parentMarketSegment === values['marketSegment']?.optionValue)
                    : filterOptions[filter.key]
                }
                autoHighlight
                value={values[filter.key]}
                getOptionLabel={(option: any) => option.optionLabel}
                getOptionSelected={(option, val) => option.optionValue === val.optionValue}
                onChange={(_, val) => handleChange(filter.key, val)}
                renderInput={(params) => <TextField {...params} label={filter.title} variant="outlined" />}
              />
            ) : null}
          </Box>
        ))}
      </Box>
    </Popover>
  );
};

export default FiltersDropdown;
