import moment from 'moment';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { dateFormat } from 'src/constants/helpers';
import routes from '../../Helpers/Routes';

export const headerName = {
  firstName: 'Name'
};

export const detailPagePath = {
  leads: routes?.leadDetail?.path,
  owner: routes?.userDetail?.path,
  user: routes?.userDetail?.path,
  collaborator: routes?.userDetail?.path,
  rental: routes.rentalManagementDetail.path,
  deliveryPerson: routes?.userDetail?.path,
  pDFTemplate: routes?.quotePdfTemplateDetail?.path,
  subMarketSegment: routes?.marketSegment?.path,
  customerContact: routes?.customerContactDetail?.path,
  supplierContact: routes?.supplierContactDetail?.path
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
      cell: ({ row }) =>
        row?.original?.createdBy ? (
          <h5 className="createBy" title={`${row?.original?.createdBy} • ${moment(row?.original?.createdByDate?.slice(0, 10)).format(dateFormat)}`}>
            {row?.original?.createdBy}
            <span className="hidden">&nbsp;-&nbsp;</span>
            <span className="createdAtTime badge-date">{moment(row?.original?.createdByDate?.slice(0, 10)).format(dateFormat)}</span>
          </h5>
        ) : (
          <NoDataCell />
        )
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
      cell: ({ row }) =>
        row?.original?.updatedBy ? (
          <h5 className="updateBy" title={`${row?.original?.updatedBy} • ${moment(row?.original?.updatedByDate?.slice(0, 10)).format(dateFormat)}`}>
            {row?.original?.updatedBy}&nbsp;
            <span className="updatedAtTime badge-date">{moment(row?.original?.updatedByDate?.slice(0, 10)).format(dateFormat)}</span>
          </h5>
        ) : (
          <NoDataCell />
        )
    }
  ];
};

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
      cell: ({ row }) =>
        row?.original?.completedBy ? (
          <h5
            className="createBy"
            title={`${row?.original?.completedBy} • ${moment(row?.original?.completedByDate?.slice(0, 10)).format(dateFormat)}`}
          >
            {row?.original?.completedBy}
            <span className="hidden">&nbsp;-&nbsp;</span>
            <span className="createdAtTime badge-date">{moment(row?.original?.completedByDate?.slice(0, 10)).format(dateFormat)}</span>
          </h5>
        ) : (
          <NoDataCell />
        )
    }
  ];
};

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
