import { VirtualItem } from '@tanstack/react-virtual';
import { uniqBy } from 'lodash';

export const yupSchemaForBulkEdit = (fields: any[], values: any[]) => {
  const schema = {};
  values.forEach((element) => {
    fields.forEach((input) => {
      if (input.type === 'multiSelect') {
        if (input.required && !Boolean(element[`${input.fieldName}`]?.length)) {
          schema[`${element._id}_${input.fieldName}`] = `${input.fieldLabel} is required`;
        }
      } else {
        if (input.required && !Boolean(element[`${input.fieldName}`])) {
          schema[`${element._id}_${input.fieldName}`] = `${input.fieldLabel} is required`;
        }
      }
    });
  });
  return schema;
};

export const generateColumn = (fields, columnOrder: string[] = [], hiddenColumns: string[] = []) => {
  const newColumns: any = [
    {
      accessor: 'index',
      accessorKey: 'index',
      Header: 'Index',
      id: 'index',
      sticky: 'left',
      minWidth: 70,
      width: 70
    }
  ];
  const constColumns: any = [];
  fields?.forEach((_field) => {
    if (_field?.type === 'converter' || _field?.type === 'currencyAmount' || _field?.isConverter === true) {
      if (_field?.type !== 'currencyAmount' && (_field?.type === 'converter' || _field?.isConverter === true)) {
        _field?.displayUnits.forEach((_unit) => {
          const fieldName = _field?.fieldName + '_' + _unit.toLowerCase();
          const fieldLabel = _field?.fieldLabel + ' ' + _unit;
          newColumns.push({
            accessor: fieldName,
            accessorKey: fieldName,
            Header: fieldLabel,
            id: fieldName,
            required: _field?.required,
            unit: _unit,
            minWidth: 180,
            width: 200
          });

          constColumns.push({ ..._field, fieldName, fieldLabel });
        });
      } else if (_field?.type === 'currencyAmount' && (_field?.type === 'converter' || _field?.isConverter === true)) {
        _field?.displayUnits.forEach((_unit) => {
          _field?.displayCurrency.forEach((_currency) => {
            const fieldName = _field?.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
            const fieldLabel = _field?.fieldLabel + ' ' + _currency + '/' + _unit;
            newColumns.push({
              accessor: fieldName,
              accessorKey: fieldName,
              Header: fieldLabel,
              id: fieldName,
              required: _field?.required,
              currency: _currency,
              unit: _unit,
              minWidth: 180,
              width: 200
            });
            constColumns.push({ ..._field, fieldName, fieldLabel });
          });
        });
      } else if (_field?.type === 'currencyAmount') {
        _field?.displayCurrency.forEach((_currency) => {
          const fieldName = _field?.fieldName + '_' + _currency.toLowerCase();
          const fieldLabel = _field?.fieldLabel + ' ' + _currency;
          newColumns.push({
            accessor: fieldName,
            accessorKey: fieldName,
            Header: fieldLabel,
            id: fieldName,
            required: _field?.required,
            currency: _currency,
            minWidth: 180,
            width: 200
          });
          constColumns.push({ ..._field, fieldName, fieldLabel });
        });
      }
    } else {
      newColumns.push({
        accessor: _field?.fieldName,
        accessorKey: _field?.fieldName,
        Header: _field?.fieldLabel,
        id: _field?.fieldName,
        required: _field?.required,
        minWidth: 260,
        width: 280
      });
      constColumns.push(_field);
    }
  });

  let updatedColumns = hiddenColumns.length > 0 ? newColumns.filter((d) => !hiddenColumns.includes(d.accessor)) : newColumns;
  if (columnOrder.length > 0) {
    updatedColumns = [...updatedColumns].sort((a, b) => columnOrder.indexOf(a.accessor) - columnOrder.indexOf(b.accessor));
  }

  updatedColumns.push({
    accessor: 'action',
    accessorKey: 'action',
    Header: 'Action',
    id: 'action',
    sticky: 'right',
    minWidth: 120,
    width: 120
  });
  return { newColumns: updatedColumns, constColumns };
};

