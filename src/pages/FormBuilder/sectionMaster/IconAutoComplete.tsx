import { Typography } from '@mui/material';
import ListSubheader from '@mui/material/ListSubheader';
import TextField from '@mui/material/TextField';
import { makeStyles, useTheme } from '@mui/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Autocomplete, { AutocompleteRenderGroupParams, AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import React from 'react';
import { ListChildComponentProps, VariableSizeList } from 'react-window';
import { AllSidebarIconList, DynamicIcon } from 'src/assets/IconGenerator';

const LISTBOX_PADDING = 8; // px

function renderRow(props: ListChildComponentProps) {
  const { data, index, style } = props;
  return React.cloneElement(data[index], {
    style: {
      ...style,
      top: (style.top as number) + LISTBOX_PADDING
    }
  });
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
const ListboxComponent = React.forwardRef<HTMLDivElement>(function ListboxComponent(props, ref) {
  const { children, ...other } = props;
  const itemData = React.Children.toArray(children);
  const theme = useTheme();
  const smUp = useMediaQuery(theme.breakpoints.up('sm'), { noSsr: true });
  const itemCount = itemData.length;
  const itemSize = smUp ? 36 : 48;

  const getChildSize = (child: React.ReactNode) => {
    if (React.isValidElement(child) && child.type === ListSubheader) {
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

const useStyles = makeStyles({
  listbox: {
    boxSizing: 'border-box',
    '& ul': {
      padding: 0,
      margin: 0
    }
  }
});

const renderGroup = (params: AutocompleteRenderGroupParams) => [
  <ListSubheader key={params.key} component="div">
    {params.group}
  </ListSubheader>,
  params.children
];

type AInputParams = {
  InputProps: {
    ref: React.Ref<any>;
    className: string;
    startAdornment: React.ReactNode;
    endAdornment: React.ReactNode;
    value: string;
  };
  inputProps: {
    value: string;
  };
} & AutocompleteRenderInputParams;

export default function IconAutoComplete({ ...rest }) {
  const classes = useStyles();

  return (
    <Autocomplete
      id="virtualize-demo"
      disableListWrap
      classes={classes}
      ListboxComponent={ListboxComponent as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
      renderGroup={renderGroup}
      options={AllSidebarIconList}
      //   groupBy={(option) => option[0].toUpperCase()}
      freeSolo={true}
      renderInput={(params: AInputParams) => {
        const selectedIconName = params.inputProps.value! || params.InputProps.value!;
        const Icon = DynamicIcon(selectedIconName, { size: 18, className: 'mr-2' });

        return (
          <TextField
            {...params}
            size="small"
            variant="outlined"
            label="Select Icon"
            fullWidth
            slotProps={{
              input: {
                ...params.InputProps, startAdornment: Icon
              },
            }}
          />
        );
      }}
      renderOption={(option) => (
        <Typography noWrap className="flex gap-2">
          <span className=" flex-shrink-0">{DynamicIcon(option as string, { size: 18 })}</span>
          {option}
        </Typography>
      )}
      fullWidth
      multiple={false}
      {...rest}
    />
  );
}
