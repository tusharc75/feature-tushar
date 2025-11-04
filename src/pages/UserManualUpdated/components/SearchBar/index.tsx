import { Close, Search } from '@mui/icons-material';
import { Autocomplete, IconButton, TextField } from '@mui/material';
import { useState } from 'react';
import { ListboxComponent, StyledPopper } from './VirtualizedSearch';
import { UseUsermanual, SearchData } from '../../types';
import { useUserManualStore } from '../../hooks/useUsermanual';
import { makeSafeId } from 'src/pages/UserManualUpdated/utils';

function findElementByText(textToSearch: string, htmlString: string): { element: HTMLElement; tagName: string } | null {
  if (!textToSearch || !htmlString) return null;
  // Parse the HTML string into a DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Use TreeWalker to traverse all text nodes
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);

  let currentNode: Node | null = walker.nextNode();
  while (currentNode) {
    if (currentNode.nodeValue?.includes(textToSearch)) {
      const parentElement = currentNode.parentElement;
      if (parentElement) {
        return {
          element: parentElement,
          tagName: parentElement.tagName.toLowerCase()
        };
      }
    }
    currentNode = walker.nextNode();
  }

  return null; // Not found
}

const heads = ['h1', 'h2', 'h3', 'h4'];
const validHeads = new Set(heads);

export const SearchBar = ({ state }: { state: UseUsermanual }) => {
  const { navigate } = state;
  const [searchableOptions] = useUserManualStore((store) => store.searchData);
  const [optionValue, setOptionValue] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const handleSelectItem = (item: SearchData) => {
    const { element, tagName } = findElementByText(inputValue, item.content) || {};
    const hash = tagName && validHeads.has(tagName) ? makeSafeId(element.innerText) : makeSafeId(item.scrollKey, false);
    navigate({ route: item.path, hash });
    setOptionValue(null);
    setInputValue('');
    setTimeout(() => {
      const container = document.querySelector('#prose-content');
      if (!container) return;
      if (!tagName) return;
      if (!validHeads.has(tagName)) return;
      const element = document.querySelector(`#${hash}`);
      if (!element) return;
      element.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
  };

  return (
    <div className={`relative min-w-[253px]`} style={{ borderRadius: '10px' }}>
      <span className="pointer-events-none absolute left-2 top-1/2 text-gray-500 [transform:translateY(-50%)]">
        <Search color="inherit" />
      </span>
      <Autocomplete
        fullWidth
        freeSolo
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
