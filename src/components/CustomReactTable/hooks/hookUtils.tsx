import { memo } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { displayDate, displayDateTime } from 'src/constants/helpers';

export const headerName = {
  firstName: 'Name'
};

export const getStaticFields = (showLastActivityBy = false, showCompletedBy = false) => {
  return [
    {
      id: 'createdBy',
      accessorKey: 'createdBy',
      accessor: 'createdBy',
      size: 200,
      width: 200,
      header: 'Created By',
      Header: 'Created By',
      show: true,
      minSize: 185,
      disableFilters: true,
      cell: ({ row }) => <CreatedByCell row={row} />
    },
    {
      id: 'updatedBy',
      accessorKey: 'updatedBy',
      accessor: 'updatedBy',
      size: 200,
      header: 'Updated By',
      Header: 'Updated By',
      width: 200,
      minSize: 185,
      show: true,
      disableFilters: true,
      cell: ({ row }) => <UpdatedByCell row={row} />
    },
    ...(showCompletedBy ? [{
      id: 'completedBy',
      accessorKey: 'completedBy',
      accessor: 'completedBy',
      size: 200,
      width: 200,
      header: 'Completed By',
      Header: 'CompletedBy',
      show: true,
      minSize: 185,
      disableFilters: true,
      cell: ({ row }) => <CompletedByCell row={row} />
    }] : []),
    ...(showLastActivityBy ? [{
      id: 'lastActivityBy',
      accessorKey: 'lastActivityBy',
      accessor: 'lastActivityBy',
      size: 200,
      Header: 'Last Activity By',
      width: 200,
      minSize: 185,
      show: true,
      disableFilters: true,
      cell: ({ row }) => <LastActivityByCell row={row} />
    }] : [])
  ];
};

const CreatedByCell = memo(({ row }: any) => {
  return row?.original?.createdBy ? (
    <HtmlTooltip title={`${row?.original?.createdBy} • ${displayDateTime(row?.original?.createdByDate)}`}>
      <h5 className="flex">
        {row?.original?.createdBy}
        <span className="hidden">&nbsp;-&nbsp;</span>
        <span className="createdAtTime badge-date">{displayDate(row?.original?.createdByDate)}</span>
      </h5>
    </HtmlTooltip>
  ) : (
    <NoDataCell />
  );
});

const UpdatedByCell = memo(({ row }: any) => {
  return row?.original?.updatedBy ? (
    <HtmlTooltip title={`${row?.original?.updatedBy} • ${displayDateTime(row?.original?.updatedByDate)}`}>
      <h5 className="flex">
        {row?.original?.updatedBy}&nbsp;
        <span className="updatedAtTime badge-date">{displayDate(row?.original?.updatedByDate)}</span>
      </h5>
    </HtmlTooltip>
  ) : (
    <NoDataCell />
  );
});

const CompletedByCell = memo(({ row }: any) => {
  return row?.original?.completedBy ? (
    <HtmlTooltip title={`${row?.original?.completedBy} • ${displayDate(row?.original?.completedByDate)}`}>
      <h5 className="createBy">
        {row?.original?.completedBy}
        <span className="hidden">&nbsp;-&nbsp;</span>
        <span className="createdAtTime badge-date">{displayDate(row?.original?.completedByDate)}</span>
      </h5>
    </HtmlTooltip >
  ) : (
    <NoDataCell />
  );
});

const LastActivityByCell = memo(({ row }: any) => {
  return row?.original?.lastActivityBy ? (
    <HtmlTooltip title={`${row?.original?.lastActivityBy} • ${displayDateTime(row?.original?.lastActivityByDate)}`}>
      <h5 className="flex" >
        {row?.original?.lastActivityBy}&nbsp;
        <span className="updatedAtTime badge-date">{displayDate(row?.original?.lastActivityByDate)}</span>
      </h5>
    </HtmlTooltip>
  ) : (
    <NoDataCell />
  );
});

export const getSortedColumns = (columns = []) => {
  return columns.sort(function (a, b) {
    let columnNameA = a?.headerName?.toUpperCase(); // ignore upper and lowercase
    let columnNameB = b?.headerName?.toUpperCase(); // ignore upper and lowercase
    if (columnNameA < columnNameB) {
      return -1;
    }
    if (columnNameA > columnNameB) {
      return 1;
    }
    return 0;
  });
};

export const staticColumns = ['createdBy', 'updatedBy'];
