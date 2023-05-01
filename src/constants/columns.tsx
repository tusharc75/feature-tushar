import routes from '../components/Helpers/Routes';
import camelCase from 'lodash/camelCase';
import { dateFormat, dateTimeFormat, formatAmountWithCurrency, getUniqueCurrencies } from './helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { flatMapDeep } from 'lodash';
import moment from 'moment';

export const headerName = {
  firstName: 'Name'
};

const hideColumns = ['salutation', 'middleName', 'lastName', 'suffix'];

export const generateColoum = (fields, column, rendererNames, editable, renderedFrom, getColumnData) => {

  let _fields = fields;
  _fields.forEach((ele) => {
    if (ele.type === 'converter' || ele.type === 'currencyAmount' || ele.isConverter === true) {
      if (ele.type !== 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
        ele.displayUnits.forEach((_unit) => {
          let fieldName = ele.fieldName + '_' + _unit.toLowerCase();
          let fieldLabel = ele.fieldLabel + ' ' + _unit;
          if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
            let col: any = {};
            col.field = fieldName;
            col.headerName = fieldLabel;
            col.width = 180;
            col.show = true;
            col.leval = ele.leval;
            if (!ele.isFormula && !ele.isUneditable && (ele?.isColumnEditable || editable)) {
              col.cellRenderer = 'commonRenderer';
              col.cellEditor = 'numericCellEditor';
              col.editable = true;
            } else {
              col.cellRenderer = 'commonRenderer';
            }
            column.push(col);
          }
        });
      } else if (ele.type === 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
        ele.displayUnits.forEach((_unit) => {
          ele.displayCurrency.forEach((_currency) => {
            let fieldName = ele.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
            let fieldLabel = ele.fieldLabel + ' ' + _unit + '/' + _currency;
            if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
              let col: any = {};
              col.field = fieldName;
              col.headerName = fieldLabel;
              col.width = 180;
              col.show = true;
              col.leval = ele.leval;
              if (!ele.isFormula && !ele.isUneditable && (ele?.isColumnEditable || editable)) {
                col.cellRenderer = 'commonRenderer';
                col.cellEditor = 'numericCellEditor';
                col.editable = true;
              } else {
                col.cellRenderer = 'commonRenderer';
              }
              column.push(col);
            }
          });
        });
      } else if (ele.type === 'currencyAmount') {
        ele.displayCurrency.forEach((_currency) => {
          let fieldName = ele.fieldName + '_' + _currency.toLowerCase();
          let fieldLabel = ele.fieldLabel + ' ' + _currency;
          if (column.filter((_c) => _c.field === fieldName && _c.headerName === fieldLabel).length === 0) {
            let col: any = {};
            col.field = fieldName;
            col.headerName = fieldLabel;
            col.width = 180;
            col.show = true;
            col.leval = ele.leval;
            if (!ele.isFormula && !ele.isUneditable && (ele?.isColumnEditable || editable)) {
              col.cellRenderer = 'commonRenderer';
              col.cellEditor = 'numericCellEditor';
              col.editable = true;
            } else {
              col.cellRenderer = 'commonRenderer';
            }
            column.push(col);
          }
        });
      }
    } else {
      if (column.filter((_c) => _c.field === ele.fieldName && _c.headerName === ele.fieldLabel).length === 0) {
        let currentColumn: any = getColumnData(renderedFrom ? renderedFrom : routes.productBuilder.title, ele, routes.productBuilder.path, true);
        if (ele.type === 'decimal' || ele.type === 'percent' || ele.type === 'singleLine' || ele.type === 'multiLine') {
          if (!ele.isFormula && !ele.isUneditable && (ele?.isColumnEditable || editable)) {
            if (ele.type === 'decimal' || ele.type === 'percent') {
              currentColumn.columnData.cellEditor = 'numericCellEditor';
            }
            currentColumn.columnData.editable = true;
          }
        }
        if (ele.type === 'date') {
          currentColumn.columnData.filter = false;
          currentColumn.columnData.sortable = false;
        }
        column.push({ ...currentColumn.columnData, leval: ele.leval });
        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
          rendererNames.push(currentColumn?.rendererName);
        }
      }
    }
  });
};

