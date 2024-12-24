import { Collapse, IconButton } from '@mui/material';
import { flexRender } from '@tanstack/react-table';
import { BsChevronContract, BsChevronExpand } from 'react-icons/bs';
import RenderCellWithHeader from './RenderCellWithHeader';
import { DEFAULT_DATA_ROWS_VISIBLE } from './index';

const RenderSubCard = ({
  table,
  dispatch,
  allowSelection,
  renderedFrom,
  expander,
  backgroundColorClass,
  otherFieldsLength,
  handleCollapse,
  expanderCol,
  index,
  actionField,
  primaryField,
  compareCollapse,
  defaultDisplay,
  collapsibleFields,
  IndeterminateCheckbox,
  row,
  depth = 1,
  submitInput,
  cellValue,
  setCellValue,
  state,
  onRowClick
}: any) => {
  if (row.depth !== depth) return null;
  let expanderCell = null;
  if (expander && expanderCol) {
    expanderCell = row.getVisibleCells()[0];
  }
  return (
    <div
      className={`my-2 rounded-md px-3 py-2 shadow-[0px_3px_26px_0px_rgba(0,0,0,0.06)] [--left-gutter:20px] dark:bg-[var(--dark-secondary)] ${
        backgroundColorClass && backgroundColorClass(row.original) + ' td-color'
      } ${typeof onRowClick === 'function' ? 'focus:outline-0 focus:[box-shadow:inset_0px_0px_0px_1px_var(--primary-text)]' : ''}`}
      key={row.original._id}
      style={{
        border: '1px solid var(--common-border-color)',
        cursor: otherFieldsLength > DEFAULT_DATA_ROWS_VISIBLE ? 'pointer' : 'auto'
      }}
      onClick={() => (typeof onRowClick === 'function' ? onRowClick(row.original) : null)}
      tabIndex={typeof onRowClick === 'function' ? 0 : -1}
      role={typeof onRowClick === 'function' ? 'button' : 'none'}
      onKeyDown={(e) => {
        if (typeof onRowClick !== 'function') return;
        const target = e.target as HTMLDivElement;

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRowClick(row.original);
        }
        if (e.key === 'ArrowDown') {
          const next = target?.nextSibling as HTMLDivElement;
          next?.focus();
        }
        if (e.key === 'ArrowUp') {
          const previous = target?.previousSibling as HTMLDivElement;
          previous?.focus();
        }
      }}
    >
      <div className={`flex items-center gap-2`}>
        {expander && expanderCol && flexRender(expanderCell?.column?.columnDef?.cell, expanderCell?.getContext())}
        {allowSelection && !row.original.hideSelection && (
          <div>
            <IndeterminateCheckbox
              {...{
                checked: row.getIsSelected(),
                indeterminate: row.getIsSomeSelected(),
                onChange: row.getToggleSelectedHandler()
              }}
            />
          </div>
        )}
        <div className="flex-grow">
          <div className="flex items-center justify-between gap-2">
            {primaryField && (
              <div className="line-clamp-1">
                <h6 className="line-clamp-1 text-[8px] font-medium text-[var(--dark-secondary-text,#8b8b8b)]">{primaryField.header}:</h6>
                <h4 className="quote-name line-clamp-1 [&>*]:[font-weight:700_!important] [&_*]:line-clamp-1  [&_*]:[font-size:12px_!important] [&_*]:[white-space:unset_!important]">
                  {primaryField.cell({ row, table })}
                </h4>
              </div>
            )}
            <div className="icon-layout  d-flex align-items-center gap-2">
              {actionField && actionField?.cell?.({ row, table })}
              {otherFieldsLength > DEFAULT_DATA_ROWS_VISIBLE && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCollapse(row.original._id);
                  }}
                >
                  {compareCollapse(row.original._id) ? <BsChevronExpand /> : <BsChevronContract />}
                </IconButton>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 grid gap-2 px-2 pt-2" style={{ borderTop: '1px dashed var(--common-border-color)' }}>
        <div className="grid w-full gap-2">
          {defaultDisplay.map((field) => {
            return (
              <RenderCellWithHeader
                key={field.id}
                field={field}
                row={row}
                submitInput={submitInput}
                cellValue={cellValue}
                setCellValue={setCellValue}
                state={state}
                dispatch={dispatch}
              />
            );
          })}
        </div>
        <Collapse in={compareCollapse(row.original._id)} unmountOnExit>
          <div className="grid w-full gap-2">
            {collapsibleFields.map((field) => {
              return (
                <RenderCellWithHeader
                  key={field.id}
                  field={field}
                  row={row}
                  submitInput={submitInput}
                  cellValue={cellValue}
                  setCellValue={setCellValue}
                  state={state}
                  dispatch={dispatch}
                />
              );
            })}
          </div>
        </Collapse>
      </div>
      {expander && (
        <Collapse in={row.getIsExpanded()} unmountOnExit>
          <div className="mt-3">
            {row.subRows?.map((row, index) => {
              return (
                <RenderSubCard
                  key={row?.original?._id || index}
                  {...{
                    table,
                    depth: depth + 1,
                    dispatch,
                    allowSelection,
                    dataRows: row.subRows || [],
                    renderedFrom,
                    expander,
                    backgroundColorClass,
                    otherFieldsLength,
                    handleCollapse,
                    expanderCol,
                    index,
                    actionField,
                    primaryField,
                    compareCollapse,
                    defaultDisplay,
                    collapsibleFields,
                    IndeterminateCheckbox,
                    row,
                    submitInput,
                    cellValue,
                    setCellValue,
                    state
                  }}
                />
              );
            })}
          </div>
        </Collapse>
      )}
    </div>
  );
};

export default RenderSubCard;
