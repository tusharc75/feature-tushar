import { CallMade } from '@mui/icons-material';
import { ListItemIcon, ListItemText } from '@mui/material';
import { autocompleteClasses } from '@mui/material/Autocomplete';
import ListSubheader from '@mui/material/ListSubheader';
import Popper from '@mui/material/Popper';
import { styled, useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import * as React from 'react';
import { ListChildComponentProps, VariableSizeList } from 'react-window';
import UserFavoriteIcon from 'src/components/UserFavouriteIcon';
import { PiSmileySad } from 'react-icons/pi';

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
      <ListSubheader key={dataSet.key} className="text-[14px] font-medium text-[#828282] dark:text-[#9c9b9e]" component="div" style={inlineStyle}>
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
        primary={<p className="line-clamp-1 text-[15px] font-medium text-[#232529] dark:text-white">{`${dataSet[1].resourceLabel}`}</p>}
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
export const ListboxComponent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLElement>>(function ListboxComponent(props, ref) {
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
    <div ref={ref} className="[&>div]:!bg-[var(--dark-primary,white)]">
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

export const StyledPopper = styled(Popper)({
  [`& .${autocompleteClasses.listbox}`]: {
    boxSizing: 'border-box',
    '--Paper-shadow': 'unset',
    '& ul': {
      padding: 0,
      margin: 0
    }
  }
});

export const NoResultFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-[20px] text-[--grey]">
      <PiSmileySad size={50} className="mx-auto mb-[10px]" />
      <p className="select-none text-center text-[14px] font-normal">Sorry, we couldn&apos;t find any result</p>
    </div>
  );
};
