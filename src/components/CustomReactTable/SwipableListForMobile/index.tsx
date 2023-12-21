import { CircularProgress, Collapse, IconButton } from '@material-ui/core';
import { Check, Edit, Error } from '@material-ui/icons';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { BsChevronContract, BsChevronExpand } from 'react-icons/bs';
import { TInitialState } from '../hooks/useTableReducer';
import HtmlTooltip from '../../CustomTooltipTitle';
import type { TSwipableListInputProps } from './types';
import { IndeterminateCheckbox, TColType } from '../TableComponents/TableHelperComponents';
import { flexRender } from '@tanstack/react-table';
import { getCellValue, handleCellClick, handleKeyDown } from '../utils';

const DEFAULT_DATA_ROWS_VISIBLE = 3; // This number will change how many rows will be visible by default

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
  const [isAllChecked, setIsAllChecked] = useState(false);
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
        (item) => item.id !== primaryField.id && !['selection', 'action', 'expander'].includes(item.id) && item.isVisible !== false
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
          <div className=" absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.54)] dark:bg-[rgba(5,9,19,0.54)] backdrop-blur-[10px]">
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
                        {expander && expanderCol && flexRender(expanderCell.column.columnDef.cell, expanderCell.getContext())}
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
                              <h4 className="quote-name line-clamp-1 [&>*]:[font-weight:700_!important] [&_*]:[white-space:unset_!important]">
                                {primaryField.cell({ row })}
                              </h4>
                            )}
                            <div className="icon-layout  d-flex align-items-center gap-2">
                              {actionField && actionField?.cell({ row })}
                              {otherFieldsLength > DEFAULT_DATA_ROWS_VISIBLE && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCollapse(row.original._id);
                                  }}
                                >
                                  {compareCollapse(row.original._id) ? <BsChevronContract /> : <BsChevronExpand />}
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
                        <Collapse in={compareCollapse(row.original._id)}>
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
                                    depth: 1,
                                    dispatch,
                                    allowSelection,
                                    dataRows: row.subRows || [],
                                    renderedFrom,
                                    expander,
                                    backgroundColorClass,
                                    otherFieldsLength,
                                    handleCollapse,
                                    expanderCol,
                                    setIsAllChecked,
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
                })
              : !loading &&
                !error && (
                  <div className=" absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.54)] dark:bg-[rgba(5,9,19,0.54)] backdrop-blur-[10px] rounded-lg">
                    <div className="bg-[white] dark:bg-[var(--dark-secondary)] px-10 py-5 rounded-lg">
                      <p>No Data Found.</p>
                    </div>
                  </div>
                )}
          </div>
        </div>
        {dataRows?.length > 0 && footerRowFound > 0 && isClientSideGrid && (
          <>
            {table?.getFooterGroups().map((group, index) => {
              const indexCol = group?.headers?.find((g) => g.id === 'index');
              return (
                <div key={index} className="flex justify-between [border-top:1px_solid_var(--common-border-color)] pt-1 items-center mt-4 px-2">
                  <h6 className="text-[14px]">
                    {indexCol.isPlaceholder ? null : flexRender(indexCol.column.columnDef.footer, indexCol.getContext())}
                  </h6>

                  {group?.headers?.map((column) => {
                    if (!column.column.columnDef.footer || column.id === 'index') return null;
                    return (
                      <div key={column.id} className="text-truncate font-weight-bold text-black flex flex-col items-center">
                        <span>{column.isPlaceholder ? null : flexRender(column.column.columnDef.header, column.getContext())}</span>
                        <span>{column.isPlaceholder ? null : flexRender(column.column.columnDef.footer, column.getContext())}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
};

const RenderSubCard = ({
  dispatch,
  allowSelection,
  renderedFrom,
  expander,
  backgroundColorClass,
  otherFieldsLength,
  handleCollapse,
  expanderCol,
  setIsAllChecked,
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
  state
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
      }`}
      key={row.original._id}
      style={{
        border: '1px solid var(--common-border-color)',
        cursor: otherFieldsLength > DEFAULT_DATA_ROWS_VISIBLE ? 'pointer' : 'auto'
      }}
    >
      <div className={`flex gap-2 items-center`}>
        {expander && expanderCol && flexRender(expanderCell.column.columnDef.cell, expanderCell.getContext())}
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
              <h4 className="quote-name line-clamp-1 [&>*]:line-clamp-1 [&>*]:[font-weight:700_!important] [&>*]:[white-space:unset_!important]">
                {primaryField.cell({ row })}
              </h4>
            )}
            <div className="icon-layout  d-flex align-items-center gap-2">
              {actionField && actionField?.cell({ row })}
              {otherFieldsLength > DEFAULT_DATA_ROWS_VISIBLE && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCollapse(row.original._id);
                  }}
                >
                  {compareCollapse(row.original._id) ? <BsChevronContract /> : <BsChevronExpand />}
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
        <Collapse in={compareCollapse(row.original._id)}>
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
                    setIsAllChecked,
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

const RenderCellWithHeader = ({ field, row, submitInput, cellValue, setCellValue, state, dispatch }: any) => {
  const { currentEditingCellPosition }: TInitialState = state;
  const cell = row.getVisibleCells().find((cell: any) => cell?.column?.id === field?.id);
  if (!cell) return null;
  const columnDef: TColType = cell.column.columnDef as TColType;

  const resetField = () => {
    dispatch({
      type: 'currentEditingCellPosition',
      cellPosition: null
    });
  };

  const CellShell = ({ children }) => {
    return (
      <h6 className=" text-[12px] grid grid-cols-[5fr_6fr] justify-between gap-2 max-w-full">
        <span className="">{field.header}: </span>
        <span
          onKeyDown={(e) => {
            handleKeyDown({ e, currentEditingCellPosition, submitInput });
          }}
          onClick={() => {
            handleCellClick({ cell, dispatch, row, setCellValue });
          }}
          className={`text-[12px_!important] text-right [&>*]:text-right [&>*]:justify-end line-clamp-1 break-all [&>*]:[flex-wrap:wrap] [&>*]:[font-weight:500_!important] [&>*]:[font-size:12px_!important] [&>*]:line-clamp-1 [&>*]:[white-space:unset_!important] [&>div]:[flex-wrap:wrap_!important]`}
        >
          {children}
        </span>
      </h6>
    );
  };

  switch (true) {
    case !['selection'].includes(cell?.column.id) &&
      currentEditingCellPosition?.rowId === row.original._id &&
      currentEditingCellPosition?.columnName === cell?.column.id:
      return (
        <CellShell>
          <div className="w-full">
            <input
              title={`Edit-${cell.id}`}
              autoFocus
              onBlur={() => (getCellValue(cell) !== cellValue ? submitInput() : resetField())}
              value={cellValue}
              className="dark:text-[white]  appearance-none w-full focus-within:outline-[var(--new-theme-color)] bg-[transparent] outline-[transparent] shadow-0 border-[0] px-[2px] py-[4px] [border-bottom:1px_solid_var(--common-border-color)_!important]"
              onChange={(e) => setCellValue(e.target.value)}
            />
          </div>
        </CellShell>
      );
    case columnDef?.editable:
      return (
        <CellShell>
          <div className="w-full">
            <div className=" [border-bottom:1px_dashed_#8a8a8a] [display:flex_!important] gap-[20px] justify-end ml-auto cursor-pointer max-w-[max-content]">
              <p>{flexRender(cell.column.columnDef.cell, cell.getContext())}</p>
              <span>
                <Edit className="text-[rgba(0,0,0,0.3)] dark:text-[rgba(255,255,255,0.9)]" fontSize="small" />
              </span>
            </div>
          </div>
        </CellShell>
      );
    default:
      return <CellShell>{flexRender(cell.column.columnDef.cell, cell.getContext())}</CellShell>;
  }
};

export type { TSwipableListInputProps };
export default SwipableListForMobile;
