import React, { FC } from 'react';
import { Collapse, IconButton } from '@material-ui/core';
import { Fragment, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import type { TSwipableListInputProps } from './types';
import { KeyboardArrowUp, KeyboardArrowDown } from '@material-ui/icons';

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
  IndeterminateCheckbox
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
      <div className="relative">
        {loading ? (
          <div className=" absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.54)] dark:bg-[rgba(5,9,19,0.54)] backdrop-blur-[10px]">
            <div className="bg-[white] dark:bg-[var(--dark-secondary)] px-10 py-5 rounded-lg">
              <div className="spinner"></div>
              <p className="-ml-[3px] mt-2">Loading</p>
            </div>
          </div>
        ) : null}
        <div style={{ overflowY: 'auto', height: 'calc(100vh - 215px)' }} id={`scrollableDiv_${renderedFrom}`} className="">
          <div>
            <InfiniteScroll
              dataLength={dataRows?.length}
              next={() => {
                setTimeout(() => {
                  dispatch({ type: 'pageChange', page: page + 1 });
                }, 500);
              }}
              hasMore={dataRows?.length !== rowCount}
              loader={<h3 className="text-center border mt-3 p-3 loading-dots">Loading more items</h3>}
              scrollableTarget={`scrollableDiv_${renderedFrom}`}
              endMessage={
                !loading && dataRows?.length === rowCount ? (
                  <h3 className="text-center border px-3 py-2 mx-2">{'Total no. of records found ' + dataRows?.length}</h3>
                ) : (
                  <></>
                )
              }
            >
              {dataRows?.map((row, index) => {
                prepareRow(row);
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
                          return <RenderCellWithHeader key={field.id} field={field} row={row} />;
                        })}
                      </div>
                      <Collapse in={compareCollapse(row.original._id)}>
                        <div className="grid gap-2 w-full">
                          {collapsibleFields.map((field) => {
                            return <RenderCellWithHeader key={field.id} field={field} row={row} />;
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
                                  row
                                }}
                              />
                            );
                          })}
                        </div>
                      </Collapse>
                    )}
                  </div>
                );
              })}
            </InfiniteScroll>
          </div>
        </div>
      </div>
    </>
  );
};

const RenderSubCard = ({
  dispatch,
  allowSelection,
  dataRows,
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
  row
}: any) => {
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
            return <RenderCellWithHeader key={field.id} field={field} row={row} />;
          })}
        </div>
        <Collapse in={compareCollapse(row.original._id)}>
          <div className="grid gap-2 w-full">
            {collapsibleFields.map((field) => {
              return <RenderCellWithHeader key={field.id} field={field} row={row} />;
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
                    row
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

const RenderCellWithHeader = ({ field, row }: any) => {
  return (
    <h6 className=" text-[12px] grid grid-cols-2 justify-between gap-2 max-w-full">
      <span className="">{field.Header}: </span>
      <span className="text-[12px_!important] text-right [&>*]:text-right [&>*]:justify-end line-clamp-1 break-all [&>*]:[flex-wrap:wrap] [&>*]:[font-weight:500_!important] [&>*]:[font-size:12px_!important] [&>*]:line-clamp-1 [&>*]:[white-space:unset_!important] ">
        {field.Cell({ row })}
      </span>
    </h6>
  );
};

export type { TSwipableListInputProps };
export default SwipableListForMobile;
