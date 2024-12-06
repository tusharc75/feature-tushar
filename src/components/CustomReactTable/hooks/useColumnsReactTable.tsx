import { Avatar, Box } from '@material-ui/core';
import { Image } from '@material-ui/icons';
import InfoIcon from '@material-ui/icons/Info';
import { isArray, isObject } from 'lodash';
import camelCase from 'lodash/camelCase';
import moment from 'moment';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useGridMetaData } from 'src/components/CustomReactTable/ArrangeView/utils';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import FreeStyleMultiSelect from 'src/components/CustomReactTable/Cells/FreeStyleMultiSelect';
import GpsLocationCell from 'src/components/CustomReactTable/Cells/GpsLocationCell';
import GroupSignatureCell from 'src/components/CustomReactTable/Cells/GroupSignatureCell';
import LookupCell from 'src/components/CustomReactTable/Cells/LookupCell';
import { MultiFileCell } from 'src/components/CustomReactTable/Cells/MultiFileCell';
import { MultiImageCell } from 'src/components/CustomReactTable/Cells/MultiImageCell';
import NumberCell from 'src/components/CustomReactTable/Cells/NumberCell';
import SignatureCell from 'src/components/CustomReactTable/Cells/SignatureCell';
import SwitchCell from 'src/components/CustomReactTable/Cells/SwitchCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import {
  dateFormat,
  dateTimeFormat,
  formatAmountWithCurrency,
  formatTotalforTableFooter,
  getUniqueCurrencies,
  sidebarResourceObjectFromValues
} from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import CopyToClipboard from '../../Helpers/CopyToClipboard';
import DataListCell from '../Cells/DataListCell';
import { headerName } from 'src/components/CustomReactTable/hooks/hookUtils';

const permissionForLinks = sidebarResourceObjectFromValues();

const hideColumns = ['salutation', 'middleName', 'lastName', 'suffix'];

