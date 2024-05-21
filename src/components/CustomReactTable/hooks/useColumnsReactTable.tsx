import camelCase from 'lodash/camelCase';
import { Link } from 'react-router-dom';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import moment from 'moment';
import { Avatar, Box } from '@material-ui/core';
import { dateFormat, dateTimeFormat, formatAmountWithCurrency, getUniqueCurrencies, sidebarResourceObjectFromValues } from 'src/constants/helpers';
import routes from '../../Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { Image } from '@material-ui/icons';
import CopyToClipboard from '../../Helpers/CopyToClipboard';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import SignatureCell from 'src/components/CustomReactTable/Cells/SignatureCell';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import { find, isArray, isObject, result } from 'lodash';
import InfoIcon from '@material-ui/icons/Info';
import { getGridMetaDataFromLocalStorage } from '../utils';
import DataListCell from '../Cells/DataListCell';

const permissionForLinks = sidebarResourceObjectFromValues();

export const headerName = {
  firstName: 'Name'
};

const hideColumns = ['salutation', 'middleName', 'lastName', 'suffix'];

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

export const getColumnHiddenStatus = (renderedFrom, fieldName) => {
  let gridMetaData = getGridMetaDataFromLocalStorage();
  if (gridMetaData[renderedFrom] && gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom]?.hide?.length) {
    return gridMetaData[renderedFrom]?.hide?.indexOf(fieldName) >= 0 ? false : true;
  }
  return true;
};

