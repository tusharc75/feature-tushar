import { Checkbox, CheckboxProps, CircularProgress, IconButton, TableCell, TextField } from '@material-ui/core';
import { Check, DragIndicator, Edit, ExpandLess, ExpandMore } from '@material-ui/icons';
import { Column, ColumnDef, Header, Table, flexRender } from '@tanstack/react-table';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { CgSearch } from 'react-icons/cg';
import { GrFormClose } from 'react-icons/gr';
import HtmlTooltip from '../../CustomTooltipTitle';
import { getCellValue, getStickyPosition, handleCellClick } from '../utils';
import { Autocomplete } from '@material-ui/lab';
import { FiltersContext } from 'src/StateProvider/FiltersContext/FiltersContext';
import { eq, isEqual } from 'lodash';

let cellId = null;

export type TColType = {
  Header: string;
  header: string;
  isHideColumnSum?: boolean;
  Footer?: (data: any) => React.ReactNode;
  type?:
    | 'mobileNumber'
    | 'phone'
    | 'email'
    | 'imageUpload'
    | 'date'
    | 'dateTime'
    | 'colorPicker'
    | 'checkBox'
    | 'number'
    | 'signature'
    | 'decimal'
    | 'currencyAmount'
    | 'converter'
    | 'singleLine'
    | 'dropDown'
    | 'multiSelect';
  currency?: string;
  accessorFn: (data: any) => string;
  sticky: undefined | 'left' | 'right';
  disableFilters: undefined | boolean;
  disableSortBy: undefined | boolean;
  editable: undefined | boolean;
  canDrag: undefined | boolean;
  accessor?: string;
  lockPosition?: undefined | boolean;
  primaryField?: undefined | boolean;
  id: string;
  isVisible: undefined | boolean;
  show: undefined | boolean;
  option: any;
} & ColumnDef<any>;

const DebouncedInput = React.forwardRef(
  (
    {
      value: initialValue,
      onChange,
      debounce = 500,
      ...props
    }: {
      value: string | number;
      onChange: (value: string | number) => void;
      debounce?: number;
    } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>,
    ref: React.ForwardedRef<HTMLInputElement>
  ) => {
    const [value, setValue] = React.useState(initialValue);

    React.useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    React.useEffect(() => {
      const timeout = setTimeout(() => {
        onChange(value);
      }, debounce);

      return () => clearTimeout(timeout);
    }, [value]);

    return <input ref={ref} {...props} value={value} onChange={(e) => setValue(e.target.value)} />;
  }
);

// for server side filter
export function TempFilter({ filterValue, id, setFilters, customFilters }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef(null);
  const inputRef = React.useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleFilterChange = (newValue) => {
    let tempArr = Object.keys(customFilters).map((key, i) => {
      return { id: key, value: customFilters[key].filter };
    });
    const existingFilterIndex = tempArr.findIndex((filter) => filter.id === id);

    if (existingFilterIndex !== -1) {
      // Update existing filter
      const updatedFilters = tempArr.map((filter, index) => (index === existingFilterIndex ? { ...filter, value: newValue } : filter));
      setFilters(updatedFilters);
    } else {
      // Add new filter
      const newFilter = { id, value: newValue };
      setFilters([...tempArr, newFilter]);
    }
  };

  return (
    <div className="search-container">
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        size="small"
        className={`${filterValue ? 'activeFilter' : ''}`}
      >
        <CgSearch />
      </IconButton>

      <div className={`tableFilterSearch ${isOpen ? 'open' : ''}`} ref={ref}>
        <input
          value={filterValue || ''}
          onChange={(e) => handleFilterChange(e.target.value)}
          autoComplete="off"
          placeholder="Search..."
          type="text"
          id="search-serverside"
          aria-hidden={!isOpen}
          ref={inputRef}
        />

        <GrFormClose
          onClick={(e) => {
            e.stopPropagation();
            if ((filterValue || '').trim() === '') {
              setIsOpen(false);
              return;
            }
            handleFilterChange('');
            setIsOpen(false);
          }}
        />
      </div>
    </div>
  );
}

