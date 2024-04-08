import { CircularProgress, Collapse, IconButton } from '@material-ui/core';
import { Error } from '@material-ui/icons';
import { Row, flexRender } from '@tanstack/react-table';
import React, { FC, useMemo } from 'react';
import { BsChevronContract, BsChevronExpand } from 'react-icons/bs';
import { IndeterminateCheckbox } from '../TableComponents/TableHelperComponents';
import RenderCellWithHeader from './RenderCellWithHeader';
import RenderFooter from './RenderFooter';
import RenderSubCard from './RenderSubCard';
import type { TSwipableListInputProps } from './types';

export const DEFAULT_DATA_ROWS_VISIBLE = 3; // This number will change how many rows will be visible by default

const SwipableListForMobile: FC<TSwipableListInputProps> = ({
  table,
  allColumns,
  allowSelection,
  dataRows,
  dispatch,
  loading,
  expander,
  backgroundColorClass = null,
  renderedFrom,
  state,
  submitInput,
  cellValue,
  setCellValue,
  isClientSideGrid
}) => {
  const { error } = state;
  const [expanded, setExpanded] = React.useState<string | false>(false);

  const handleCollapse = (name: string) => {
    setExpanded((prev) => (prev !== name ? name : false));
  };
  const compareCollapse = React.useCallback(
    (name: string) => {
      return expanded === name;
    },
    [expanded]
  );

  const primaryField: any | null = React.useMemo(
    () => allColumns?.find((item) => item.primaryField || item.lockPosition) || allColumns[2],
    [allColumns]
  );
  const actionField: any | null = React.useMemo(() => allColumns?.find((item) => item.id === 'action') || null, [allColumns]);

  const otherFields: any[] | null = React.useMemo(
    () =>
      allColumns?.filter(
        (item) => item.id !== primaryField?.id && !['selection', 'action', 'expander'].includes(item.id) && item.isVisible !== false
      ) || null,
    [allColumns, primaryField]
  );

  const expanderCol: any | null = React.useMemo(() => allColumns?.find((item) => item.id === 'expander') || allColumns[2], [allColumns]);
  const otherFieldsLength = React.useMemo(() => otherFields.length, [otherFields]);

  const defaultDisplay: any[] = React.useMemo(() => {
    return otherFields.slice(0, DEFAULT_DATA_ROWS_VISIBLE) || [];
  }, [otherFields]);

  const collapsibleFields: any[] = React.useMemo(() => {
    return otherFields.slice(DEFAULT_DATA_ROWS_VISIBLE, otherFieldsLength) || [];
  }, [otherFields, otherFieldsLength]);

  const footerRowFound = useMemo(() => {
    const found = table?.getFooterGroups()[0].headers.some((h) => h.column.columnDef.footer);
    return found;
  }, [table]);

  return (
    <>
      <div className="relative rounded-lg bg-[white] dark:bg-[var(--dark-primary)]">
        {/* Loader */}
        {loading || error ? (
          <div className=" absolute inset-0 z-10 [backdrop-filter:blur(var(--table-loader-bg-blur,_2px))_!important] flex items-center justify-center bg-[rgba(255,255,255,0.54)] dark:bg-[rgba(5,9,19,0.54)] ">
            <div className="bg-[white] dark:bg-[var(--dark-secondary)] px-10 py-5 rounded-lg text-center shadow-md">
              {error ? (
                <>
                  <Error className="mx-auto mb-2" />
                  <p>Something Went Wrong</p>
                </>
              ) : loading ? (
                <>
                  <CircularProgress />
                  <p>Loading...</p>
                </>
              ) : (
                ''
              )}
            </div>
          </div>
        ) : null}

        {/* Table  */}
        <div
          style={{ overflowY: 'auto', maxHeight: 'max(calc(100vh - 250px), 646px)', minHeight: '200px' }}
          id={`scrollableDiv_${renderedFrom}`}
          className=""
        >
          <div className="grid gap-2">
            {dataRows.length
              ? dataRows?.map((row, index) => {
                  if (row.depth !== 0) return null;
                  let expanderCell = null;
                  if (expander && expanderCol) {
                    expanderCell = row.getVisibleCells()[0];
                  }

                  return (
                    <div
                      className={`shadow-[0px_3px_26px_0px_rgba(0,0,0,0.06)] rounded-md px-3 py-2 [--left-gutter:20px] dark:bg-[var(--dark-secondary)] ${
                        backgroundColorClass && backgroundColorClass(row.original) + ' td-color'
                      }`}
                      key={row.original._id}
                      style={{
                        border: '1px solid var(--common-border-color)',
                        cursor: otherFieldsLength > DEFAULT_DATA_ROWS_VISIBLE ? 'pointer' : 'auto'
                      }}
                    >
                      <div className={`flex gap-2 items-center`}>
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
                          <div className="flex gap-2 justify-between items-center">
                            {primaryField && (
                              <h4 className="quote-name line-clamp-1 [&_*]:line-clamp-1 [&>*]:[font-weight:700_!important] [&_*]:[white-space:unset_!important]">
                                {primaryField.cell({ row })}
                              </h4>
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
                                />
                              );
                            })}
                          </div>
                        </Collapse>
                      )}
                    </div>
                  );
                })
              : !loading &&
                !error && (
                  <div className=" absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.54)] dark:bg-[rgba(5,9,19,0.54)] [backdrop-filter:blur(var(--table-loader-bg-blur,_2px))_!important] rounded-lg">
                    <div className="bg-[white] dark:bg-[var(--dark-secondary)] px-10 py-5 rounded-lg">
                      <p>No Data Found.</p>
                    </div>
                  </div>
                )}
          </div>
        </div>
        {dataRows?.length > 0 && footerRowFound > 0 && isClientSideGrid && <RenderFooter table={table} />}
      </div>
    </>
  );
};

export type { TSwipableListInputProps };
export default SwipableListForMobile;
