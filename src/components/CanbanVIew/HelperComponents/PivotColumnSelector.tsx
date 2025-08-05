import { Autocomplete, TextField } from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import { Column } from 'src/components/CanbanView/types';

const PIVOTABLE_COLUMN_TYPES = ['dropDown', 'process'];

type RenderPivotColumnProps<D> = {
  columns: Column<D>[];
  defaultPivotColumnId: string;
  setPivotColumn: (column: Column<D>) => void;
  pivotColumn: Column<D> | null;
};

const getOptionLabel = <D,>(column: Column<D>) => {
  const header = column.Header || column.header;
  let renderedHead = '';
  if (typeof header === 'string') {
    renderedHead = header;
  } else if (typeof header === 'function') {
    renderedHead = header({ column: { columnDef: column } as any, header: undefined, table: undefined });
  }
  return renderedHead as string;
};

export const PivotColumnSelector = <D,>({ columns, defaultPivotColumnId, pivotColumn, setPivotColumn }: RenderPivotColumnProps<D>) => {
  const pivotableColumns = useMemo(() => {
    return columns?.filter((c) => c.option?.length > 0 && !c.lookup && PIVOTABLE_COLUMN_TYPES.includes(c.type)) || [];
  }, [columns]);

  useEffect(() => {
    if (pivotableColumns.length === 0 || !defaultPivotColumnId) return;
    const defaultPivotColumn = pivotableColumns.find((d) => (d.id || d.accessor) === defaultPivotColumnId);
    setPivotColumn(defaultPivotColumn);
  }, [defaultPivotColumnId, pivotableColumns]);

  if (pivotableColumns.length === 0) return null;
  return (
    <>
      <Autocomplete
        options={pivotableColumns}
        size="small"
        disableClearable
        getOptionLabel={getOptionLabel}
        value={pivotColumn}
        sx={{ minWidth: '150px' }}
        onChange={(event: any, newValue: Column<D> | null) => {
          if (newValue) {
            setPivotColumn(newValue);
          }
        }}
        renderInput={(params) => <TextField size="small" margin="none" {...params} label="Select Pivot Column" />}
      />
    </>
  );
};
