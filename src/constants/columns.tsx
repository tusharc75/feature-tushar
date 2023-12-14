import routes from '../components/Helpers/Routes';
import camelCase from 'lodash/camelCase';
import { dateFormat, dateTimeFormat, formatAmountWithCurrency, getUniqueCurrencies } from './helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { flatMapDeep } from 'lodash';
import moment from 'moment';
import { Box, IconButton } from '@material-ui/core';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import SignatureCell from 'src/components/CustomReactTableNew/Cells/SignatureCell';

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
        let currentColumn: any = getColumnData(renderedFrom ? renderedFrom : routes.productBuilder.title, ele, routes.productBuilder.path);
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
      disabled:
        (gridMetaData[title]?.disabled && gridMetaData[title]?.disabled.indexOf(field?.fieldName) >= 0) || field?.stopHideColumn ? true : false,
      editable: field?.isColumnEditable ?? false,
      isHideColumnSum: field?.isHideColumnSum ?? false,
      decimalPlaces: field?.decimalPlaces,
      primaryField: field?.primaryField ?? false
    };
    return commonFieldData;
  }
};

const columnData = (ele, row) => {
  const path = routes[`${camelCase(ele?.lookupResource)}Detail`]?.path
    ? routes[`${camelCase(ele?.lookupResource)}Detail`]?.path
    : `/${camelCase(ele?.lookupResource)}/detail`;

  if (ele.type === 'multiSelect' && ele.lookup) {
    return (
      <p>
        {row.original[ele.fieldName]?.length ? (
          <p className="text-truncate">
            {row.original[ele.fieldName]
              ?.map((d) => {
                return (
                  <a className={`text-truncate ${path ? 'link' : ''}`} target="_blank" href={`${path}/${d.optionValue}`}>
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
      <>
        {row.original[ele.fieldName]?.optionLabel ? (
          <div className="d-flex gap-2 align-items-center">
            <p className="text-truncate" title={row.original[ele.fieldName]?.optionLabel}>
              {row.original[ele.fieldName]?.optionLabel}
            </p>
            {path && (
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${path}/${row.original[ele.fieldName]?.optionValue}`);
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            )}
          </div>
        ) : (
          <NoDataCell />
        )}
      </>
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
