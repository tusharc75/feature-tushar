import { TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import MaUTable from '@material-ui/core/Table';
import { useEffect, useState } from 'react';
import {
  useTable,
  useExpanded,
  useRowSelect,
  useFlexLayout,
  useSortBy,
  useResizeColumns,
  useFilters,
  useColumnOrder,
  useRowState
} from 'react-table';
import { useSticky } from 'react-table-sticky';
import FormTypes from 'src/components/CustomEditableGridNew/FormTypes';
import { getObjKeysWithValues } from 'src/constants/helpers';

const CustomTable = ({ columns, flatRows, constColummns, fields, extraDisabledFields, error, updateData }) => {
  const [displayRows, setDisplayRows] = useState([]);

  useEffect(() => {
    if (flatRows) {
      generateRows();
    }
  }, [flatRows]);

  const generateRows = () => {
    const tempRows = flatRows.map((d) => {
      let tempFieldData = getObjKeysWithValues(d, fields);
      return { ...d, ...tempFieldData };
    });

    let rows = tempRows.filter((e) => !e?.parentId || e.parentId === null);
    setDisplayRows(rows);
  };

  const { getTableProps, rows, headerGroups, footerGroups, prepareRow, toggleRowExpanded, toggleAllRowsExpanded } = useTable(
    {
      columns: columns,
      data: displayRows,
      initialState: {
        autoResetExpanded: false,
        expanded: true
      }
    },
    useFlexLayout,
    useColumnOrder,
    useResizeColumns,
    useFilters,
    useSortBy,
    useExpanded, // Use the useExpanded plugin hook
    // usePagination,
    useRowSelect,
    useSticky,
    useRowState
  );

  return (
    <MaUTable {...getTableProps()} size="small" className="tableWrap sticky table">
      <TableHead style={{ overflowY: 'auto', overflowX: 'hidden' }} className="header">
        {headerGroups.map((headerGroup, index) => (
          <>
            <TableRow {...headerGroup.getHeaderGroupProps()} key={index} className="tr">
              {headerGroup.headers.map((column, index) => (
                <TableCell key={`${index}-${column?.Header}`} {...column.getHeaderProps()} className="th text-truncate table-header overflow-initial">
                  <div className="d-flex align-items-center justify-content-space-between pos-rel">
                    <div className="d-flex align-items-center gap-2" {...column.getSortByToggleProps({ title: undefined })}>
                      <span>{column.render('Header')}</span>
                    </div>
                  </div>
                  <div {...column.getResizerProps()} className="resizer" />
                </TableCell>
              ))}
            </TableRow>
          </>
        ))}
      </TableHead>
      <TableBody
        style={{
          overflowY: 'scroll',
          overflowX: 'hidden'
        }}
        className="body"
      >
        {rows &&
          rows?.map((row, index) => {
            prepareRow(row);
            return (
              <TableRow {...row.getRowProps()} className="tr">
                {row.cells.map((cell) => {
                  const fieldData = constColummns.find((d) => d.fieldName === cell.column.id);
                  return (
                    <TableCell
                      {...cell.getCellProps()}
                      className={`td ${cell.column.setCellClassNames ? cell.column.setCellClassNames(row.original) : ''}`}
                    >
                      <FormTypes
                        fieldData={fields?.find((f) => f?._id === fieldData?._id)}
                        fields={fields}
                        name={cell?.column?.accessorKey}
                        values={row?.original}
                        options={fieldData?.option || []}
                        currency={cell?.column?.currency}
                        unit={cell?.column?.unit}
                        required={fieldData?.required}
                        disabled={fieldData?.isUneditable || extraDisabledFields?.includes(fieldData?.fieldName)}
                        setFieldValue={(name, value) => {
                          updateData(row?.original, value, name);
                        }}
                        setValues={(value) => {
                          updateData(row?.original, value);
                        }}
                        errors={error}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
      </TableBody>
    </MaUTable>
  );
};

export default CustomTable;
