import camelCase from 'lodash/camelCase';
import { Link } from 'react-router-dom';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import moment from 'moment';
import { Avatar } from '@material-ui/core';
import { dateFormat, dateTimeFormat, formatAmountWithCurrency, getUniqueCurrencies, sidebarResourceObjectFromValues } from 'src/constants/helpers';
import { leadDetailPage } from 'src/routes/Lead';
import routes from '../../Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { Image } from '@material-ui/icons';
import CopyToClipboard from '../../Helpers/CopyToClipboard';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import SignatureCell from 'src/components/Helpers/SignatureCell';
import DropdownCell from '../Cells/DropdownCell';

const permissionForLinks = sidebarResourceObjectFromValues();

export const headerName = {
  firstName: 'Name'
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

export const getStaticFields = () => {
  return [
    {
      id: 'createdBy',
      accessorKey: 'createdBy',
      accessor: 'createdBy',
      size: 200,
      header: 'Created By',
      show: true,
      minSize: 185,
      disableFilters: true,
      cell: ({ row }) =>
        row?.original?.createdBy ? (
          <h5 className="createBy" title={`${row?.original?.createdBy} • ${moment(row?.original?.createdByDate?.slice(0, 10)).format(dateFormat)}`}>
            {row?.original?.createdBy}
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
      minSize: 185,
      show: true,
      disableFilters: true,
      cell: ({ row }) =>
        row?.original?.updatedBy ? (
          <h5 className="updateBy" title={`${row?.original?.updatedBy} • ${moment(row?.original?.updatedByDate?.slice(0, 10)).format(dateFormat)}`}>
            {row?.original?.updatedBy}
            <span className="updatedAtTime badge-date">{moment(row?.original?.updatedByDate?.slice(0, 10)).format(dateFormat)}</span>
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

const getTitle = (data) => {
  if (data.length) {
    let restParams = data.map((o) => (o?.optionLabel ? o?.optionLabel : typeof o !== 'object' ? o : '')).join(', ');
    return restParams;
  }
  return '';
};

export default function useColumns() {
  const {
    state: { permissions, user }
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
        id: field?.fieldName,
        accessorKey: field?.fieldName,
        accessor: field?.fieldName,
        minSize: 180,
        size: 200,
        header: fieldHeaderName,
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
            id: 'concatedName',
            accessorKey: 'concatedName',
            accessor: 'concatedName',
            cell: ({ row }) => (
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
        const fieldName = field?.fieldName === 'firstName' ? 'concatedName' : field.fieldName;
        return {
          columnData: {
            lockPosition: true,
            ...commonFieldData,
            disabled: true,
            cell: ({ row }) =>
              permissions[permissionForLinks[field?.resource]]?.isRead || permissions[updatedTitle]?.isRead ? (
                <span>
                  {row?.original?.[fieldName] ? (
                    <Link
                      className="link text-truncate"
                      title={row?.original?.[fieldName]}
                      to={`${detailScreenRoute}/${row?.original?._id}`}
                      target={masterPage ? '_self' : '_blank'}
                      rel="noopener noreferrer"
                    >
                      {row?.original?.[fieldName]}
                    </Link>
                  ) : (
                    <NoDataCell />
                  )}
                </span>
              ) : (
                <p className="text-truncate">{row?.original?.[fieldName] ? <p>{row?.original?.[fieldName]}</p> : <NoDataCell />}</p>
              )
          }
        };
      } else if (field?.lookup) {
        let joinedFieldName = field?.fieldName.indexOf(' ') > 0 ? camelCase(field?.fieldName) : field?.fieldName;
        const more = `rest${joinedFieldName}`;
        let pathName = routes[`${camelCase(field?.lookupResource)}Detail`]?.path
          ? routes[`${camelCase(field?.lookupResource)}Detail`]?.path
          : `${camelCase(field?.lookupResource)}/detail`;
        return {
          columnData: {
            ...commonFieldData,
            cell: ({ row }) =>
              permissions[permissionForLinks[field?.lookupResource]]?.isRead ? (
                <span>
                  {row?.original?.[field?.fieldName] ? (
                    <>
                      <Link
                        className="link text-truncate"
                        title={row?.original?.[field?.fieldName]}
                        to={`${pathName}/${row?.original?.[`${field?.fieldName}Id`]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {row?.original?.[field?.fieldName]}
                      </Link>
                      {row?.original?.[more]?.length > 0 && (
                        <HtmlTooltip title={getTitle(row?.original?.[more])}>
                          <span className="createdAtTime badge-date">{`+${row?.original?.[more].length} more..`}</span>
                        </HtmlTooltip>
                      )}
                    </>
                  ) : (
                    <NoDataCell />
                  )}
                </span>
              ) : (
                <div>
                  {row?.original?.[field?.fieldName] ? (
                    <h5 className="text-truncate" title={row?.original?.[field?.fieldName]}>
                      {row?.original?.[field?.fieldName]}
                    </h5>
                  ) : (
                    <NoDataCell />
                  )}
                </div>
              )
          }
        };
      } else if (['mobileNumber', 'phone', 'email']?.includes(field?.type)) {
        return {
          columnData: {
            ...commonFieldData,
            cell: ({ row }) =>
              row?.original?.[field?.fieldName] ? (
                <h5 className="[display:flex_!important] [flex-wrap:nowrap_!important] items-center" title={`${row?.original?.[field?.fieldName]}`}>
                  <span title={row?.original?.[field?.fieldName]} className="text-truncate">
                    {row?.original?.[field?.fieldName]}
                  </span>
                  <CopyToClipboard textToCopy={row?.original?.[field?.fieldName]} size={16} />
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
            disableFilters: true,
            sortable: false,
            minWidth: 80,
            cell: ({ row }) => (
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
            minWidth: 80,
            width: 200,
            cell: ({ row }) => (
              <div>
                {row?.original?.[field?.fieldName] ? (
                  <h5 className="createBy" title={`${moment(row?.original?.[field?.fieldName]).format(dateFormat)}`}>
                    {moment(row?.original?.[field?.fieldName])?.format(dateFormat)}
                  </h5>
                ) : (
                  <NoDataCell />
                )}
              </div>
            ),
            disableFilters: true,
            disableSortBy: true
          }
        };
      } else if (field?.type === 'dateTime') {
        return {
          columnData: {
            ...commonFieldData,
            cell: ({ row }) => (
              <div>
                {row?.original?.[field?.fieldName] ? (
                  <h5 className="createBy" title={`${moment(row?.original?.[field?.fieldName]).format(dateTimeFormat)}`}>
                    {moment(row?.original?.[field?.fieldName])?.format(dateTimeFormat)}
                  </h5>
                ) : (
                  <NoDataCell />
                )}
              </div>
            ),
            disableFilters: true,
            disableSortBy: true
          }
        };
      } else if (field?.type === 'checkBox') {
        return {
          columnData: {
            ...commonFieldData,
            cell: ({ row }) => (
              <div>
                <span>{Boolean(row?.original?.[field?.fieldName]) ? 'Yes' : 'No'}</span>
              </div>
            )
          }
        };
      } else if (field?.type === 'colorPicker') {
        return {
          columnData: {
            ...commonFieldData,
            disableFilters: true,
            cell: ({ row }) => (
              <div>
                {row?.original?.[field?.fieldName] ? (
                  <h5 className="text-truncate" title={row?.original?.[field?.fieldName]}>
                    {row?.original?.[field?.fieldName]}
                  </h5>
                ) : (
                  <NoDataCell />
                )}
              </div>
            )
          }
        };
      } else if (field?.type === 'number') {
        return {
          columnData: {
            ...commonFieldData,
            disableFilters: true,
            cell: ({ row }) => (
              <>
                <h5 className="text-truncate">{row.original[field?.fieldName] ? row.original[field?.fieldName] : 0}</h5>
              </>
            )
          }
        };
      } else {
        return {
          columnData: {
            ...commonFieldData,
            cell: ({ row }) => (
              <div>
                {row?.original?.[field?.fieldName] ? (
                  <h5 className="text-truncate" title={row?.original?.[field?.fieldName]}>
                    {row?.original?.[field?.fieldName]}
                  </h5>
                ) : (
                  <NoDataCell />
                )}
              </div>
            )
          }
        };
      }
    }
  };

  const generateColumns = (renderedFrom, fields, detailScreenRoute = null, masterPage = false, currency = null) => {
    let data = localStorage.getItem('gridMetaData');
    let gridMetaData = data == 'undefined' ? {} : JSON.parse(data);
    if (!gridMetaData) {
      gridMetaData = {};
    }
    let updatedTitle = camelCase(renderedFrom);
    const column = [];

    const _fields = fields?.map((e) => e?.fieldData || e);
    _fields.forEach((field) => {
      let commonFieldData = {
        id: field?.fieldName,
        accessorKey: field?.fieldName,
        accessor: field?.fieldName,
        minWidth: 180,
        width: 200,
        Header: headerName[field?.fieldName] ?? field?.fieldLabel,
        show: gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom]?.hide.indexOf(field?.fieldName) >= 0 ? false : true,
        primaryField: field?.primaryField ?? false,
        decimalPlaces: field?.decimalPlaces || 0
      };

      if (hideColumns.indexOf(field?.fieldName) >= 0) {
      } else if (field.type === 'converter' || field.type === 'currencyAmount' || field.isConverter === true) {
        const currencySymbol = getUniqueCurrencies().find((d) => d.currencyCode === currency)?.symbolNative;

        if (field.type !== 'currencyAmount' && (field.type === 'converter' || field.isConverter === true)) {
          field.displayUnits.forEach((_unit) => {
            let fieldName = field.fieldName + '_' + _unit.toLowerCase();
            let fieldLabel = field.fieldLabel + ' ' + _unit;
            column.push({
              accessor: fieldName,
              Header: fieldLabel,
              cell: ({ row }) => {
                return row?.original[fieldName] ? <p>{row?.original[fieldName]}</p> : <NoDataCell />;
              },
              editable: Boolean(field?.isColumnEditable),
              decimalPlaces: field?.decimalPlaces,
              primaryField: field?.primaryField ?? false
            });
          });
        } else if (field.type === 'currencyAmount' && (field.type === 'converter' || field.isConverter === true)) {
          field.displayUnits.forEach((_unit) => {
            field.displayCurrency.forEach((_currency) => {
              let fieldName = field.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
              let fieldLabel = field.fieldLabel + ' ' + _unit + '/' + _currency;
              column.push({
                accessor: fieldName,
                Header: fieldLabel,
                editable: Boolean(field?.isColumnEditable),
                decimalPlaces: field?.decimalPlaces,
                primaryField: field?.primaryField ?? false,
                cell: ({ row }) => {
                  return row?.original[fieldName] ? (
                    <p>{formatAmountWithCurrency(currency, row?.original[fieldName])?.amountWithouCurrencyCode}</p>
                  ) : (
                    <NoDataCell />
                  );
                }
              });
            });
          });
        } else if (field.type === 'currencyAmount') {
          field.displayCurrency.forEach((_currency) => {
            let fieldName = field.fieldName + '_' + _currency.toLowerCase();
            let fieldLabel = field.fieldLabel + ' ' + _currency;
            column.push({
              accessor: fieldName,
              Header: fieldLabel,
              editable: Boolean(field?.isColumnEditable),
              decimalPlaces: field?.decimalPlaces,
              primaryField: field?.primaryField ?? false,
              cell: ({ row }) => {
                return row?.original[fieldName] ? (
                  <p>{formatAmountWithCurrency(currency, row?.original[fieldName])?.amountWithouCurrencyCode}</p>
                ) : (
                  <NoDataCell />
                );
              },
              Footer: (info) => {
                let rows = info.rows;
                if (!rows) {
                  rows = info.table.getExpandedRowModel().rows;
                }
                const total = rows
                  ?.filter((f) => !f.original.parentId && f.values.hasOwnProperty(fieldName) && !isNaN(f.values[fieldName]))
                  .reduce((sum, row) => row.values[fieldName] + sum, 0);
                return (
                  <>
                    {field?.isHideColumnSum
                      ? ''
                      : `${currencySymbol} ${formatAmountWithCurrency(currency, total)?.amountWithouCurrencyCode ?? total}`}
                  </>
                );
              }
            });
          });
        }
      } else if (field?.fieldName === 'firstName' && field?.primaryField === false) {
        let combinedTitle = camelCase(updatedTitle);
        let pathName = detailPagePath[combinedTitle] ? detailPagePath[combinedTitle] : routes.userDetail.path ? routes.userDetail.path : '';
        column.push({
          ...commonFieldData,
          id: 'concatedName',
          accessor: 'concatedName',
          cell: ({ row }) => (
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
        });
      } else if (field?.primaryField === true && detailScreenRoute) {
        const fieldName = field?.fieldName === 'firstName' ? 'concatedName' : field.fieldName;
        column.push({
          lockPosition: true,
          ...commonFieldData,
          disabled: true,
          cell: ({ row }) =>
            permissions[permissionForLinks[field?.resource]]?.isRead || permissions[updatedTitle]?.isRead ? (
              <span>
                {row?.original?.[fieldName] ? (
                  <Link
                    className="link text-truncate"
                    title={row?.original?.[fieldName]}
                    to={`${detailScreenRoute}/${row?.original?._id}`}
                    target={masterPage ? '_self' : '_blank'}
                    rel="noopener noreferrer"
                  >
                    {row?.original?.[fieldName]}
                  </Link>
                ) : (
                  <NoDataCell />
                )}
              </span>
            ) : (
              <p className="text-truncate">{row?.original?.[fieldName] ? <p>{row?.original?.[fieldName]}</p> : <NoDataCell />}</p>
            )
        });
      } else if (field?.lookup) {
        column.push({
          ...commonFieldData,
          cell: ({ row }) => <DropdownCell permissions={permissions} permissionForLinks={permissionForLinks} field={field} original={row?.original} />
        });
      } else if (['mobileNumber', 'phone', 'email']?.includes(field?.type)) {
        column.push({
          ...commonFieldData,
          cell: ({ row }) =>
            row?.original?.[field?.fieldName] ? (
              <h5 className="[display:flex_!important] [flex-wrap:nowrap_!important] items-center" title={`${row?.original?.[field?.fieldName]}`}>
                <span title={row?.original?.[field?.fieldName]} className="text-truncate">
                  {row?.original?.[field?.fieldName]}
                </span>
                <CopyToClipboard textToCopy={row?.original?.[field?.fieldName]} size={16} />
              </h5>
            ) : (
              <NoDataCell />
            )
        });
      } else if (field?.type === 'imageUpload') {
        column.push({
          ...commonFieldData,
          disableFilters: true,
          disableSortBy: true,
          cell: ({ row }) => (
            <div>
              <Avatar className="grid-avatar" src={row?.original?.[field?.fieldName]}>
                <Image style={{ fontSize: 18 }} />
              </Avatar>
            </div>
          )
        });
      } else if (field?.type === 'date') {
        column.push({
          ...commonFieldData,
          cell: ({ row }) => (
            <div>
              {row?.original?.[field?.fieldName] ? (
                <h5 className="createBy" title={`${moment(row?.original?.[field?.fieldName]).format(dateFormat)}`}>
                  {moment(row?.original?.[field?.fieldName])?.format(dateFormat)}
                </h5>
              ) : (
                <NoDataCell />
              )}
            </div>
          ),
          disableFilters: true,
          disableSortBy: true
        });
      } else if (field?.type === 'dateTime') {
        column.push({
          ...commonFieldData,
          cell: ({ row }) => (
            <div>
              {row?.original?.[field?.fieldName] ? (
                <h5 className="createBy" title={`${moment(row?.original?.[field?.fieldName]).format(dateTimeFormat)}`}>
                  {moment(row?.original?.[field?.fieldName])?.format(dateTimeFormat)}
                </h5>
              ) : (
                <NoDataCell />
              )}
            </div>
          ),
          disableFilters: true,
          disableSortBy: true
        });
      } else if (field?.type === 'checkBox') {
        column.push({
          ...commonFieldData,
          cell: ({ row }) => (
            <div>
              <span>{Boolean(row?.original?.[field?.fieldName]) ? 'Yes' : 'No'}</span>
            </div>
          )
        });
      } else if (field?.type === 'colorPicker') {
        column.push({
          ...commonFieldData,
          disableFilters: true,
          disableSortBy: true,
          cell: ({ row }) => (
            <div>
              {row?.original?.[field?.fieldName] ? (
                <h5 className="text-truncate" title={row?.original?.[field?.fieldName]}>
                  {row?.original?.[field?.fieldName]}
                </h5>
              ) : (
                <NoDataCell />
              )}
            </div>
          )
        });
      } else if (field?.type === 'number') {
        column.push({
          ...commonFieldData,
          editable: Boolean(field?.isColumnEditable),
          disableFilters: true,
          disableSortBy: true,
          cell: ({ row }) => (
            <div>
              <h5 className="text-truncate">{row.original[field?.fieldName] ? row.original[field?.fieldName] : 0}</h5>
            </div>
          )
        });
      } else if (field.type === 'decimal') {
        column.push({
          ...commonFieldData,
          disableFilters: true,
          disableSortBy: true,
          editable: Boolean(field?.isColumnEditable),
          cell: ({ row }) => (row.original[field.fieldName] ? <p>{row.original[field.fieldName]}</p> : <NoDataCell />),
          Footer: (info) => {
            let rows = info.rows;
            if (!rows) {
              rows = info.table.getExpandedRowModel().rows;
            }
            const qtyTotal = rows
              .filter((f) => !f.original.parentId && f.original.hasOwnProperty(field.fieldName) && !isNaN(f.original[field.fieldName]))
              .reduce((sum, row) => row.original[commonFieldData.accessor] + sum, 0);
            return <>{field?.isHideColumnSum ? '' : qtyTotal}</>;
          }
        });
      } else if (field.type === 'signature') {
        column.push({
          ...commonFieldData,
          disableFilters: true,
          disableSortBy: true,
          cell: ({ row }) => (row.original[field.fieldName] ? <SignatureCell base64={row?.original[field.fieldName]} /> : <NoDataCell />)
        });
      } else {
        column.push({
          ...commonFieldData,
          cell: ({ row }) => (
            <div>
              {row?.original?.[field?.fieldName] ? (
                <h5 className="text-truncate" title={row?.original?.[field?.fieldName]}>
                  {row?.original?.[field?.fieldName]}
                </h5>
              ) : (
                <NoDataCell />
              )}
            </div>
          )
        });
      }
    });
    return column;
  };

  return { getColumnData, generateColumns };
}
