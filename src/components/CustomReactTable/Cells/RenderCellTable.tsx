import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import React from 'react';

type RenderCellTableProps<T> = {
  columns: RenderCellTableColumnDef<T>[];
  data: T[];
  dataMaxHeight?: string;
};

export type GenericRowData = {
  _id: string;
};

export type RenderCellTableColumnDef<T> = {
  head: React.ReactNode;
  accessor: string;
  cell: (d: T) => React.ReactNode;
  width?: string;
};

function RenderCellTable<T extends GenericRowData>({ columns, data, dataMaxHeight = '400px' }: RenderCellTableProps<T>) {
  return (
    <TableContainer component={Paper} elevation={0} style={{ maxHeight: dataMaxHeight ? dataMaxHeight : 'auto' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.accessor} component={'th'} style={{ width: column.width ? column.width : 'auto' }}>
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

export default RenderCellTable;
