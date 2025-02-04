import { memo } from 'react';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { displayDate } from 'src/constants/helpers';

export const headerName = {
  firstName: 'Name'
};

export const getStaticFields = () => {
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
    }
  ];
};

const CreatedByCell = memo(({ row }: any) => {
  return row?.original?.createdBy ? (
    <h5 className="createBy" title={`${row?.original?.createdBy} • ${displayDate(row?.original?.createdByDate)}`}>
      {row?.original?.createdBy}
      <span className="hidden">&nbsp;-&nbsp;</span>
      <span className="createdAtTime badge-date">{displayDate(row?.original?.createdByDate)}</span>
    </h5>
  ) : (
    <NoDataCell />
  );
});

const UpdatedByCell = memo(({ row }: any) => {
  return row?.original?.updatedBy ? (
    <h5 className="updateBy" title={`${row?.original?.updatedBy} • ${displayDate(row?.original?.updatedByDate)}`}>
      {row?.original?.updatedBy}&nbsp;
      <span className="updatedAtTime badge-date">{displayDate(row?.original?.updatedByDate)}</span>
    </h5>
  ) : (
    <NoDataCell />
  );
});

export const getCompletedByField = () => {
  return [
    {
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
    }
  ];
};

const CompletedByCell = memo(({ row }: any) => {
  return row?.original?.completedBy ? (
    <h5 className="createBy" title={`${row?.original?.completedBy} • ${displayDate(row?.original?.completedByDate)}`}>
      {row?.original?.completedBy}
      <span className="hidden">&nbsp;-&nbsp;</span>
      <span className="createdAtTime badge-date">{displayDate(row?.original?.completedByDate)}</span>
    </h5>
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
