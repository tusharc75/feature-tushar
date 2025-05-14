import { MenuItem, MenuItemProps, Popover, PopoverProps } from '@mui/material';
import { groupBy } from 'lodash';
import React, { ReactElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TbTriangleFilled } from 'react-icons/tb';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn } from 'src/constants/helpers';
import useLocalStorage from 'src/hooks/useLocalStore';

type ActionMenuWithGrouppingProps = {
  uniqueId: string;
  getItemId: (data: Item) => string;
  anchorEl: HTMLElement;
  handleClose: (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => void;
  horizontal: 'left' | 'right';
  children: ReactElement<typeof ActionMenuItem> | ReactElement<typeof ActionMenuItem>[];
} & Omit<PopoverProps, 'onClose' | 'open' | 'children'>;

type LocalStoreItems = { id: string; count: number };

function NoTransition({ children }) {
  return React.Children.only(children);
}

const MenuWithGroupping = ({
  uniqueId,
  getItemId,
  anchorEl,
  handleClose,
  children,
  horizontal = 'right',
  ...props
}: ActionMenuWithGrouppingProps) => {
  const [localStoreValue, setLocalStoreValue] = useLocalStorage<LocalStoreItems[]>(uniqueId, []);
  const [arrowRef, setArrowRef] = useState<HTMLSpanElement | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [filteredItems, setFilteredItems] = useState([]);
  const historyItemsRef = useRef([]);
  const [searchValue, setSearchValue] = useState('');
  const items = useMemo(() => {
    if (Array.isArray(children)) {
      return children.filter((d) => !!d).map((c) => c.props as unknown as Item);
    } else {
      return [children].map((c) => c.props as unknown as Item);
    }
  }, [children]);
  const grouppedItems = groupBy(filteredItems, (item) => (item.group ? item.group : ''));
  const grouppedItmemKeys = Object.keys(grouppedItems);
  const localStoreGroup = localStoreValue ? localStoreValue.map((ld) => items.find((item) => item.id === ld.id)).filter((d) => !!d) : [];

  const handleClickItem = (item: Item) => {
    const itemId = item.id ? item.id : getItemId(item);
    const localStoreIndex = localStoreValue.findIndex((i) => i.id === itemId);

    if (localStoreIndex > -1) {
      setLocalStoreValue((prev) =>
        prev
          .map((item, index) => {
            if (index === localStoreIndex) {
              return { ...item, count: item.count + 1 };
            }
            return item;
          })
          .sort((a, b) => b.count - a.count)
      );
    } else {
      setLocalStoreValue((prev) => {
        const newData = [...prev];
        if (newData.length > 2) newData.pop();
        newData.push({ id: itemId, count: 1 });
        return newData;
      });
    }
  };

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | undefined) => {
      e?.preventDefault();
      e?.stopPropagation();
      const value = e?.target?.value || '';
      setSearchValue(value);
      if (value.trim()) {
        const newItems = items.filter((i) => {
          const itemValue = (typeof i.children === 'string' ? i.children : i.searchKey) || '';
          return itemValue.toLowerCase().includes(value.toLowerCase()) || i.group.toLowerCase().includes(value.toLowerCase());
        });
        setFilteredItems(newItems);
      } else {
        setFilteredItems(items);
      }
    },
    [items]
  );

  useEffect(() => {
    // for getting initial items
    handleSearch(undefined);
  }, [handleSearch]);

  useLayoutEffect(() => {
    if (arrowRef && anchorEl) {
      const paper = paperRef.current;
      if (!paper) return;
      const paperRect = paper?.getBoundingClientRect();
      const buttonRect = anchorEl.getBoundingClientRect();
      const relativeTop = buttonRect.y + window.scrollY - (paperRect.y + window.scrollY);
      arrowRef.style.top = `${relativeTop + 8}px`;
      if (horizontal === 'right') {
        paper.style.marginLeft = '4px';
      } else {
        paper.style.marginRight = '4px';
      }
    }
  }, [arrowRef, anchorEl, horizontal]);

  if (!anchorEl) return null;

  return (
    <>
      <Popover
        id={uniqueId}
        anchorEl={anchorEl}
        slotProps={{
          paper: {
            sx: {
              minWidth: 'min(100%, 250px)',
              minHeight: '400px',
              overflow: 'visible',
              background: 'transparent',
              filter: 'drop-shadow(rgba(0, 0, 0, 0.35) 0px 5px 15px) drop-shadow(var(--common-border-color) 0px 0px 1px)',
              boxShadow: 'unset'
            },
            className: 'relative isolate',
            ref: paperRef
          }
        }}
        slots={{
          transition: NoTransition
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: horizontal
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: horizontal === 'right' ? 'left' : 'right'
        }}
        {...props}
      >
        <span ref={setArrowRef} className={cn(' absolute -z-[1]', horizontal === 'right' ? '-left-[10px]' : '-right-[10px]')}>
          <TbTriangleFilled
            // style={{ color: 'red' }}
            className={cn(
              ' z-[11] text-[var(--dark-primary,white)] [transform-origin:center]',
              horizontal === 'right' ? ' [transform:rotate(-90deg)]' : '[transform:rotate(90deg)]'
            )}
          />
        </span>
        <div className="max-h-[600px] overflow-y-auto rounded-[10px] bg-[var(--dark-primary,white)]">
          <div className="sticky top-0 z-10 bg-[var(--dark-primary,white)] p-4">
            <SearchBox
              value={searchValue}
              ref={(node) => {
                if (node) {
                  node.focus();
                }
              }}
              onChange={handleSearch}
            />
          </div>

          {filteredItems.length === 0 && (
            <div className="flex min-h-[300px] items-center justify-center">
              <span className="select-none text-gray-500">No Data found</span>
            </div>
          )}

          {searchValue.trim().length === 0 && localStoreGroup.length > 0 && (
            <div className="mb-2 border-b pb-2">
              <p className="my-2 px-4 text-xs font-semibold text-gray-400 dark:text-gray-500">Frequently Used</p>
              {localStoreGroup.map((item, index) => {
                const { id, onClick, children, ...rest } = item;
                return (
                  <MenuItem
                    sx={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    key={id ? id : getItemId(item)}
                    onClick={(e) => {
                      handleClickItem(item);
                      if (typeof onClick === 'function') {
                        onClick(e);
                      }
                    }}
                    ref={(node) => {
                      if (node) {
                        historyItemsRef.current[index] = node;
                      } else {
                        historyItemsRef.current[index] = undefined;
                      }
                    }}
                    {...rest}
                  >
                    {children}
                  </MenuItem>
                );
              })}
            </div>
          )}
          {grouppedItmemKeys.length > 0
            ? grouppedItmemKeys.map((key) => {
                const items = grouppedItems[key];
                if (items.length === 0) return null;
                return (
                  <div className="pb-2">
                    <p className="my-2 px-4 text-xs font-semibold text-gray-400 dark:text-gray-500" key={key}>
                      {key}
                    </p>
                    {items.map((item) => {
                      const { id, onClick, ...rest } = item;
                      return (
                        <MenuItem
                          sx={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                          key={id ? id : getItemId(item)}
                          onClick={(e) => {
                            handleClickItem(item);
                            if (typeof onClick === 'function') {
                              onClick(e);
                            }
                          }}
                          {...rest}
                        />
                      );
                    })}
                  </div>
                );
              })
            : filteredItems.map((item) => {
                const { id, onClick, ...rest } = item;
                return (
                  <MenuItem
                    sx={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    key={id ? id : getItemId(item)}
                    onClick={(e) => {
                      handleClickItem(item);
                      if (typeof onClick === 'function') {
                        onClick(e);
                      }
                    }}
                    {...rest}
                  />
                );
              })}
        </div>
      </Popover>
    </>
  );
};

export default MenuWithGroupping;

type Item = {
  id: string;
  group: string;
  searchKey?: string;
} & MenuItemProps;
export const ActionMenuItem = ({ id, onClick, ...rest }: Item) => {
  return null;
};