export function useColumns() {
  const {
    state: { permissions, user }
  }: any = useData();

  const { gridMetaData } = useGridMetaData();

  const getColumnHiddenStatus = useCallback(
    (renderedFrom, fieldName) => {
      if (gridMetaData[renderedFrom] && gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom]?.hide?.length) {
        return gridMetaData[renderedFrom]?.hide?.indexOf(fieldName) >= 0 ? false : true;
      }
      return true;
    },
    [gridMetaData]
  );

  const checkStaticField = useCallback(
    (renderedFrom, fieldData) => {
      if (gridMetaData[renderedFrom] && gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom]?.hide?.length) {
        return {
          ...fieldData,
          show: gridMetaData[renderedFrom]?.hide?.indexOf(fieldData?.field) >= 0 ? false : true
        };
      }
      return fieldData;
    },
    [gridMetaData]
  );

  const generateColumns = useCallback(
    (renderedFrom, fields, detailScreenRoute = null, masterPage = false, currency = null) => {
      if (!currency) {
        currency = user?.user?.brandCurrency || 'USD';
      }

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
                let fieldLabel = field.fieldLabel + ' ' + _currency + '/' + _unit;
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
                        : `${currencySymbol} ${formatAmountWithCurrency(currency, total)?.amountWithouCurrencyCode ?? formatTotalforTableFooter(total)}`}
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
            id: fieldName,
            accessor: fieldName,
            accessorKey: fieldName,
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
            cell: ({ row }) => (
              <DropdownCell permissions={permissions} permissionForLinks={permissionForLinks} field={field} original={row?.original} />
            )
          });
        } else if (['mobileNumber', 'phone', 'email']?.includes(field?.type)) {
          column.push({
            ...commonFieldData,
            cell: ({ row }) =>
              row?.original?.[field?.fieldName] ? (
                <h5 className="items-center [display:flex_!important] [flex-wrap:nowrap_!important]" title={`${row?.original?.[field?.fieldName]}`}>
                  <span title={row?.original?.[field?.fieldName]} className="min-w-0 max-[768px]:line-clamp-1 md:!block md:!truncate">
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
        } else if (field?.type === 'multiFileUpload') {
          column.push({
            ...commonFieldData,
            width: 200,
            disableFilters: true,
            disableSortBy: true,
            cell: ({ row }) => {
              return <MultiFileCell data={row.original?.[field?.fieldName]} />;
            }
          });
        } else if (field?.type === 'fileUpload') {
          column.push({
            ...commonFieldData,
            width: 200,
            disableFilters: true,
            disableSortBy: true,
            cell: ({ row }) => {
              if (!row.original?.[field?.fieldName]) return <NoDataCell />;
              return <MultiFileCell data={[{ fileName: row.original?.[field?.fieldName], size: '' }]} />;
            }
          });
        } else if (field?.type === 'multiImageUpload') {
          column.push({
            ...commonFieldData,
            width: 200,
            disableFilters: true,
            disableSortBy: true,
            cell: ({ row }) => {
              if (!row.original?.[field?.fieldName]) return <NoDataCell />;
              return <MultiImageCell images={row.original?.[field?.fieldName]?.split(' , ') || []} />;
            }
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
            cell: ({ row }) => (
              <div>
                <h5 className="text-truncate">
                  {row.original[field?.fieldName] || row.original[field?.fieldName] === 0 ? row.original[field?.fieldName] : <NoDataCell />}
                </h5>
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
            editable: Boolean(field?.isColumnEditable),
            cell: ({ row }) => (row.original[field.fieldName] ? <p>{row.original[field.fieldName]}</p> : <NoDataCell />),
            Footer: (info) => {
              let rows = info.table.getExpandedRowModel().rows;
              const total = rows
                ?.filter((f) => !f.original.parentId && f.original.hasOwnProperty(field.fieldName) && !isNaN(f.original[field.fieldName]))
                .reduce((sum, row) => Number(row.original[commonFieldData.accessor]) + sum, 0);
              return <>{field?.isHideColumnSum ? '' : formatTotalforTableFooter(total)}</>;
            }
          });
        } else if (field.type === 'signature') {
          column.push({
            ...commonFieldData,
            disableFilters: true,
            disableSortBy: true,
            cell: ({ row }) => (row.original[field.fieldName] ? <SignatureCell base64={row?.original[field.fieldName]} /> : <NoDataCell />)
          });
        } else if (field.type === 'groupSignature') {
          column.push({
            ...commonFieldData,
            disableFilters: true,
            disableSortBy: true,
            cell: ({ row }) => (
              <div>
                <GroupSignatureCell original={row?.original} field={field} />
              </div>
            )
          });
        } else if (field.type === 'counter') {
          column.push({
            ...commonFieldData,
            disableFilters: true,
            disableSortBy: true,
            cell: ({ row }) => {
              return <NumberCell rowData={row.original} field={field} />;
            }
          });
        } else if (field.type === 'percent') {
          column.push({
            ...commonFieldData,
            editable: Boolean(field?.isColumnEditable),
            disableFilters: true,
            disableSortBy: true,
            cell: ({ row }) => (
              <div>
                {row?.original?.[field?.fieldName] || row?.original?.[field?.fieldName] === 0 ? (
                  <h5 className="text-truncate" title={row?.original?.[field?.fieldName]}>
                    {row?.original?.[field?.fieldName]}
                  </h5>
                ) : (
                  <NoDataCell />
                )}
              </div>
            )
          });
        } else if (field.type === 'lookUpDisplay') {
          column.push({
            ...commonFieldData,
            editable: false,
            cell: ({ row }) => <LookupCell field={field} original={row?.original} />
          });
        } else if (field.type === 'switch') {
          column.push({
            ...commonFieldData,
            editable: false,
            accessorFn: (data) => (Boolean(data[field?.fieldName]) ? 'Yes' : 'No'),
            cell: ({ row }) => <SwitchCell field={field} original={row?.original} />
          });
        } else if (field.type === 'gpsLocation') {
          column.push({
            ...commonFieldData,
            editable: false,
            cell: ({ row }) => <GpsLocationCell value={row?.original?.[field?.fieldName]} />
          });
        } else if (field.type === 'freeStyleMultiSelect') {
          column.push({
            ...commonFieldData,
            disableFilters: true,
            cell: ({ row }) => <FreeStyleMultiSelect value={row?.original?.[field?.fieldName]} />
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
    },
    [gridMetaData, permissions, user?.user?.brandCurrency]
  );

  return { generateColumns, checkStaticField, getColumnHiddenStatus };
}
