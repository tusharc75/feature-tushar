import { Close, Search } from '@mui/icons-material';
import { Autocomplete, IconButton, TextField } from '@mui/material';
import { useState } from 'react';
import { ListboxComponent, StyledPopper } from 'src/pages/UserManual/SearchBar/VirtualizedSearch';
import { ComponentCommonProps, SearchData } from 'src/pages/UserManual/type';

export const SearchBar = ({ state }: ComponentCommonProps) => {
  const { navigate, searchData: searchableOptions } = state;
  const [optionValue, setOptionValue] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const handleSelectItem = (item: SearchData) => {
    navigate(item.path, item.scrollKey);
    setOptionValue(null);
    setInputValue('');
  };

  return (
    <div className={`relative min-w-[253px]`} style={{ borderRadius: '10px' }}>
      <span className="pointer-events-none absolute left-2 top-1/2 text-gray-500 [transform:translateY(-50%)]">
        <Search color="inherit" />
      </span>
      <Autocomplete
        fullWidth
        disableListWrap
        options={searchableOptions}
        groupBy={(option) => option.group}
        getOptionLabel={(option) => `${option.sectionName} ${option.content}`}
        size="small"
        renderInput={(params) => (
          <TextField
            className=" [&_.MuiAutocomplete-endAdornment>button:last-child]:hidden"
            {...params}
            placeholder="search"
            margin="none"
            size="small"
            InputProps={{
              ...params.InputProps,
              endAdornment: inputValue ? (
                <IconButton onClick={() => setInputValue('')} size="small" sx={{ p: '5px', width: 25, height: 25, mr: '5px' }}>
                  <Close fontSize="small" />
                </IconButton>
              ) : null
            }}
            sx={{
              '& .MuiInputBase-root': {
                height: 35,
                padding: '10px 20px',
                paddingRight: '8px !important',
                background: 'transparent !important',
                borderRadius: '10px',
                paddingLeft: '30px !important'
              }
            }}
          />
        )}
        inputValue={inputValue}
        onInputChange={(e, value) => setInputValue(value)}
        value={optionValue}
        onChange={(event: any, newValue: SearchData) => {
          setOptionValue(newValue);
          handleSelectItem(newValue);
        }}
        renderOption={(props, option, state) => ({ props, option, index: state.index, inputValue, key: option._id }) as React.ReactNode}
        renderGroup={(params) => params as any}
        slots={{
          popper: StyledPopper
        }}
        slotProps={{
          paper: {
            elevation: 0,
            className: '[--Paper-shadow:unset] border border-t-0 !bg-[--dark-primary,white]'
          },
          listbox: {
            component: ListboxComponent
          }
        }}
      />
    </div>
  );
};
