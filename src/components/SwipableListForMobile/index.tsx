import { Collapse, IconButton } from '@material-ui/core';
import { Check, Edit, KeyboardArrowDown, KeyboardArrowUp } from '@material-ui/icons';
import React, { FC, useState } from 'react';
import type { TSwipableListInputProps } from './types';
import HtmlTooltip from '../CustomTooltipTitle';
import { TInitialState } from '../CustomReactTableNew/useTableReducer';

const DEFAULT_DATA_COUNT = 4;

const SwipableListForMobile: FC<TSwipableListInputProps> = ({
  dispatch,
  allowSelection,
  allColumns,
  dataRows,
  rowCount,
  renderedFrom,
  page,
  loading,
  expander,
  backgroundColor = null,
  prepareRow,
  handleCellSelection,
  IndeterminateCheckbox,
  toggleAllRowsSelected,
  submitInput,
  cellValue,
  setCellValue,
  state,
  handleCellClick,
  handleKeyDown
}) => {
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

  const primaryField: any | null = React.useMemo(() => allColumns?.find((item) => item.primaryField) || allColumns[2], [allColumns]);
  const actionField: any | null = React.useMemo(() => allColumns?.find((item) => item.id === 'action') || null, [allColumns]);

  const otherFields: any[] | null = React.useMemo(
    () => allColumns?.filter((item) => !item.primaryField && !['selection', 'action', 'expander'].includes(item.id) && item.isVisible) || null,
    [allColumns]
  );
  const expanderCol: any | null = React.useMemo(() => allColumns?.find((item) => item.id === 'expander') || allColumns[2], [allColumns]);
  const otherFieldsLength = React.useMemo(() => otherFields.length, [otherFields]);

  const defaultDisplay: any[] = React.useMemo(() => {
    return otherFields.slice(0, DEFAULT_DATA_COUNT) || [];
  }, [otherFields]);

  const collapsibleFields: any[] = React.useMemo(() => {
    return otherFields.slice(DEFAULT_DATA_COUNT, otherFieldsLength) || [];
  }, [otherFields, otherFieldsLength]);

  return (
    <>
      <div className="relative rounded-lg">
        {/* Loader */}
        {loading ? (
          <div className=" absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.54)] dark:bg-[rgba(5,9,19,0.54)] backdrop-blur-[10px]">
            <div className="bg-[white] dark:bg-[var(--dark-secondary)] px-10 py-5 rounded-lg">
              <div className="spinner"></div>
              <p className="-ml-[3px] mt-2">Loading</p>
            </div>
          </div>
        ) : null}

        {/* Table  */}
        <div
          style={{ overflowY: 'auto', maxHeight: 'max(calc(100vh - 250px), 646px)', minHeight: '200px' }}
          id={`scrollableDiv_${renderedFrom}`}
          className=""
        >
          <div>
            {dataRows.length
              ? dataRows?.map((row, index) => {
                  prepareRow(row);
                  if (row.depth !== 0) return null;
                  return (
                    <div
                      className={`shadow-[0px_3px_26px_0px_rgba(0,0,0,0.06)] rounded-md my-2 px-3 py-2 [--left-gutter:20px] dark:bg-[var(--dark-secondary)] ${backgroundColor(
                        row.original
                      )}`}
                      key={row.original._id}
                      style={{
                        border: '1px solid var(--common-border-color)',
                        cursor: otherFieldsLength > DEFAULT_DATA_COUNT ? 'pointer' : 'auto'
                      }}
                    >
                      <div className={`flex gap-2 items-center`}>
                        {expander && expanderCol && expanderCol.Cell({ row })}
                        {allowSelection && !row.original.hideSelection && (
                          <div>
                            <IndeterminateCheckbox onClick={() => handleCellSelection(row)} {...row.getToggleRowSelectedProps?.()} />
                          </div>
                        )}
                        <div className="flex-grow">
                          <div className="flex gap-2 justify-between items-center">
                            {primaryField && (
                              <h4 className="quote-name line-clamp-1 [&>*]:line-clamp-1 [&>*]:[font-weight:700_!important] [&>*]:[white-space:unset_!important]">
                                {primaryField.Cell({ row })}
                              </h4>
                            )}
                            <div className="icon-layout  d-flex align-items-center gap-2">
                              {actionField && actionField?.Cell({ row })}
                              {otherFieldsLength > DEFAULT_DATA_COUNT && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCollapse(row.original._id);
                                  }}
                                >
                                  {compareCollapse(row.original._id) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
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
                                handleCellClick={handleCellClick}
                                handleKeyDown={handleKeyDown}
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
                                  handleCellClick={handleCellClick}
                                  handleKeyDown={handleKeyDown}
                                  dispatch={dispatch}
                                />
                              );
                            })}
                          </div>
                        </Collapse>
                      </div>
                      {expander && (
                        <Collapse in={row.isExpanded}>
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
                                    backgroundColor,
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
                                    handleCellSelection,
                                    row,
                                    submitInput,
                                    cellValue,
                                    setCellValue,
                                    state,
                                    handleCellClick,
                                    handleKeyDown
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
              : !loading && (
                  <div className=" absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.54)] dark:bg-[rgba(5,9,19,0.54)] backdrop-blur-[10px] rounded-lg">
                    <div className="bg-[white] dark:bg-[var(--dark-secondary)] px-10 py-5 rounded-lg">
                      <p>No Data Found.</p>
                    </div>
                  </div>
                )}
          </div>
        </div>
      </div>
    </>
  );
};

const RenderSubCard = ({
  dispatch,
  allowSelection,
  renderedFrom,
  expander,
  backgroundColor,
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
  handleCellSelection,
  row,
  depth = 1,
  submitInput,
  cellValue,
  setCellValue,
  state,
  handleCellClick,
  handleKeyDown
}: any) => {
  if (row.depth !== depth) return null;
  return (
    <div
      className={`shadow-[0px_3px_26px_0px_rgba(0,0,0,0.06)] rounded-md my-2 px-3 py-2 [--left-gutter:20px] dark:bg-[var(--dark-secondary)] ${backgroundColor(
        row.original
      )}`}
      key={row.original._id}
      style={{
        border: '1px solid var(--common-border-color)',
        cursor: otherFieldsLength > DEFAULT_DATA_COUNT ? 'pointer' : 'auto'
      }}
    >
      <div className={`flex gap-2 items-center`}>
        {expander && expanderCol && expanderCol.Cell({ row })}
        {allowSelection && !row.original.hideSelection && (
          <div>
            <IndeterminateCheckbox onClick={() => handleCellSelection(row)} {...row.getToggleRowSelectedProps?.()} />
          </div>
        )}
        <div className="flex-grow">
          <div className="flex gap-2 justify-between items-center">
            {primaryField && (
              <h4 className="quote-name line-clamp-1 [&>*]:line-clamp-1 [&>*]:[font-weight:700_!important] [&>*]:[white-space:unset_!important]">
                {primaryField.Cell({ row })}
              </h4>
            )}
            <div className="icon-layout  d-flex align-items-center gap-2">
              {actionField && actionField?.Cell({ row })}
              {otherFieldsLength > DEFAULT_DATA_COUNT && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCollapse(row.original._id);
                  }}
                >
                  {compareCollapse(row.original._id) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
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
                handleCellClick={handleCellClick}
                handleKeyDown={handleKeyDown}
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
                  handleCellClick={handleCellClick}
                  handleKeyDown={handleKeyDown}
                  dispatch={dispatch}
                />
              );
            })}
          </div>
        </Collapse>
      </div>
      {expander && (
        <Collapse in={row.isExpanded}>
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
                    backgroundColor,
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
                    handleCellSelection,
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

const RenderCellWithHeader = ({ field, row, submitInput, handleCellClick, handleKeyDown, cellValue, setCellValue, state, dispatch }: any) => {
  const { currentEditingCellPosition }: TInitialState = state;
  const cell = row.cells.find((cell: any) => cell?.column?.id === field?.id);
  if (!cell) return null;

  const resetField = () => {
    dispatch({
      type: 'currentEditingCellPosition',
      cellPosition: null
    });
  };

  return (
    <h6 className=" text-[12px] grid grid-cols-2 justify-between gap-2 max-w-full">
      <span className="">{field.Header}: </span>
      <span
        onKeyDown={(e) => {
          handleKeyDown(e);
        }}
        onClick={() => {
          handleCellClick(cell, row);
        }}
        className="text-[12px_!important] text-right [&>*]:text-right [&>*]:justify-end line-clamp-1 break-all [&>*]:[flex-wrap:wrap] [&>*]:[font-weight:500_!important] [&>*]:[font-size:12px_!important] [&>*]:line-clamp-1 [&>*]:[white-space:unset_!important] "
      >
        {!['selection'].includes(cell?.column.id) &&
        currentEditingCellPosition?.rowId === row.original._id &&
        currentEditingCellPosition?.columnName === cell?.column.id ? (
          <input
            title={`Edit-${cell.id}`}
            autoFocus
            onBlur={() => (cell.value !== cellValue ? submitInput() : resetField())}
            value={cellValue}
            className={` appearance-none w-full focus-within:outline-[var(--new-theme-color)] bg-[transparent] outline-[transparent] shadow-0 border-[0] px-[2px] py-[4px] [border-bottom:1px_solid_var(--common-border-color)_!important]`}
            onChange={(e) => setCellValue(e.target.value)}
          />
        ) : currentEditingCellPosition?.rowId === row.original._id && cell?.column.id === 'action' ? (
          <HtmlTooltip title="Save">
            <IconButton size="small" aria-label="Save" onClick={submitInput}>
              <Check color="primary" />
            </IconButton>
          </HtmlTooltip>
        ) : cell.column?.editable && cell?.value ? (
          <div style={{ borderBottom: '1px dashed #8a8a8a', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
            <p>{cell?.value}</p>
            <span>
              <Edit color="disabled" fontSize="small" />
            </span>
          </div>
        ) : (
          field.Cell({ row })
        )}
      </span>
    </h6>
  );
};

export type { TSwipableListInputProps };
export default SwipableListForMobile;