export const checkStaticField = (renderedFrom, fieldData) => {
  let gridMetaData = getGridMetaDataFromLocalStorage();
  if (gridMetaData[renderedFrom] && gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom]?.hide?.length) {
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

  const generateColumns = (renderedFrom, fields, detailScreenRoute = null, masterPage = false, currency = null) => {
    if (!currency) {
      currency = user?.user?.brandCurrency || 'USD';
    }

    let gridMetaData = getGridMetaDataFromLocalStorage();

    let updatedTitle = camelCase(renderedFrom);
    const column = [];

    const _fields = fields?.map((e) => e?.fieldData || e);
    _fields.forEach((field) => {
      let commonFieldData: any = {
        id: field?.fieldName,
        ...(currency ? { currency: currency } : {}),
        accessorKey: field?.fieldName,
        accessor: field?.fieldName,
        minWidth: 180,
        width: 200,
        type: field?.type,
        Header: headerName[field?.fieldName] ?? field?.fieldLabel,
        show:
          gridMetaData[renderedFrom] && gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom]?.hide.indexOf(field?.fieldName) >= 0
            ? false
            : true,
        primaryField: field?.primaryField ?? false,
        decimalPlaces: field?.decimalPlaces || 0
      };

      if (field?.stopHideColumn || field?.primaryField) {
        commonFieldData['disabled'] = true;
      }

      if (hideColumns.indexOf(field?.fieldName) >= 0) {
      } else if (field.type === 'converter' || field.type === 'currencyAmount' || field.isConverter === true) {
        const currencySymbol = getUniqueCurrencies().find((d) => d.currencyCode === currency)?.symbolNative;

        if (field.type !== 'currencyAmount' && (field.type === 'converter' || field.isConverter === true)) {
          field.displayUnits.forEach((_unit) => {
            let fieldName = field.fieldName + '_' + _unit.toLowerCase();
            let fieldLabel = field.fieldLabel + ' ' + _unit;
            column.push({
              ...commonFieldData,
              id: fieldName,
              accessorKey: fieldName,
              accessor: fieldName,
              Header: fieldLabel,
              cell: ({ row }) => {
                return row?.original[fieldName] ? <p>{row?.original[fieldName]}</p> : <NoDataCell />;
              },
              editable: Boolean(field?.isColumnEditable)
            });
          });
        } else if (field.type === 'currencyAmount' && (field.type === 'converter' || field.isConverter === true)) {
          field.displayUnits.forEach((_unit) => {
            field.displayCurrency.forEach((_currency) => {
              let fieldName = field.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
              let fieldLabel = field.fieldLabel + ' ' + _unit + '/' + _currency;
              column.push({
                ...commonFieldData,
                id: fieldName,
                accessorKey: fieldName,
                accessor: fieldName,
                Header: fieldLabel,
                editable: Boolean(field?.isColumnEditable),
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
              ...commonFieldData,
              id: fieldName,
              accessorKey: fieldName,
              accessor: fieldName,
              Header: fieldLabel,
              editable: Boolean(field?.isColumnEditable),
              cell: ({ row }) => {
                return row?.original[fieldName] ? (
                  <p>{formatAmountWithCurrency(currency, row?.original[fieldName])?.amountWithouCurrencyCode}</p>
                ) : (
                  <NoDataCell />
                );
              },
              Footer: (info) => {
                let rows = info.table.getExpandedRowModel().rows;
                const total = rows
                  ?.filter((f) => !f.original.parentId && f.original.hasOwnProperty(fieldName) && !isNaN(f.original[fieldName]))
                  .reduce((sum, row) => Number(row.original[fieldName]) + sum, 0);
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
      } else if (field?.fieldName === 'firstName' && !field?.primaryField) {
        column.push({
          ...commonFieldData,
          id: 'concatedName',
          accessor: 'concatedName',
          accessorKey: 'concatedName',
          cell: ({ row }) => <p className="text-truncate">{row?.original?.concatedName ? <p>{row?.original?.concatedName}</p> : <NoDataCell />}</p>
        });
      } else if (field?.primaryField === true && detailScreenRoute) {
        const fieldName = field?.fieldName === 'firstName' ? 'concatedName' : field.fieldName;
        column.push({
          lockPosition: true,
          ...commonFieldData,
          accessor: fieldName,
          cell: ({ row }) =>
            permissions[permissionForLinks[field?.resource]]?.isRead || permissions[updatedTitle]?.isRead ? (
              <span>
                {row?.original?.[fieldName] ? (
                  <>
                    <Link
                      className="link text-truncate"
                      title={row?.original?.[fieldName]}
                      to={`${detailScreenRoute}/${row?.original?._id}`}
                      target={masterPage ? '_self' : '_blank'}
                      rel="noopener noreferrer"
                    >
                      {row?.original?.[fieldName]}
                    </Link>
                    {row?.original?.deleted && (
                      <Box ml={1}>
                        <HtmlTooltip title={`Deleted`}>
                          <InfoIcon className="cursor-pointer" fontSize="small" color="error" />
                        </HtmlTooltip>
                      </Box>
                    )}
                  </>
                ) : (
                  <NoDataCell />
                )}
              </span>
            ) : (
              <p className="text-truncate">{row?.original?.[fieldName] ? <p>{row?.original?.[fieldName]}</p> : <NoDataCell />}</p>
            )
        });
      } else if (field?.dataList) {
        column.push({
          ...commonFieldData,
          editable: Boolean(field?.isColumnEditable),
          dataList: true,
          ...(Boolean(field?.isColumnEditable) ? { dataListId: field?.dataListId } : ''),
          ...(Boolean(field?.isColumnEditable) ? { option: [] } : {}),
          accessorFn: (original) => {
            return isArray(original?.[field?.fieldName])
              ? original?.[field?.fieldName][0]?.optionLabel
              : isObject(original?.[field?.fieldName])
                ? original?.[field?.fieldName]?.optionLabel
                : original?.[field?.fieldName];
          },
          cell: ({ row }) => <DataListCell field={field} original={row?.original} />
        });
      } else if (field?.lookup) {
        column.push({
          ...commonFieldData,
          editable: Boolean(field?.isColumnEditable),
          ...(Boolean(field?.isColumnEditable) ? { option: field?.option } : {}),
          accessorFn: (original) => {
            return isArray(original?.[field?.fieldName])
              ? original?.[field?.fieldName][0]?.optionLabel
              : isObject(original?.[field?.fieldName])
                ? original?.[field?.fieldName]?.optionLabel
                : original?.[field?.fieldName];
          },
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
          width: 100,
          disableFilters: true,
          disableSortBy: true,
          cell: ({ row }) => (
            <div>
              <Avatar className="grid-avatar min-[769px]:mx-auto" src={row?.original?.[field?.fieldName]}>
                <Image style={{ fontSize: 18 }} />
              </Avatar>
            </div>
          )
        });
      } else if (field?.type === 'date') {
        column.push({
          ...commonFieldData,
          editable: Boolean(field?.isColumnEditable),
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
          disableFilters: true
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
          disableFilters: true
        });
      } else if (field?.type === 'checkBox') {
        column.push({
          ...commonFieldData,
          accessorFn: (data) => (Boolean(data[field?.fieldName]) ? 'Yes' : 'No'),
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
      } else if (field?.type === 'currencyNumber') {
        const currencySymbol = getUniqueCurrencies().find((d) => d.currencyCode === currency)?.symbolNative;
        column.push({
          ...commonFieldData,
          editable: false,
          disableFilters: true,
          disableSortBy: true,
          cell: ({ row }) => (
            <div>
              <h5 className="text-truncate">
                {currencySymbol}
                {formatAmountWithCurrency(currency, row.original[field?.fieldName] || 0)?.amountWithouCurrencyCode ??
                  (row.original[field?.fieldName] || 0)}
              </h5>
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
            let rows = info.table.getExpandedRowModel().rows;
            const total = rows
              ?.filter((f) => !f.original.parentId && f.original.hasOwnProperty(field.fieldName) && !isNaN(f.original[field.fieldName]))
              .reduce((sum, row) => Number(row.original[commonFieldData.accessor]) + sum, 0);
            return <>{field?.isHideColumnSum ? '' : total}</>;
          }
        });
      } else if (field.type === 'signature') {
        column.push({
          ...commonFieldData,
          disableFilters: true,
          disableSortBy: true,
          cell: ({ row }) => (row.original[field.fieldName] ? <SignatureCell base64={row?.original[field.fieldName]} /> : <NoDataCell />)
        });
      } else if (field.type === 'percent') {
        column.push({
          ...commonFieldData,
          editable: Boolean(field?.isColumnEditable),
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
      } else {
        column.push({
          ...commonFieldData,
          editable: Boolean(field?.isColumnEditable),
          ...(Boolean(field?.isColumnEditable) && ['dropDown', 'multiSelect']?.includes(field.type) ? { option: field?.option } : {}),
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

  return { generateColumns };
}
