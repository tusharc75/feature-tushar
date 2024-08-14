import { isArray } from 'lodash';
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

function GroupSignatureCell({ field, original, enableDilaog = true }: GroupSignatureCellProps) {
  const signatures = isArray(original?.[field.fieldName]) ? original?.[field.fieldName]?.filter((ele) => ele.user && ele.signature) : [];
  const NoData = enableDilaog ? <NoDataCell /> : <span className="block">-</span>;
  if (!signatures?.length) return NoData;

  const columns: RenderCellTableColumnDef<any>[] = [
    {
      accessor: 'user',
      cell: (row) => (
        <Link to={`${routes?.userDetail?.path}/${row?.user?._id}`} target="_blank" className="link" rel="noopener noreferrer">
          {row?.user?.concatedName}
        </Link>
      ),
      head: 'User Name',
      width: '200px'
    },
    {
      accessor: 'sign',
      cell: (row) =>
        row?.signature ? (
          <img
            className={cn(' object-contain dark:[filter:invert(1)]', enableDilaog ? 'h-[50px] w-[50px]' : 'h-[25px] w-[25px]')}
            alt={row?.user?.concatedName}
            src={row?.signature}
          />
        ) : (
          NoData
        ),
      head: 'Signature'
    }
  ];

  return (
    <CellDialog dialogTitle={field.fieldLabel} enableDilaog={enableDilaog}>
      <RenderCellTable columns={columns} data={signatures} dataMaxHeight={'400px'} enableDilaog={enableDilaog} />
    </CellDialog>
  );
}

export default GroupSignatureCell;
