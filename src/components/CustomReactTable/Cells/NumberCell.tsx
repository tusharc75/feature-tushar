import CellDialog from 'src/components/CustomReactTable/Cells/CellDialog';
import RenderCellTable, { GenericRowData, RenderCellTableColumnDef } from 'src/components/CustomReactTable/Cells/RenderCellTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { cn } from 'src/constants/helpers';

type NumberCellProps = {
  rowData: any[];
  field: any;
  enableDilaog?: boolean;
};

const NumberCell = ({ rowData, field, enableDilaog = true }: NumberCellProps) => {
  const data = rowData[field.fieldName] as any & GenericRowData;
  const subFields = field.subFields;
  const isDataArray = typeof Array.isArray(data);
  const isSubFieldArray = typeof Array.isArray(subFields);
  if (!data || !subFields || !isDataArray || !isSubFieldArray || data.length === 0)
    return enableDilaog ? <NoDataCell /> : <span className="block">-</span>;

  const columns: RenderCellTableColumnDef<any>[] = subFields.map((d) => {
    const column: RenderCellTableColumnDef<any> = {
      head: d.fieldLabel,
      accessor: d.fieldName,
      cell: (row) => (
        <p>
          <span className={cn('p-0', enableDilaog ? 'line-clamp-2' : 'line-clamp-1')} title={row[d.fieldName]}>
            {row[d.fieldName]}
          </span>
        </p>
      ),
      width: '150px'
    };
    return column;
  });

  return (
    <>
      <CellDialog dialogTitle={field.fieldLabel} enableDilaog={enableDilaog}>
        <RenderCellTable columns={columns} data={data} dataMaxHeight={'400px'} enableDilaog={enableDilaog} />
      </CellDialog>
    </>
  );
};

export default NumberCell;
