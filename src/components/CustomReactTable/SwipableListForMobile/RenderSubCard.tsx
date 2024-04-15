import { Collapse, IconButton } from '@material-ui/core';
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
      className={`shadow-[0px_3px_26px_0px_rgba(0,0,0,0.06)] rounded-md my-2 px-3 py-2 [--left-gutter:20px] dark:bg-[var(--dark-secondary)] ${
        backgroundColorClass && backgroundColorClass(row.original) + ' td-color'
      } ${typeof onRowClick === 'function' ? 'focus:[box-shadow:inset_0px_0px_0px_1px_var(--primary-text)] focus:outline-0' : ''}`}
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
      <div className={`flex gap-2 items-center`}>
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
          <div className="flex gap-2 justify-between items-center">
            {primaryField && (
              <div className="line-clamp-1">
                <h6 className="text-[var(--dark-secondary-text,#8b8b8b)] text-[8px] font-medium line-clamp-1">{primaryField.header}:</h6>
                <h4 className="quote-name line-clamp-1 [&_*]:[font-size:12px_!important] [&_*]:line-clamp-1  [&>*]:[font-weight:700_!important] [&_*]:[white-space:unset_!important]">
                  {primaryField.cell({ row })}
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
      <div className="px-2 mt-2 pt-2 grid gap-2" style={{ borderTop: '1px dashed var(--common-border-color)' }}>
        <div className="grid gap-2 w-full">
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
          <div className="grid gap-2 w-full">
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
        <Collapse in={row.getIsExpanded()}>
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
