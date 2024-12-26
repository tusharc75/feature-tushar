import { CallMade, Close, Search } from '@mui/icons-material';
import { IconButton, ListItemButton, ListItemIcon, ListItemText, useAutocomplete } from '@mui/material';
import useSearch from 'src/components/Header/NewSearchBar/useSearch';
import UserFavoriteIcon from 'src/components/UserFavouriteIcon';
import TextField from '@mui/material/TextField';
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import ListSubheader from '@mui/material/ListSubheader';
import Popper from '@mui/material/Popper';
import { useTheme, styled } from '@mui/material/styles';
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { Item } from 'src/components/Header/NewSearchBar/types';
import { kebabCase } from 'lodash';
import routes from 'src/components/Helpers/Routes';

const LISTBOX_PADDING = 8; // px

function renderRow(props: ListChildComponentProps) {
  const { data, index, style } = props;
  const dataSet = data[index];
  const inlineStyle = {
    ...style,
    top: (style.top as number) + LISTBOX_PADDING
  };

  if (dataSet.hasOwnProperty('group')) {
    return (
      <ListSubheader key={dataSet.key} component="div" style={inlineStyle}>
        {dataSet.group}
      </ListSubheader>
    );
  }

  const { key, ...optionProps } = dataSet[0];

  return (
    <Typography component={'li'} key={key} {...optionProps} style={inlineStyle} noWrap>
      <ListItemIcon sx={{ minWidth: 'unset', mr: 2 }}>
        <CallMade style={{ fontSize: 16 }} />
      </ListItemIcon>
      <ListItemText
        primary={
          <span style={{ fontWeight: 500, fontSize: '15px' }}>
            <Typography noWrap component="li">{`${dataSet[1].resourceLabel}`}</Typography>
          </span>
        }
      />
      <UserFavoriteIcon item={dataSet[1]} />
    </Typography>
  );
}

const OuterElementContext = React.createContext({});

const OuterElementType = React.forwardRef<HTMLDivElement>((props, ref) => {
  const outerProps = React.useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

function useResetCache(data: any) {
  const ref = React.useRef<VariableSizeList>(null);
  React.useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}

// Adapter for react-window
const ListboxComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLElement>>(function ListboxComponent(props, ref) {
  const { children, ...other } = props;
  const itemData: React.ReactElement<unknown>[] = [];
  (children as React.ReactElement<unknown>[]).forEach(
    (
      item: React.ReactElement<unknown> & {
        children?: React.ReactElement<unknown>[];
      }
    ) => {
      itemData.push(item);
      itemData.push(...(item.children || []));
    }
  );

  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'), {
    noSsr: true
  });
  const itemCount = itemData.length;
  const itemSize = smUp ? 36 : 48;

  const getChildSize = (child: React.ReactElement<unknown>) => {
    if (child.hasOwnProperty('group')) {
      return 48;
    }

    return itemSize;
  };

  const getHeight = () => {
    if (itemCount > 8) {
      return 8 * itemSize;
    }
    return itemData.map(getChildSize).reduce((a, b) => a + b, 0);
  };

  const gridRef = useResetCache(itemCount);

  return (
    <div ref={ref}>
      <OuterElementContext.Provider value={other}>
        <VariableSizeList
          itemData={itemData}
          height={getHeight() + 2 * LISTBOX_PADDING}
          width="100%"
          ref={gridRef}
          outerElementType={OuterElementType}
          innerElementType="ul"
          itemSize={(index) => getChildSize(itemData[index])}
          overscanCount={5}
          itemCount={itemCount}
        >
          {renderRow}
        </VariableSizeList>
      </OuterElementContext.Provider>
    </div>
  );
});

const StyledPopper = styled(Popper)({
  [`& .${autocompleteClasses.listbox}`]: {
    boxSizing: 'border-box',
    '& ul': {
      padding: 0,
      margin: 0
    }
  }
});

const SearchBar = () => {
  const { items, history, globalSearch, setGlobalSearch } = useSearch();
  const [optionValue, setOptionValue] = React.useState<Partial<Item>>(null);
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFocusOnSlash = React.useCallback((e: KeyboardEvent) => {
    if (!inputRef.current) return;
    const input = inputRef.current;
    const otherFocusedElements = document.querySelector(':focus-within');
    if (otherFocusedElements) return;
    if (input.matches(':focus-within')) return;
    if (e.key === '/') {
      e.preventDefault();
      inputRef.current?.focus();
    }
  }, []);

  React.useEffect(() => {
    document.addEventListener('keydown', handleFocusOnSlash);
    return () => document.removeEventListener('keydown', handleFocusOnSlash);
  }, [handleFocusOnSlash]);

  React.useEffect(() => {
    const handleRoutes = (item) => {
      switch (item.name) {
        case 'Pos':
          return routes.pos.path;
        default:
          return `/${kebabCase(item.name)}`;
      }
    };
    if (optionValue) {
      history.push(handleRoutes(optionValue));
      setOptionValue(null);
    }
  }, [history, optionValue]);

  return (
    <div className="relative flex flex-grow overflow-hidden rounded-[4px] max-md:my-1 md:max-w-[564px]">
      {items.length > 0 ? (
        <Autocomplete
          fullWidth
          disableListWrap
          options={items}
          groupBy={(option) => option.sectionName}
          getOptionLabel={(option) => option.resourceLabel}
          size="small"
          renderInput={(params) => (
            <TextField
              className="[&_.MuiAutocomplete-endAdornment>button:last-child]:hidden"
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
              sx={{ '.MuiInputBase-root': { height: 44, padding: '10px 20px', paddingRight: '8px !important' }, paddingRight: '42px' }}
            />
          )}
          inputValue={inputValue}
          onInputChange={(e, value) => setInputValue(value)}
          value={optionValue}
          onChange={(event: any, newValue: Item) => {
            setOptionValue(newValue);
          }}
          renderOption={(props, option, state) => [props, option, state.index] as React.ReactNode}
          renderGroup={(params) => params as any}
          slots={{
            popper: StyledPopper
          }}
          noOptionsText="No result found"
          slotProps={{
            listbox: {
              component: ListboxComponent
            }
          }}
        />
      ) : (
        <TextField
          className="[&_.MuiAutocomplete-endAdornment>button:last-child]:hidden"
          placeholder="Type / to search"
          fullWidth
          inputRef={inputRef}
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e?.target?.value)}
          margin="none"
          InputProps={{
            endAdornment: globalSearch ? (
              <IconButton onClick={() => setGlobalSearch('')} size="small" sx={{ p: '5px', width: 25, height: 25, mr: '5px' }}>
                <Close fontSize="small" />
              </IconButton>
            ) : null
          }}
          sx={{ '.MuiInputBase-root': { height: 44, padding: '0' }, pr: '42px' }}
        />
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
