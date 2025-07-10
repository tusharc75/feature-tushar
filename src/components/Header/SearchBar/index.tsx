import { Close } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import * as React from 'react';
import { ListboxComponent, NoResultFound, StyledPopper } from 'src/components/Header/SearchBar/AutoCompleteComponents';
import SearchDropDownList from 'src/components/Header/SearchBar/SearchDropDownList';
import { Item } from 'src/components/Header/SearchBar/types';
import useSearch from 'src/components/Header/SearchBar/useSearch';
import useSearchHistory from 'src/components/Header/SearchBar/useSearchHistory';

const SearchBar = () => {
  const { items, globalSearch, setGlobalSearch, inputRef, inputValue, optionValue, setInputValue, setOptionValue } = useSearch();
  const { handleSelectItem, historyItems, handleRemoveItemFromHistory, handleRemoveKeywordFromHistory } = useSearchHistory();

  return (
    <div className="relative flex flex-grow overflow-hidden rounded-[4px] max-md:my-1 md:max-w-[564px]">
      {items.length > 0 ? (
        <Autocomplete
          fullWidth
          disableListWrap
          options={[...historyItems, ...items]}
          groupBy={(option) => (option.type === 'history' ? 'History' : option.sectionName)}
          getOptionLabel={(option) => option.resourceLabel}
          size="small"
          renderInput={(params) => (
            <TextField
              className=" [&_.MuiAutocomplete-endAdornment>button:last-child]:hidden"
              {...params}
              placeholder="Type / to search"
              margin="none"
              inputRef={inputRef}
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
                  height: 44,
                  padding: '10px 20px',
                  paddingRight: '8px !important',
                  background: 'transparent !important'
                },
                paddingRight: '42px'
              }}
            />
          )}
          inputValue={inputValue}
          onInputChange={(e, value) => setInputValue(value)}
          value={optionValue}
          onChange={(event: any, newValue: Item) => {
            setOptionValue(newValue);
            handleSelectItem(newValue);
          }}
          renderOption={(props, option, state) =>
            ({ props, option, index: state.index, handleRemoveItemFromHistory, handleRemoveKeywordFromHistory }) as React.ReactNode
          }
          renderGroup={(params) => params as any}
          slots={{
            popper: StyledPopper
          }}
          noOptionsText={<NoResultFound />}
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
      ) : (
        <SearchDropDownList>
          {({ ref, onChange, ...rest }) => (
            <TextField
              className="[&_.MuiAutocomplete-endAdornment>button:last-child]:hidden"
              placeholder="Type / to search"
              fullWidth
              inputRef={(node) => {
                if (node) {
                  inputRef.current = node;
                  ref.current = node;
                } else {
                  inputRef.current = null;
                  ref.current = null;
                }
              }}
              value={globalSearch}
              onChange={(e) => {
                onChange(e);
                setGlobalSearch(e?.target?.value);
              }}
              margin="none"
              InputProps={{
                endAdornment: globalSearch ? (
                  <IconButton
                    onClick={() => {
                      setGlobalSearch('');
                      onChange(undefined, '');
                    }}
                    size="small"
                    sx={{ p: '5px', width: 25, height: 25, mr: '5px' }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                ) : null
              }}
              sx={{
                '& .MuiInputBase-root': {
                  height: 44,
                  padding: '0',
                  paddingRight: '8px !important',
                  background: 'transparent !important'
                },
                pr: '42px'
              }}
              {...(rest as any)}
            />
          )}
        </SearchDropDownList>
      )}
      <IconButton
        sx={{
          borderRadius: ' 0 !important',
          padding: '10px 10px',
          width: '44px',
          top: 0,
          bottom: 0,
          backgroundColor: 'var(--new_theme_color)',
          color: 'white',
          transition: 'background 0.3s'
        }}
        className="!absolute !bottom-0 !right-0 !top-0 -ml-[4px] hover:!bg-[hsl(178,54%,39%)]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none">
          <path d="M11.4233 11.5286L14.7983 14.9036" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M7.20459 12.6536C10.1559 12.6536 12.5483 10.2611 12.5483 7.30981C12.5483 4.35854 10.1559 1.96606 7.20459 1.96606C4.25332 1.96606 1.86084 4.35854 1.86084 7.30981C1.86084 10.2611 4.25332 12.6536 7.20459 12.6536Z"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </IconButton>
    </div>
  );
};

export default SearchBar;
