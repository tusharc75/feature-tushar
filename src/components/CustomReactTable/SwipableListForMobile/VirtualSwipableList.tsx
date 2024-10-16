import { Collapse, IconButton } from '@material-ui/core';
import { flexRender } from '@tanstack/react-table';
import { BsChevronContract, BsChevronExpand } from 'react-icons/bs';
import { DEFAULT_DATA_ROWS_VISIBLE } from 'src/components/CustomReactTable/SwipableListForMobile';
import { IndeterminateCheckbox } from '../TableComponents/TableHelperComponents';
import RenderCellWithHeader from './RenderCellWithHeader';
import RenderSubCard from './RenderSubCard';
import React, { useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualSwipableList = ({
  dataRows,
  expander,
  expanderCol,
  backgroundColorClass,
  renderedFrom,
  otherFieldsLength,
  allowSelection,
  primaryField,
  actionField,
  table,
  collapsibleFields,
  defaultDisplay,
  submitInput,
  cellValue,
  setCellValue,
  onRowClick,
  state,
  dispatch,
  loading
}) => {
  const { error } = state;
  const [expanded, setExpanded] = React.useState<string | false>(false);
  const parentRef = React.useRef<HTMLDivElement>(null);

  const handleCollapse = (name: string) => {
    setExpanded((prev) => (prev !== name ? name : false));
  };

  const compareCollapse = React.useCallback(
    (name: string) => {
      return expanded === name;
    },
    [expanded]
  );

  const rowVirtualizer = useVirtualizer({
    count: dataRows?.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 167,
    overscan: 6
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [dataRows.length]);

  const rows = rowVirtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="max-h-[max(calc(100vh_-_250px),646px)] min-h-[400px] overflow-y-auto" id={`scrollableDiv_${renderedFrom}`}>
      <div className={`relative w-full`} style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {dataRows.length && rows.length ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${rows[0]?.start ?? 0}px)`
            }}
          >
            {rows.map((virtualRow, index) => {
              const row = dataRows[virtualRow.index];
              if (!row) return null;
              if (row.depth !== 0) return null;
              let expanderCell = null;
              if (expander && expanderCol) {
                expanderCell = row.getVisibleCells()[0];
              }

              return (
                <div key={row.original._id} className="pb-2">
                  <div
                    className={`rounded-md px-3 py-2 shadow-[0px_3px_26px_0px_rgba(0,0,0,0.06)] [--left-gutter:20px] dark:bg-[var(--dark-secondary)] ${
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
                      {expander && expanderCol && flexRender(expanderCell.column.columnDef.cell, expanderCell?.getContext())}
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
                              <h6 className="line-clamp-1 text-[8px] font-medium text-[var(--dark-secondary-text,#8b8b8b)]">
                                {primaryField.header}:
                              </h6>
                              <h4 className="quote-name line-clamp-1 [&>*]:[font-weight:700_!important] [&_*]:line-clamp-1 [&_*]:[font-size:12px_!important] [&_*]:[white-space:unset_!important]">
                                {primaryField.cell({ row, table })}
                              </h4>
                            </div>
                          )}
                          <div className="icon-layout  d-flex align-items-center gap-2">
                            {actionField && actionField?.cell?.({ row, table })}
                            {collapsibleFields.length > 0 && (
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
                    <div
                      className="mt-2 grid gap-2 px-2 pt-2"
                      style={{ borderTop: collapsibleFields.length > 0 ? '1px dashed var(--common-border-color)' : '0px' }}
                    >
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
                                depth={1}
                                dataRows={row.subRows || []}
                                table={table}
                                dispatch={dispatch}
                                allowSelection={allowSelection}
                                renderedFrom={renderedFrom}
                                expander={expander}
                                backgroundColorClass={backgroundColorClass}
                                otherFieldsLength={otherFieldsLength}
                                handleCollapse={handleCollapse}
                                expanderCol={expanderCol}
                                index={index}
                                actionField={actionField}
                                primaryField={primaryField}
                                compareCollapse={compareCollapse}
                                defaultDisplay={defaultDisplay}
                                collapsibleFields={collapsibleFields}
                                IndeterminateCheckbox={IndeterminateCheckbox}
                                row={row}
                                submitInput={submitInput}
                                cellValue={cellValue}
                                setCellValue={setCellValue}
                                state={state}
                                onRowClick={onRowClick}
                              />
                            );
                          })}
                        </div>
                      </Collapse>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !loading &&
          !error && (
            <div className=" absolute inset-0 flex items-center justify-center rounded-lg bg-[rgba(255,255,255,0.54)] [backdrop-filter:blur(var(--table-loader-bg-blur,_2px))_!important] dark:bg-[rgba(5,9,19,0.54)]">
              <div className="rounded-lg bg-[white] px-10 py-5 dark:bg-[var(--dark-secondary)]">
                <p>No Data Found.</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default VirtualSwipableList;