export const getCustomColumnData = (title, field) => {
  let data = localStorage.getItem('gridMetaData');

  let gridMetaData = data == 'undefined' ? {} : JSON.parse(data);

  if (!gridMetaData) {
    gridMetaData = {};
  }
  if (gridMetaData[title]?.hidden && gridMetaData[title]?.hidden.indexOf(field?.fieldName) >= 0) {
    return null;
  } else if (hideColumns.indexOf(field?.fieldName) >= 0) {
    return null;
  } else {
    let fieldHeaderName = headerName[field?.fieldName] ?? field?.fieldLabel;
    let commonFieldData = {
      accessor: field?.fieldName,
      Header: fieldHeaderName,
      show: gridMetaData[title]?.hide && gridMetaData[title]?.hide.indexOf(field?.fieldName) >= 0 ? false : true,
      disabled: gridMetaData[title]?.disabled && gridMetaData[title]?.disabled.indexOf(field?.fieldName) >= 0 ? true : false,
      editable: field?.isColumnEditable ?? false,
      primaryField: field?.primaryField ?? false
    };
    return commonFieldData;
  }
};

export const generateCustomTableColumns = (fields: any[], currency: string, renderedFrom = null) => {
  let column = [];
  let _fields = fields;
  _fields.forEach((ele) => {
    if (ele.type === 'converter' || ele.type === 'currencyAmount' || ele.isConverter === true) {
      const currencySymbol = getUniqueCurrencies().find((d) => d.currencyCode === currency)?.symbolNative;

      if (ele.type !== 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
        ele.displayUnits.forEach((_unit) => {
          let fieldName = ele.fieldName + '_' + _unit.toLowerCase();
          let fieldLabel = ele.fieldLabel + ' ' + _unit;
          column.push({
            accessor: fieldName,
            Header: fieldLabel,
            Cell: ({ row }) => {
              return row?.original[fieldName] ? <p>{row?.original[fieldName]}</p> : <NoDataCell />;
            },
            editable: Boolean(ele?.isColumnEditable),
            primaryField: ele?.primaryField ?? false
          });
        });
      } else if (ele.type === 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
        ele.displayUnits.forEach((_unit) => {
          ele.displayCurrency.forEach((_currency) => {
            let fieldName = ele.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
            let fieldLabel = ele.fieldLabel + ' ' + _unit + '/' + _currency;
            column.push({
              accessor: fieldName,
              Header: fieldLabel,
              editable: Boolean(ele?.isColumnEditable),
              primaryField: ele?.primaryField ?? false,
              Cell: ({ row }) => {
                return row?.original[fieldName] ? (
                  <p>{formatAmountWithCurrency(currency, row?.original[fieldName])?.amountWithouCurrencyCode}</p>
                ) : (
                  <NoDataCell />
                );
              }
            });
          });
        });
      } else if (ele.type === 'currencyAmount') {
        ele.displayCurrency.forEach((_currency) => {
          let fieldName = ele.fieldName + '_' + _currency.toLowerCase();
          let fieldLabel = ele.fieldLabel + ' ' + _currency;
          column.push({
            accessor: fieldName,
            Header: fieldLabel,
            editable: Boolean(ele?.isColumnEditable),
            primaryField: ele?.primaryField ?? false,
            Cell: ({ row }) => {
              return row?.original[fieldName] ? (
                <p>{formatAmountWithCurrency(currency, row?.original[fieldName])?.amountWithouCurrencyCode}</p>
              ) : (
                <NoDataCell />
              );
            },
            Footer: (info) => {
              const total = info?.rows
                ?.filter((f) => !f.original.parentId && f.values.hasOwnProperty(fieldName) && !isNaN(f.values[fieldName]))
                .reduce((sum, row) => row.values[fieldName] + sum, 0);
              return (
                <>
                  {currencySymbol} {formatAmountWithCurrency(currency, total)?.amountWithouCurrencyCode ?? total}
                </>
              );
            }
          });
        });
      }
    } else {
      if (column.filter((_c) => _c.accessor === ele.fieldName && _c.Header === ele.fieldLabel).length === 0) {
        let currentColumn: any = getCustomColumnData(renderedFrom, ele);
        if (ele.type === 'date') {
          column.push({
            ...currentColumn,
            disableFilters: true,
            width: 200,
            Cell: ({ row }) => (row.original[ele.fieldName] ? <p>{moment(row.original[ele.fieldName])?.format(dateFormat) || ''}</p> : <NoDataCell />)
          });
        } else if (ele.type === 'dateTime') {
          column.push({
            ...currentColumn,
            disableFilters: true,
            width: 200,
            Cell: ({ row }) => (row.original[ele.fieldName] ? <p>{moment(row.original[ele.fieldName]).format(dateTimeFormat)}</p> : <NoDataCell />)
          });
        } else if (ele.type === 'dropDown') {
          column.push({
            ...currentColumn,
            width: 200,
            Cell: ({ row }) =>
              row.original[ele.fieldName] ? ele.lookup ? columnData(ele, row) : <p>{row.original[ele.fieldName]}</p> : <NoDataCell />
          });
        } else if (ele.type === 'decimal') {
          column.push({
            ...currentColumn,
            width: 200,
            Cell: ({ row }) => (row.original[ele.fieldName] ? <p>{row.original[ele.fieldName]}</p> : <NoDataCell />),
            Footer: (info) => {
              const qtyTotal = info.rows
                .filter((f) => !f.original.parentId && f.original.hasOwnProperty(ele.fieldName) && !isNaN(f.original[ele.fieldName]))
                .reduce((sum, row) => row.original[currentColumn.accessor] + sum, 0);
              return <>{qtyTotal}</>;
            }
          });
        } else if (ele.type === 'checkBox') {
          column.push({
            ...currentColumn,
            width: 200,
            Cell: ({ row }) => (row.original[ele.fieldName] ? <p>{Boolean(row.original[ele.fieldName]) ? 'Yes' : 'No'}</p> : <NoDataCell />)
          });
        } else if (ele.type === 'multiSelect') {
          column.push({
            ...currentColumn,
            width: 200,
            Cell: ({ row }) =>
              row.original[ele.fieldName] ? ele.lookup ? columnData(ele, row) : <p>{row.original[ele.fieldName]?.join()}</p> : <NoDataCell />
          });
        } else {
          column.push({
            ...currentColumn,
            width: 200,
            Cell: ({ row }) =>
              row.original[ele.fieldName] ? (
                ele.lookup ? (
                  columnData(ele, row)
                ) : (
                  <p className="text-truncate">{row.original[ele.fieldName]}</p>
                )
              ) : (
                <NoDataCell />
              )
          });
        }
      }
    }
  });

  return column;
};

