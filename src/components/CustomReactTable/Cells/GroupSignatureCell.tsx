import { Popper } from '@material-ui/core';
import { useState } from 'react';
import { IoCaretDown } from 'react-icons/io5';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import Carousel from 'react-material-ui-carousel';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import { isArray } from 'lodash';
import CellTooltip from 'src/components/CustomReactTable/Cells/CellTooltip';
import RenderCellTable, { RenderCellTableColumnDef } from 'src/components/CustomReactTable/Cells/RenderCellTable';

function GroupSignatureCell({ field, original }) {
  const signatures = isArray(original?.[field.fieldName]) ? original?.[field.fieldName]?.filter((ele) => ele.user && ele.signature) : [];

  const columns: RenderCellTableColumnDef<any>[] = [
    {
      accessor: 'user',
      cell: (row) => (
        <Link to={`${routes?.userDetail?.path}/${row?.user?._id}`} target="_blank" className="link" rel="noopener noreferrer">
          {row?.user?.concatedName}
        </Link>
      ),
      head: 'User Name'
    },
    {
      accessor: 'sign',
      cell: (row) => <img className="h-[50px] w-[50px] object-contain dark:[filter:invert(1)]" alt={row?.user?.concatedName} src={row?.signature} />,
      head: 'Signature'
    }
  ];

  return (
    <div>
      {signatures?.length ? (
        <CellTooltip expandViewHead={field.fieldLabel}>
          {(view) => <RenderCellTable columns={columns} data={signatures} dataMaxHeight={view === 'tooltip' ? '200px' : '400px'} />}
        </CellTooltip>
      ) : (
        <NoDataCell />
      )}
    </div>
  );
}

export default GroupSignatureCell;
