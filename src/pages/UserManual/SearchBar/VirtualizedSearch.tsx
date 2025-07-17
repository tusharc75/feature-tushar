import { autocompleteClasses } from '@mui/material/Autocomplete';
import ListSubheader from '@mui/material/ListSubheader';
import Popper from '@mui/material/Popper';
import { styled } from '@mui/material/styles';
import * as React from 'react';
import { PiSmileySad } from 'react-icons/pi';
import { ListChildComponentProps, VariableSizeList } from 'react-window';
import { cn } from 'src/constants/helpers';
import { SearchData } from 'src/pages/UserManual/type';

const ITEM_SIZE = 47;

const LISTBOX_PADDING = 8; // px

function extractSentenceWithValue(inputValue: string, htmlContent: string): string | null {
  // 1. Parse HTML and decode entities
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const rawText = doc.body.textContent || '';

  // 2. Normalize whitespace (spaces, newlines, NBSP)
  const text = rawText
    .replace(/\u00A0/g, ' ') // convert non-breaking spaces
    .replace(/\s+/g, ' ') // collapse all whitespace
    .trim();

  // 3. Split into sentences
  const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];

  // 4. Prepare search term and regex
  const term = inputValue.trim();
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highlightRegex = new RegExp(`(${escapedTerm})`, 'gi');

  // 5. Find and highlight
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(term.toLowerCase())) {
      return sentence.trim().replace(highlightRegex, '<span class="bg-yellow-500 text-white">$1</span>');
    }
  }

  // 6. Fallback to first sentence (no match)
  return sentences[0].trim().replace(highlightRegex, '<span class="highlight">$1</span>');
}

function renderRow(props: ListChildComponentProps) {
  const { data, index, style } = props;

  const dataSet = data[index];
  const { option, inputValue } = dataSet as { option: SearchData; key: string; inputValue: string };
  const inlineStyle = {
    ...style,
    top: (style.top as number) + LISTBOX_PADDING
  };

  if (dataSet.hasOwnProperty('group')) {
    return (
      <ListSubheader
        key={dataSet.key}
        className="line-clamp-1 text-[14px] font-medium text-[#828282] dark:text-[#9c9b9e] [&:not(:first-child)]:border-t"
        component="div"
        style={inlineStyle}
      >
        {dataSet.group}
      </ListSubheader>
    );
  }

  const { ...optionProps } = dataSet.props;

  const highlightedSentence = extractSentenceWithValue(inputValue, option.content);

  return (
    <div
      component={'li'}
      key={dataSet.key}
      {...optionProps}
      className={cn('group flex !flex-col !items-start', optionProps.className)}
      style={inlineStyle}
      noWrap
    >
      <p className="line-clamp-1 text-[15px] font-medium text-[#232529] dark:text-white">{`${option.sectionName}`} </p>
      <p className="line-clamp-1 text-[12px] text-gray-500" dangerouslySetInnerHTML={{ __html: `<span>${highlightedSentence}</span>` }}></p>
    </div>
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

  const itemCount = itemData.length;
  const itemSize = ITEM_SIZE;

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