const columnData = (ele, row) => {
  // make lookup resource string first letter capital and remove every space using lodash
  const lookupResource = camelCase(ele.lookupResource).replace(/\s/g, '');
  const path = routes[`${lookupResource}Detail`].path;
  if (ele.type === 'multiSelect' && ele.lookup) {
    return (
      <p>
        {row.original[ele.fieldName]?.length ? (
          <p className="text-truncate">
            {row.original[ele.fieldName]
              ?.map((d) => {
                return (
                  <a className={`text-truncate ${path ? 'link' : ''}`} href={`${path}/${d.optionValue}`}>
                    {d.optionLabel}
                  </a>
                );
              })
              ?.reduce((prev, curr) => [prev, ', ', curr])}
          </p>
        ) : (
          <NoDataCell />
        )}
      </p>
    );
  } else if (ele.type === 'dropDown' && ele.lookup) {
    return (
      <p>
        {row.original[ele.fieldName]?.optionLabel ? (
          <a className={`text-truncate ${path ? 'link' : ''}`} href={`${path}/${row.original[ele.fieldName]?.optionValue}`}>
            {row.original[ele.fieldName]?.optionLabel}
          </a>
        ) : (
          <NoDataCell />
        )}
      </p>
    );
  } else {
    return row.original[ele.fieldName]?.optionLabel ? (
      <a className={`text-truncate ${path ? 'link' : ''}`} href={`${path}/${row.original[ele.fieldName]?.optionValue}`}>
        {row.original[ele.fieldName]?.optionLabel}
      </a>
    ) : (
      <NoDataCell />
    );
  }
};

const getMembers = (mem) => {
  const member = { ...mem };
  delete member.subRows;
  if (!mem.subRows || !mem.subRows.length) {
    return member;
  }
  return [member, flatMapDeep(mem.subRows, getMembers)];
};

export function flattenArray(array) {
  return flatMapDeep(array, getMembers);
}

