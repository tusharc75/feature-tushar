import React, { ReactNode, useState, useCallback } from 'react';
import styles from './index.module.scss';
import { Checkbox, Typography } from '@material-ui/core';

interface TableInterface extends React.HTMLAttributes<HTMLTableElement> {
  data: any[];
  columns: columnsInterface[];
  uniqueKey: (data: any) => string;
  checkBox?: boolean;
  onSelect?: any;
  height?: string;
}
interface columnsInterface extends React.HTMLAttributes<HTMLTableCellElement> {
  header: string;
  minWidth?: number;
  width?: number;
  render: (data: any) => ReactNode;
}

const CustomTable: React.FC<TableInterface> = ({ data, columns, uniqueKey, className, checkBox, onSelect = null, height, ...others }) => {
  const [selected, setSelected] = useState<any>([]);

  const selectAll = useCallback(() => {
    if (selected.length === data.length) {
      setSelected([]);
      onSelect([]);
    } else {
      setSelected(data);
      onSelect(data);
    }
  }, [selected.length, data.length]);

  const isChecked = useCallback(
    (row) => {
      return selected.findIndex((item) => uniqueKey(item) === uniqueKey(row)) > -1 ? true : false;
    },
    [selected]
  );

  const chekSingle = useCallback(
    (row) => {
      const checked = isChecked(row);
      if (checked) {
        const newSelected = selected.filter((item) => uniqueKey(item) !== uniqueKey(row));
        setSelected(newSelected);
        onSelect(newSelected);
      } else {
        const newSelected = [...selected, row];
        setSelected(newSelected);
        onSelect(newSelected);
      }
    },
    [selected, isChecked]
  );

  return (
    <div className={styles.tableWrapper} style={{ maxHeight: height }}>
      <table {...others} className={`${styles.table} ${className}`}>
        <thead>
          {checkBox && (
            <th style={{ minWidth: '48px' }} className={`${styles.checkBox} `}>
              <Checkbox
                style={{ padding: '0' }}
                inputProps={{ 'aria-label': 'Select all' }}
                checked={selected.length === data.length}
                onChange={selectAll}
              />
            </th>
          )}
          {columns.map((column, index) => {
            return (
              <th key={column.header} {...column} style={{ width: `${column.width}px}`, minWidth: `${column.minWidth}px` }}>
                <Typography component={'span'}>{column.header}</Typography>
              </th>
            );
          })}
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={uniqueKey(row)}>
              {checkBox && (
                <td style={{ minWidth: '48px' }} className={`${styles.checkBox} `}>
                  <Checkbox
                    style={{ padding: '0' }}
                    inputProps={{ 'aria-label': 'Select' }}
                    checked={isChecked(row)}
                    onChange={() => chekSingle(row)}
                  />
                </td>
              )}
              {columns.map((column, index) => (
                <td key={index} style={{ width: `${column.width}px}`, minWidth: `${column.minWidth}px` }}>
                  <div>{row ? column.render({ row }) : ''}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomTable;
