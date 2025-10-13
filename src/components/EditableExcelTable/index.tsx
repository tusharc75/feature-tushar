import React from 'react';
import { EditableExcelTableProps } from './types';
import TableHead from './TableHead';
import useEditableExcelTable from './useEditableExcelTable';
import TableBody from './TableBody';

const EditableExcelTable = ({ columns, data, onChange }: EditableExcelTableProps) => {
  const { tableBodyRef, tableData } = useEditableExcelTable(data, columns);
  return (
    <table>
      <thead>
        <TableHead columns={columns} />
      </thead>
      <tbody ref={tableBodyRef}>
        <TableBody columns={columns} data={tableData} />
      </tbody>
    </table>
  );
};

export default EditableExcelTable;