export const generateRows = (data, fields) => {
  const arr: any = [];
  data?.forEach((_d, i) => {
    const obj: any = {};
    obj['index'] = i + 1;
    obj['_id'] = _d?._id;
    fields?.forEach((_f) => {
      if (_f.type === 'switch' || _f.type === 'checkBox') {
        obj[_f.fieldName] = _d[_f.fieldName] ? _d[_f.fieldName] : false;
      } else if (_f?.type === 'dropDown' && _f?.lookup) {
        obj[_f?.fieldName] = _d[`${_f?.fieldName}Id`] ? _d[`${_f?.fieldName}Id`] : '';
        delete _d[`${_f?.fieldName}Id`];
      } else if (_f?.type === 'multiSelect') {
        let value = [];
        if (_f?.lookup) {
          value = _d[`${_f?.fieldName}Id`] ? [_d[`${_f?.fieldName}Id`]] : [];
          if (_d[`rest${_f?.fieldName}`]?.length > 0) {
            _d[`rest${_f?.fieldName}`]?.forEach((e) => {
              value.push(e?.optionValue);
            });
          }
        } else {
          value = _d[_f?.fieldName] ? _d[_f?.fieldName]?.split(',')?.map((e) => e?.trim()) : [];
        }
        obj[_f?.fieldName] = value;
        delete _d[`${_f?.fieldName}Id`];
        delete _d[`rest${_f?.fieldName}`];
      } else if (_f?.type === 'freeStyleMultiSelect') {
        obj[_f?.fieldName] = _d[_f?.fieldName] ? _d[_f?.fieldName] : [];
      } else if (_f.type === 'converter' || _f.type === 'currencyAmount' || _f.isConverter === true) {
        if (_f.type !== 'currencyAmount' && (_f.type === 'converter' || _f.isConverter === true)) {
          _f.displayUnits &&
            _f.displayUnits.forEach((_unit) => {
              let fieldName = _f.fieldName + '_' + _unit.toLowerCase();
              if (_f.fieldName.includes('_')) {
                fieldName = _f.fieldName;
              }
              obj[fieldName] = _d[fieldName] ? _d[fieldName] : 0;
            });
        } else if (_f.type === 'currencyAmount' && (_f.type === 'converter' || _f.isConverter === true)) {
          _f.displayCurrency &&
            _f.displayCurrency.forEach((_currency) => {
              _f.displayUnits &&
                _f.displayUnits.forEach((_unit) => {
                  let fieldName = _f.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
                  if (_f.fieldName.includes('_')) {
                    fieldName = _f.fieldName;
                  }
                  obj[fieldName] = _d[fieldName] ? _d[fieldName] : 0;
                });
            });
        } else if (_f.type === 'currencyAmount') {
          _f.displayCurrency &&
            _f.displayCurrency.forEach((_currency) => {
              let fieldName = _f.fieldName + '_' + _currency.toLowerCase();
              if (_f.fieldName.includes('_')) {
                fieldName = _f.fieldName;
              }
              obj[fieldName] = _d[fieldName] ? _d[fieldName] : 0;
            });
        }
      } else if (_f.type === 'decimal' || _f.type === 'percent' || _f.type === 'formula') {
        obj[_f.fieldName] = _d[_f.fieldName] || _d[_f.fieldName] === 0 ? _d[_f.fieldName] : 0;
      } else {
        obj[_f?.fieldName] = _d[_f?.fieldName] ? _d[_f?.fieldName] : '';
      }
    });
    arr.push({ ..._d, ...obj });
  });

  return arr;
};

export const getColumnData = (columns: { width: number; sticky?: 'left' | 'right' }[]) => {
  const data: { widths: number[]; stickyIndexes: number[]; left: number[]; right: number[] } = { widths: [], stickyIndexes: [], left: [], right: [] };
  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    data.widths.push(column.width);
    if (column.sticky) {
      data.stickyIndexes.push(i);
    }
    if (column.sticky === 'left') {
      data.left.push(i);
    }
    if (column.sticky === 'right') {
      data.right.push(i);
    }
  }
  return data;
};

export const lerp = (a: number, b: number, t: number) => {
  return a + (b - a) * t;
};

export function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
}
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