// for client side filter
export function Filter({ column, table }: { column: Column<any, unknown>; table: Table<any> }) {
  const columnFilterValue = column.getFilterValue();

  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef(null);
  const inputRef = React.useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="search-container">
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        size="small"
        className={`${columnFilterValue ? 'activeFilter' : ''}`}
      >
        <CgSearch />
      </IconButton>

      <div className={`tableFilterSearch ${isOpen ? 'open' : ''}`} ref={ref}>
        <DebouncedInput
          value={(columnFilterValue ?? '') as string}
          onChange={(value) => column.setFilterValue(value)}
          autoComplete="off"
          placeholder={`Search...`}
          type="text"
          id="search"
          aria-hidden={!isOpen}
          ref={inputRef}
        />

        <GrFormClose
          onClick={(e) => {
            e.stopPropagation();
            column.setFilterValue('');
            setIsOpen(false);
          }}
        />
      </div>
    </div>
  );
}

// Checkbox
interface CustomCheckBoxProps extends CheckboxProps {
  indeterminate: any;
  from?: string;
  style?: React.CSSProperties;
}
export const IndeterminateCheckbox = React.forwardRef(({ indeterminate, from, style, ...rest }: CustomCheckBoxProps, ref) => {
  const defaultRef = React.useRef();
  const resolvedRef: any = ref || defaultRef;

  useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      resolvedRef.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [resolvedRef, indeterminate]);

  return (
    <Checkbox
      size="small"
      ref={resolvedRef}
      {...rest}
      color="primary"
      style={{ ...style, color: from === 'Header' ? 'white' : 'inherit', padding: 0 }}
      inputProps={{ 'aria-label': 'secondary checkbox' }}
    />
  );
});

