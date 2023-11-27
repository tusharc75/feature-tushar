import camelCase from 'lodash/camelCase';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import moment from 'moment';
import { Avatar } from '@material-ui/core';
import { dateFormat, dateTimeFormat, sidebarResourceObjectFromValues } from 'src/constants/helpers';
import { leadDetailPage } from 'src/routes/Lead';
import routes from '../Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { Image } from '@material-ui/icons';

const permissionForLinks = sidebarResourceObjectFromValues();

export const headerName = {
  firstName: 'Name'
};
export const isRenderWithCopy = (name) => {
  return ['mobileNumber', 'phone', 'email'].indexOf(name) >= 0;
};
const hideColumns = ['salutation', 'middleName', 'lastName', 'suffix'];
export const detailPagePath = {
  leads: leadDetailPage.path,
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

export const disabledColumns = {
  [routes.rentalManagementDetail.title]: [],
  [routes.deliveryTicketDetail.title]: [],
  [routes.lead.title]: ['firstName']
};

export const getStaticFields = () => {
  return [
    {
      accessor: 'createdBy',
      Header: 'Created By',
      show: true,
      minWidth: 185,
      canFilter: false,
      Cell: ({ row }) =>
        row?.original?.createdBy ? (
          <h5 className="createBy" title={`${row?.original?.createdBy} • ${moment(row?.original?.createdByDate.slice(0, 10)).format(dateFormat)}`}>
            {row?.original?.createdBy}
            <span className="createdAtTime badge-date">{moment(row?.original?.createdByDate.slice(0, 10)).format(dateFormat)}</span>
          </h5>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'updatedBy',
      Header: 'Updated By',
      minWidth: 185,
      show: true,
      canFilter: false,
      Cell: ({ row }) =>
        row?.original?.updatedBy ? (
          <h5 className="updateBy" title={`${row?.original?.updatedBye} • ${moment(row?.original?.updatedByDate.slice(0, 10)).format(dateFormat)}`}>
            {row?.original?.updatedBy}
            <span className="updatedAtTime badge-date">{moment(row?.original?.updatedByDate.slice(0, 10)).format(dateFormat)}</span>
          </h5>
        ) : (
          <NoDataCell />
        )
    }
  ];
};

export const getColumnHiddenStatus = (renderedFrom, fieldName) => {
  let data = localStorage.getItem('gridMetaData');
  let gridMetaData = data == 'undefined' ? {} : JSON.parse(data);
  if (gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom]?.hide?.length) {
    return gridMetaData[renderedFrom]?.hide?.indexOf(fieldName) >= 0 ? false : true;
  }
  return true;
};

export const checkStaticField = (renderedFrom, fieldData) => {
  let data = localStorage.getItem('gridMetaData');
  let gridMetaData = data == 'undefined' ? {} : JSON.parse(data);
  if (gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom]?.hide?.length) {
    return {
      ...fieldData,
      show: gridMetaData[renderedFrom]?.hide?.indexOf(fieldData?.field) >= 0 ? false : true
    };
  }
  return fieldData;
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

// const getColumnWidth = (text) => {
//   const textLength = text.length;
//   const characterWidth = 8;
//   const searchIconWidth = 30;
//   const searchIconMargin = 10;
//   const tempWidth = textLength * characterWidth + searchIconWidth + searchIconMargin;
//   const width = Math.max(tempWidth, 150);
//   const minWidth = 80;
//   return {
//     minWidth,
//     width
//   };
// };
export default function useColumns() {
  const {
    state: { permissions }
  }: any = useData();

  const getColumnData = (title, field, detailScreenRoute = null, masterPage = false) => {
    let data = localStorage.getItem('gridMetaData');

    let gridMetaData = data == 'undefined' ? {} : JSON.parse(data);

    if (!gridMetaData) {
      gridMetaData = {};
    }

    let updatedTitle = camelCase(title);
    if (gridMetaData[title]?.hidden && gridMetaData[title]?.hidden.indexOf(field?.fieldName) >= 0) {
      return null;
    } else if (hideColumns.indexOf(field?.fieldName) >= 0) {
      return null;
    } else {
      let fieldHeaderName = headerName[field?.fieldName] ?? field?.fieldLabel;
      let commonFieldData = {
        accessor: field?.fieldName,
        Header: fieldHeaderName,
        // ...getColumnWidth(fieldHeaderName),
        show: gridMetaData[title]?.hide && gridMetaData[title]?.hide.indexOf(field?.fieldName) >= 0 ? false : true,
        disabled: gridMetaData[title]?.disabled && gridMetaData[title]?.disabled.indexOf(field?.fieldName) >= 0 ? true : false,
        primaryField: field?.primaryField ?? false
      };
      if (field?.fieldName === 'firstName' && field?.primaryField === false) {
        let combinedTitle = camelCase(updatedTitle);
        let pathName = detailPagePath[combinedTitle] ? detailPagePath[combinedTitle] : routes.userDetail.path ? routes.userDetail.path : '';
        return {
          columnData: {
            ...commonFieldData,
            accessor: 'concatedName',
            Cell: ({ row }) => (
              <span>
                {row?.original?.concatedName ? (
                  <Link
                    className="link text-truncate"
                    title={row?.original?.detail}
                    to={`${pathName}/${row?.original?._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {row?.original?.concatedName}
                  </Link>
                ) : (
                  <NoDataCell />
                )}
              </span>
            )
          }
        };
      } else if (field?.primaryField === true && detailScreenRoute) {
        return {
          columnData: {
            lockPosition: true,
            ...commonFieldData,
            disabled: true,
            accessor: field?.fieldName === 'firstName' ? 'concatedName' : field.fieldName,
            Cell: ({ row }) =>
              permissions[permissionForLinks[field?.resource]]?.isRead || permissions[updatedTitle]?.isRead ? (
                <span>
                  {row?.original?.[field?.fieldName] ? (
                    <Link
                      className="link text-truncate"
                      title={row?.original?.[field?.fieldName]}
                      to={`${detailScreenRoute}/${row?.original?._id}`}
                      target={masterPage ? '_self' : '_blank'}
                      rel="noopener noreferrer"
                    >
                      {row?.original?.[field?.fieldName]}
                    </Link>
                  ) : (
                    <NoDataCell />
                  )}
                </span>
              ) : (
                <p className="text-truncate">{row?.original?.[field?.fieldName] ? <p>{row?.original?.[field?.fieldName]}</p> : <NoDataCell />}</p>
              )
          }
        };
      } else if (field?.lookup) {
        let joinedFieldName = field?.fieldName.indexOf(' ') > 0 ? camelCase(field?.fieldName) : field?.fieldName;
        let pathName = '';

        if (field?.lookupResource) {
          pathName = routes[`${camelCase(field?.lookupResource)}Detail`]?.path ?? '';
        } else {
          pathName = detailPagePath[joinedFieldName]
            ? detailPagePath[joinedFieldName]
            : field?.lookupResource && routes[`${camelCase(field?.lookupResource)}Detail`]?.path
            ? routes[`${camelCase(field?.lookupResource)}Detail`]?.path
            : routes[joinedFieldName]?.path
            ? routes[joinedFieldName]?.path
            : routes[`${joinedFieldName}Detail`]?.path
            ? routes[`${joinedFieldName}Detail`]?.path
            : '';
        }
        return {
          columnData: {
            ...commonFieldData,
            Cell: ({ row }) =>
              permissions[permissionForLinks[field?.lookupResource]]?.isRead ? (
                <span>
                  {row?.original?.[field?.fieldName] ? (
                    <Link
                      className="link text-truncate"
                      title={row?.original?.[field?.fieldName]}
                      to={`${pathName}/${row?.original?.[`${field?.fieldName}Id`]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {row?.original?.[field?.fieldName]}
                    </Link>
                  ) : (
                    <NoDataCell />
                  )}
                </span>
              ) : (
                <>
                  {row?.original?.[field?.fieldName] ? (
                    <h5 className="text-truncate" title={row?.original?.[field?.fieldName]}>
                      {row?.original?.[field?.fieldName]}
                    </h5>
                  ) : (
                    <NoDataCell />
                  )}
                </>
              )
          }
        };
      } else if (isRenderWithCopy(field?.type)) {
        return {
          columnData: {
            ...commonFieldData,
            Cell: ({ row }) =>
              row?.original?.[field?.fieldName] ? (
                <h5
                  className="flex"
                  title={`${row?.original?.[field?.fieldName]} • ${moment(row?.original?.createdByDate?.slice(0, 10))?.format(dateFormat)}`}
                >
                  <span className="line-clamp-1">
                  {row?.original?.[field?.fieldName]}
                  </span>
                  <span className="createdAtTime badge-date">{moment(row?.original?.data?.createdByDate?.slice(0, 10))?.format(dateFormat)}</span>
                </h5>
              ) : (
                <NoDataCell />
              )
          }
        };
      } else if (field?.type === 'imageUpload') {
        return {
          columnData: {
            ...commonFieldData,
            canFilter: false,
            sortable: false,
            Cell: ({ row }) => (
              <div>
                <Avatar className="grid-avatar" src={row?.original?.[field?.fieldName]}>
                  <Image style={{ fontSize: 18 }} />
                </Avatar>
              </div>
            ),
            width: 100
          }
        };
      } else if (field?.type === 'date') {
        return {
          columnData: {
            ...commonFieldData,
            Cell: ({ row }) => (
              <>
                {row?.original?.[field?.fieldName] ? (
                  <h5 className="createBy" title={`${moment(row?.original?.[field?.fieldName]).format(dateFormat)}`}>
                    {moment(row?.original?.[field?.fieldName])?.format(dateFormat)}
                  </h5>
                ) : (
                  <NoDataCell />
                )}
              </>
            ),
            canFilter: false
          }
        };
      } else if (field?.type === 'dateTime') {
        return {
          columnData: {
            ...commonFieldData,
            Cell: ({ row }) => (
              <>
                {row?.original?.[field?.fieldName] ? (
                  <h5 className="createBy" title={`${moment(row?.original?.[field?.fieldName]).format(dateTimeFormat)}`}>
                    {moment(row?.original?.[field?.fieldName])?.format(dateTimeFormat)}
                  </h5>
                ) : (
                  <NoDataCell />
                )}
              </>
            ),
            canFilter: false
          }
        };
      } else if (field?.type === 'checkBox') {
        return {
          columnData: {
            ...commonFieldData,
            Cell: ({ row }) => <span>{Boolean(row?.original?.[field?.fieldName]) ? 'Yes' : 'No'}</span>
          }
        };
      } else if (field?.type === 'colorPicker') {
        return {
          columnData: {
            ...commonFieldData,
            canFilter: false,
            Cell: ({ row }) => (
              <>
                {row?.original?.[field?.fieldName] ? (
                  <h5 className="text-truncate" title={row?.original?.[field?.fieldName]}>
                    {row?.original?.[field?.fieldName]}
                  </h5>
                ) : (
                  <NoDataCell />
                )}
              </>
            )
          }
        };
      } else {
        return {
          columnData: {
            ...commonFieldData,
            Cell: ({ row }) => (
              <>
                {row?.original?.[field?.fieldName] ? (
                  <h5 className="text-truncate" title={row?.original?.[field?.fieldName]}>
                    {row?.original?.[field?.fieldName]}
                  </h5>
                ) : (
                  <NoDataCell />
                )}
              </>
            )
          }
        };
      }
    }
  };
  return { getColumnData };
}
