import { memo, useMemo } from 'react';
import CellDialog from 'src/components/CustomReactTable/Cells/CellDialog';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import RenderCellTable, { GenericRowData, RenderCellTableColumnDef } from 'src/components/CustomReactTable/Cells/RenderCellTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { cn, sidebarResourceObjectFromValues } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';

type CounterCellProps = {
  rowData: any[];
  field: any;
  enableDilaog?: boolean;
};

const permissionForLinks = sidebarResourceObjectFromValues();

const CounterCellImpl = ({ rowData, field, enableDilaog = true }: CounterCellProps) => {
  const {
    state: { permissions }
  }: any = useData();

  const data = rowData[field.fieldName] as any & GenericRowData;
  const subFields = field.subFields;
  const isDataArray = useMemo(() => typeof Array.isArray(data), [data]);
  const isSubFieldArray = useMemo(() => typeof Array.isArray(subFields), [subFields]);
  const columns: RenderCellTableColumnDef<any>[] = useMemo(
    () =>
      subFields.map((d) => {
        const column: RenderCellTableColumnDef<any> = {
          head: d.fieldLabel,
          accessor: d.fieldName,
          cell: (row) => (
            d?.lookup ? (
              <DropdownCell permissions={permissions} permissionForLinks={permissionForLinks} field={d} original={row} />
            ) : (
              <p>
                <span className={cn('p-0', enableDilaog ? 'line-clamp-2' : 'line-clamp-1')} title={row[d.fieldName]}>
                  {row[d.fieldName]}
                </span>
              </p>
            )
          ),
          width: '150px'
        };
        return column;
      }),
    [enableDilaog, subFields]
  );

  if (!data || !subFields || !isDataArray || !isSubFieldArray || data.length === 0)
    return enableDilaog ? <NoDataCell /> : <span className="block">-</span>;

  return (
    <>
      <CellDialog dialogTitle={field.fieldLabel} enableDilaog={enableDilaog}>
        <RenderCellTable columns={columns} data={data} dataMaxHeight={'400px'} enableDilaog={enableDilaog} />
      </CellDialog>
    </>
  );
};

const CounterCell = memo(CounterCellImpl);
export default CounterCell;