// Draggable header
interface DraggableHeaderProps {
  header: Header<any, unknown>;
  table: Table<any>;
  customFilters: any;
  dispatch: (action: any) => void;
  isClientSideGrid: boolean;
  reorder: (draggedColumn: string, column: string, columnOrder: string[]) => string[];
  virtualization: boolean;
  resource: string;
}
export const DraggableHeader: React.FC<DraggableHeaderProps> = ({
  header,
  table,
  customFilters,
  dispatch,
  isClientSideGrid,
  reorder,
  virtualization,
  resource
}) => {
  const { getState, setColumnOrder } = table;
  const { columnOrder } = getState();
  const { column, index } = header;
  const columnDef = column.columnDef as TColType;

  const isNotDraggable =
    columnDef.canDrag === false ||
    columnDef.sticky ||
    columnDef.primaryField ||
    columnDef.lockPosition ||
    ['action', 'selection', 'expand'].includes(column?.id);

  const [filters, setFilters] = useState([]);
  const { savedFilters, setSavedFilters } = useContext(FiltersContext);

  // Use a useEffect to update filters when customFilters changes
  useEffect(() => {
    setFilters(
      Object.keys(customFilters).map((key, i) => ({
        id: key,
        value: customFilters[key].filter
      }))
    );
    return () => setFilters([]);
  }, [customFilters]); // Add customFilters as a dependency
  const MINIMUM_SEARCH_DELAY = 1000; // Adjust this delay as needed

  const [, dropRef] = useDrop({
    accept: 'column',
    drop: (draggedColumn: TColType) => {
      const newColumnOrder = reorder(draggedColumn.id, column.id, columnOrder);
      setColumnOrder(newColumnOrder);
    },
    canDrop: () => !isNotDraggable
  });

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    item: () => column,
    type: 'column',
    canDrag: !isNotDraggable
  });

  useEffect(() => {
    if (isClientSideGrid) return;

    // Add a timer to delay the dispatch
    const searchTimer = setTimeout(() => {
      let tempArray = Object.keys(customFilters).map((key, i) => {
        return { id: key, value: customFilters[key].filter };
      });
      if (JSON.stringify(filters) !== JSON.stringify(tempArray)) {
        var tempResult = {};
        filters?.forEach((v) => {
          if (v.value && v.value !== '') {
            tempResult[v.id] = { filter: v.value };
          } else {
            if (customFilters[v.id] && customFilters[v.id].operator && customFilters[v.id].condition1) {
              tempResult[v.id] = customFilters[v.id];
            }
          }
        });
        dispatch({ type: 'filter', filters: tempResult });
        if (!isClientSideGrid) setSavedFilters({ ...savedFilters, [resource]: tempResult });
      }
    }, MINIMUM_SEARCH_DELAY);

    // Clear the timer when the component unmounts or when filters change
    return () => clearTimeout(searchTimer);
  }, [filters, isClientSideGrid]);

  const colSize = header.getSize();

  const { style } = getStickyPosition(columnDef, index, table);

  return (
    <TableCell
      {...{
        key: header.id,
        colSpan: header.colSpan
      }}
      title={typeof columnDef.header === 'string' ? columnDef.header : ''}
      colSpan={header.colSpan}
      className={`th text-truncate table-header overflow-hidden  ${columnDef.sticky ? 'bg-[var(--dark-primary,_white)] z-10' : ''} `}
      ref={dropRef}
      style={{
        minWidth: `${colSize}px`,
        maxWidth: `${colSize}px`,
        paddingLeft: columnDef.id === 'expander' ? '8px' : '6px',
        zIndex: columnDef.sticky === 'left' || columnDef.sticky === 'right' ? 12 : 'unset',
        ...(virtualization ? {} : style)
      }}
    >
      <div
        ref={previewRef}
        style={{ opacity: isDragging ? 0.5 : 1 }}
        className={`flex items-center pos-rel flex-grow  ${column.id === 'selection' ? 'justify-center' : 'justify-between pr-[16px]'}`}
      >
        <div
          className={`d-flex gap-2 align-items-center ${column.id === 'selection' ? 'justify-center' : 'justify-between'} ${
            header.column.getCanSort() && columnDef.disableSortBy !== true ? 'cursor-pointer' : ''
          }`}
          onClick={columnDef.disableSortBy !== true ? header.column.getToggleSortingHandler() : null}
        >
          <div className="line-clamp-1">
            <span className={`overflow-hidden overflow-ellipsis whitespace-normal `}>
              {header?.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
            </span>
          </div>
          {column.getCanSort() && columnDef.disableSortBy !== true ? (
            <>
              {{
                asc: <ExpandLess fontSize="small" />,
                desc: <ExpandMore fontSize="small" />
              }[header.column.getIsSorted() as string] ?? null}
            </>
          ) : (
            ''
          )}
        </div>
        {column?.getCanFilter() && column?.id !== 'action' && columnDef.disableFilters !== true ? (
          <>
            {!isClientSideGrid ? (
              <TempFilter
                filterValue={filters.find((filter) => filter.id === column.id)?.value || ''}
                id={column?.id}
                setFilters={setFilters}
                customFilters={customFilters}
              />
            ) : (
              <>
                <Filter column={header.column} table={table} />
              </>
            )}
          </>
        ) : null}
        {isNotDraggable || header.column.getIsResizing() ? null : (
          <div ref={dragRef} className={`drag-icon mr-2 ${isDragging ? ' cursor-grabbing' : 'cursor-grab'}`}>
            <DragIndicator className="text-[16px]" />
          </div>
        )}
      </div>

      {column.getCanResize() && !virtualization && (
        <div
          {...{
            onMouseDown: header.getResizeHandler(),
            onTouchStart: header.getResizeHandler(),
            className: `resizer ${header.column.getIsResizing() ? 'isResizing' : ''}`
          }}
        />
      )}
    </TableCell>
  );
};

