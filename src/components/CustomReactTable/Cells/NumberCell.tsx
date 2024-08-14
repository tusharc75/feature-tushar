import React from 'react';
import CellTooltip from 'src/components/CustomReactTable/Cells/CellTooltip';
import RenderCellTable, { GenericRowData, RenderCellTableColumnDef } from 'src/components/CustomReactTable/Cells/RenderCellTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const NumberCell = ({ rowData, field }) => {
  const data = rowData[field.fieldName] as any & GenericRowData;
  const subFields = field.subFields;
  const isDataArray = typeof Array.isArray(data);
  const isSubFieldArray = typeof Array.isArray(subFields);
  if (!data || !subFields || !isDataArray || !isSubFieldArray) return <NoDataCell />;

  const columns: RenderCellTableColumnDef<any>[] = subFields.map((d) => {
    const column: RenderCellTableColumnDef<any> = {
      head: d.fieldLabel,
      accessor: d.fieldName,
      cell: (row) => <span className="line-clamp-2">{row[d.fieldName]}</span>,
      width: '150px'
    };
    return column;
  });

  return (
    <CellTooltip className="max-w-[400px] overflow-auto">
      <div className="min-h-full">
        <RenderCellTable columns={columns} data={data} />
      </div>
    </CellTooltip>
  );
};

export default NumberCell;
