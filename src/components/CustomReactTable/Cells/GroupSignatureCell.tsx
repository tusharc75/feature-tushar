import { isArray } from 'lodash';
import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CellDialog from 'src/components/CustomReactTable/Cells/CellDialog';
import RenderCellTable, { RenderCellTableColumnDef } from 'src/components/CustomReactTable/Cells/RenderCellTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { cn } from 'src/constants/helpers';

type GroupSignatureCellProps = {
  field: any;
  original: any;
  enableDilaog?: boolean;
};

function GroupSignatureCellImpl({ field, original, enableDilaog = true }: GroupSignatureCellProps) {
  const signatures = useMemo(() => (isArray(original?.[field.fieldName]) ? original?.[field.fieldName] : []), [field.fieldName, original]);

  const NoData = useMemo(() => (enableDilaog ? <NoDataCell /> : <span className="block">-</span>), [enableDilaog]);

  const columns: RenderCellTableColumnDef<any>[] = useMemo(
    () => [
      {
        accessor: 'user',
        cell: (row) => (
          <Link to={`${routes?.userDetail?.path}/${row?.user?._id}`} target="_blank" className="link" rel="noopener noreferrer">
            {row?.user?.concatedName}
          </Link>
        ),
        head: 'User',
        width: '200px'
      },
      {
        accessor: 'sign',
        cell: (row) =>
          row?.signature ? (
            <img
              className={cn(' object-contain dark:bg-white', enableDilaog ? 'h-[50px] w-[50px]' : 'h-[25px] w-[25px]')}
              alt={row?.user?.concatedName}
              src={row?.signature}
            />
          ) : (
            NoData
          ),
        head: 'Signature'
      }
    ],
    [NoData, enableDilaog]
  );

  if (!signatures?.length) return NoData;

  return (
    <CellDialog dialogTitle={field.fieldLabel} enableDilaog={enableDilaog}>
      <RenderCellTable columns={columns} data={signatures} dataMaxHeight={'400px'} enableDilaog={enableDilaog} />
    </CellDialog>
  );
}
const GroupSignatureCell = memo(GroupSignatureCellImpl);

export default GroupSignatureCell;