// Cells
export const CellRenderer = ({
  state,
  cell,
  setWholeRowsCellColor,
  row,
  index,
  table,
  dispatch,
  setCellValue,
  submitInput,
  cellValue,
  resetField,
  virtualStyles,
  virtualization
}) => {
  const columnDef: TColType = cell.column.columnDef as TColType;

  const { currentEditingCellPosition, loadingExpanderRowId } = state;

  const { style, className: stickyClassName } = getStickyPosition(columnDef, index, table);

  const CellShell = ({ children, className = '', ...others }) => {
    return (
      <TableCell
        key={cell.id}
        className={`td p-0 [&>*]:h-[45px] [&>*]:flex [&>*]:items-center [&>*]:p-[5px_8px] h-[45px] overflow-hidden ${className}
        ${columnDef.sticky ? 'bg-[var(--dark-primary,_white)] z-10' : ''} 
        ${setWholeRowsCellColor ? setWholeRowsCellColor(row.original) + ' td-color' : ''} ${stickyClassName}`}
        style={{
          minWidth: cell.column.getSize(),
          maxWidth: cell.column.getSize(),
          ...(virtualization ? { ...virtualStyles } : { ...style })
        }}
        onClick={() => {
          if (columnDef?.type === 'dropDown' || columnDef?.type === 'date' || columnDef?.type === 'multiSelect') {
            if (cellId != cell.id) {
              handleCellClick({ cell, dispatch, row, setCellValue });
            }
          } else {
            handleCellClick({ cell, dispatch, row, setCellValue });
          }
          cellId = cell.id;
        }}
        {...others}
      >
        {children}
      </TableCell>
    );
  };

  switch (true) {
    case cell?.column.id === 'expander' && loadingExpanderRowId === row.original._id:
      return (
        <CellShell>
          <div className="p-[5px_10px]">
            <CircularProgress size={14} color="primary" style={{ padding: 0 }} />
          </div>
        </CellShell>
      );
    case !['selection'].includes(cell?.column.id) &&
      currentEditingCellPosition?.rowId === row.original._id &&
      currentEditingCellPosition?.columnName === cell?.column.id:
      return (
        <CellShell>
          <div className="w-full">
            {columnDef?.type === 'singleLine' ? (
              <input
                autoFocus
                type="text"
                onBlur={() => (getCellValue(cell) !== cellValue ? submitInput() : resetField())}
                value={cellValue}
                onKeyDown={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (!currentEditingCellPosition) return;
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    target.blur();
                  }
                }}
                className="dark:text-[white] appearance-none w-full focus-within:outline-[var(--new-theme-color)] bg-[transparent] outline-[transparent] shadow-0 border-[0] px-[2px] py-[4px] [border-bottom:1px_solid_var(--common-border-color)_!important]"
                onChange={(e) => {
                  setCellValue(e.target.value || '');
                }}
              />
            ) : columnDef?.type === 'dropDown' ? (
              <Autocomplete
                fullWidth
                onKeyDown={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (!currentEditingCellPosition) return;
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    target.blur();
                  }
                }}
                options={columnDef?.option || []}
                getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                getOptionSelected={(option: any, val) => option.optionValue === val}
                value={
                  columnDef?.option?.filter((data) => data.optionValue === cellValue).length
                    ? columnDef?.option?.filter((data) => data.optionValue === cellValue)[0]
                    : ''
                }
                onChange={(e, val) => {
                  setCellValue(val?.optionValue || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="standard"
                    autoFocus
                    onBlur={() => {
                      if (getCellValue(cell) !== cellValue) {
                        submitInput();
                      } else {
                        resetField();
                      }
                      cellId = null;
                    }}
                  />
                )}
              />
            ) : columnDef?.type === 'multiSelect' ? (
              <Autocomplete
                fullWidth
                multiple
                disableCloseOnSelect
                limitTags={2}
                onKeyDown={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (!currentEditingCellPosition) return;
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    target.blur();
                  }
                }}
                selectOnFocus
                options={columnDef?.option || []}
                getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                value={
                  columnDef?.option?.filter((data) => cellValue?.includes(data.optionValue)).length
                    ? columnDef?.option?.filter((data) => cellValue?.includes(data.optionValue))
                    : []
                }
                onChange={(e, val) => {
                  setCellValue(val ? val?.map((v) => v?.optionValue) : []);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="standard"
                    autoFocus
                    onBlur={() => {
                      if (!isEqual(getCellValue(cell), cellValue)) {
                        submitInput();
                      } else {
                        resetField();
                      }
                      cellId = null;
                    }}
                  />
                )}
              />
            ) : columnDef?.type === 'date' ? (
              <input
                type="date"
                className="dark:text-[white] appearance-none w-full focus-within:outline-[var(--new-theme-color)] bg-[transparent] outline-[transparent] shadow-0 border-[0] px-[2px] py-[4px] [border-bottom:1px_solid_var(--common-border-color)_!important]"
                value={cellValue ? new Date(cellValue).toISOString().split('T')[0] : ''}
                onKeyDown={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (!currentEditingCellPosition) return;
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    target.blur();
                  }
                }}
                autoFocus
                onBlur={() => {
                  if (!eq(getCellValue(cell), cellValue)) {
                    submitInput();
                  } else {
                    resetField();
                  }
                  cellId = null;
                }}
                onChange={(e) => {
                  const date = new Date();
                  const time = date.toTimeString().split(' ')[0];
                  setCellValue(`${e.target.value}T${time}.000Z`);
                }}
              />
            ) : columnDef?.type === 'number' ? (
              <input
                autoFocus
                type="number"
                min="0"
                onBlur={() => (getCellValue(cell) !== cellValue ? submitInput() : resetField())}
                value={cellValue}
                onKeyDown={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (!currentEditingCellPosition) return;
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    target.blur();
                  }
                }}
                className="dark:text-[white] appearance-none w-full focus-within:outline-[var(--new-theme-color)] bg-[transparent] outline-[transparent] shadow-0 border-[0] px-[2px] py-[4px] [border-bottom:1px_solid_var(--common-border-color)_!important]"
                onChange={(e) => {
                  let value: any = e.target.value;
                  value = parseFloat(parseFloat(value)?.toFixed(cell?.column?.columnDef?.decimalPlaces || 0));
                  setCellValue(value);
                }}
              />
            ) : null}
          </div>
        </CellShell>
      );
    case currentEditingCellPosition?.rowId === row.original._id && cell?.column.id === 'action' && currentEditingCellPosition?.rowId !== undefined:
      return (
        <CellShell>
          <div className="action-cell">
            <HtmlTooltip title="Save">
              <IconButton size="small" aria-label="Save" onClick={submitInput}>
                <Check color="primary" />
              </IconButton>
            </HtmlTooltip>
          </div>
        </CellShell>
      );
    case columnDef?.editable:
      return (
        <CellShell>
          <div className="w-full">
            <div className="[border-bottom:1px_dashed_#8a8a8a] cursor-pointer flex w-full justify-between">
              <p>{flexRender(cell.column.columnDef.cell, cell.getContext())}</p>
              <span>
                <Edit className="text-[rgba(0,0,0,0.3)] dark:text-[rgba(255,255,255,0.9)]" fontSize="small" />
              </span>
            </div>
          </div>
        </CellShell>
      );
    case cell.column.id === 'action':
      return (
        <CellShell>
          <div className="action-cell">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
        </CellShell>
      );
    default:
      return (
        <CellShell className=" [&_*]:overflow-hidden [&_*]:max-w-full [&_*]:[-webkit-box-orient:vertical] [&_.MuiBox-root]:flex-shrink-0 [&_*]:[white-space:nowrap] [&_*]:[text-overflow:ellipsis] [&_*]:[-webkit-line-clamp:1] [&>*]:flex [&>*]:items-center ">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </CellShell>
      );
  }
};
