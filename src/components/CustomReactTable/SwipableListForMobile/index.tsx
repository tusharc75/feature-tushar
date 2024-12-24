import { CircularProgress } from '@mui/material';
import { Error } from '@mui/icons-material';
import React, { FC, useMemo } from 'react';
import VirtualSwipableList from 'src/components/CustomReactTable/SwipableListForMobile/VirtualSwipableList';
import RenderFooter from './RenderFooter';
import type { TSwipableListInputProps } from './types';

export const DEFAULT_DATA_ROWS_VISIBLE = 3; // This number will change how many rows will be visible by default

const SwipableListForMobile: FC<TSwipableListInputProps> = ({
  table,
  allColumns,
  allowSelection,
  dispatch,
  expander,
  backgroundColorClass = null,
  renderedFrom,
  state,
  submitInput,
  cellValue,
  setCellValue,
  isClientSideGrid,
  onRowClick
}) => {
  const { error, loading, initialDataLoaded } = state;
  const dataRows = table.getRowModel().rows;

  const primaryField: any | null = React.useMemo(
    () => allColumns?.find((item) => item.primaryField || item.lockPosition) || allColumns[2],
    [allColumns]
  );
  const actionField: any | null = React.useMemo(
    () => allColumns?.find((item) => item.id === 'action' && item.isVisible !== false) || null,
    [allColumns]
  );

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
        {loading || error || !initialDataLoaded ? (
          <div className=" absolute inset-0 z-10 flex items-center justify-center bg-[rgba(255,255,255,0.54)] [backdrop-filter:blur(var(--table-loader-bg-blur,_2px))_!important] dark:bg-[rgba(5,9,19,0.54)] ">
            <div className="rounded-lg bg-[white] px-10 py-5 text-center shadow-md dark:bg-[var(--dark-secondary)]">
              {error ? (
                <>
                  <Error className="mx-auto mb-2" />
                  <p>Something Went Wrong</p>
                </>
              ) : loading || !initialDataLoaded ? (
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
        <VirtualSwipableList
          {...{
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
          }}
        />
        {dataRows?.length > 0 && footerRowFound > 0 && isClientSideGrid && <RenderFooter table={table} />}
      </div>
    </>
  );
};

export type { TSwipableListInputProps };
export default SwipableListForMobile;
