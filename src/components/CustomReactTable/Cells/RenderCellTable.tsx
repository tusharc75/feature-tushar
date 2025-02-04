import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import React, { memo } from 'react';

type RenderCellTableProps<T> = {
  columns: RenderCellTableColumnDef<T>[];
  data: T[];
  dataMaxHeight?: string;
  enableDilaog?: boolean;
};

export type GenericRowData = {
  _id: string;
};

export type RenderCellTableColumnDef<T> = {
  head?: React.ReactNode;
  accessor: string;
  cell: (d: T) => React.ReactNode;
  width?: string;
};

function RenderCellTableImpl<T extends GenericRowData>({ columns, data, dataMaxHeight = '400px', enableDilaog = true }: RenderCellTableProps<T>) {
  return (
    <TableContainer component={Paper} elevation={0} style={{ maxHeight: dataMaxHeight ? dataMaxHeight : 'auto' }}>
      <Table stickyHeader size={enableDilaog ? 'medium' : 'small'}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.accessor}
                component={'th'}
                style={{ minWidth: column.width ? column.width : 'auto' }}
                className="bg-white dark:!bg-[rgba(0,0,0,13%)]"
              >
                {column.head}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row._id}>
              {columns.map((column) => (
                <TableCell key={column.accessor}>{column.cell(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const RenderCellTable = memo(RenderCellTableImpl);

export default RenderCellTable;
