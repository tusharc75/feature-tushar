import { IconButton, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import MaUTable from '@material-ui/core/Table';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { getObjKeysWithValues } from 'src/constants/helpers';

const CustomTable = ({ columns, flatRows, setFlatRows, constColummns, fields, extraDisabledFields, error, updateData, scrollToHeader }) => {
  const [displayRows, setDisplayRows] = useState([]);

  const columnRefs = useRef([]);

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

  const handleClone = (row) => {
    const _id = `${Date.now()}`;
    setFlatRows([...flatRows, { ...row, id: _id, _id: _id, index: flatRows?.length + 1 }]);
  };

  const handleDelete = (row) => {
    setFlatRows([...flatRows?.filter((r) => r?._id != row?._id)]);
  };

  useEffect(() => {
    const header = constColummns?.find((c) => c?.fieldName === scrollToHeader?.split('_').slice(1).join('_'))?.fieldLabel;
    const index = columns.findIndex((column) => column.Header === header);

    if (index !== -1 && columnRefs.current[index - 1]) {
      columnRefs.current[index - 1].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start'
      });
    }
  }, [scrollToHeader]);

  const setColumnRef = useCallback((index, ref) => {
    columnRefs.current[index] = ref;
  }, []);

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
                <TableCell
                  key={`${index}-${column?.Header}`}
                  {...column.getHeaderProps()}
                  className="th text-truncate table-header overflow-initial"
                  ref={(ref) => setColumnRef(index, ref)}
                >
                  <div className="d-flex align-items-center justify-content-space-between pos-rel">
                    <div className="d-flex align-items-center gap-2" {...column.getSortByToggleProps({ title: undefined })}>
                      <span
                        title={column.render('Header')}
                        className="text-truncate"
                        style={{ maxWidth: `${column?.width - 15}px`, fontWeight: 600 }}
                      >
                        {column.render('Header')}
                      </span>
                      {column?.required && <span style={{ color: '#dc3545', fontSize: '20px' }}>*</span>}
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
                      className={`td ${cell.column.setCellClassNames ? cell.column.setCellClassNames(row.original) : ''} snap-center `}
                    >
                      {['index']?.includes(cell.column.id) ? (
                        <div className="full-height-cell">{cell.render('Cell')}</div>
                      ) : ['action']?.includes(cell.column.id) ? (
                        <div className="mt-[10px]">
                          <HtmlTooltip title={'Clone'}>
                            <span>
                              <IconButton
                                size="small"
                                aria-label="Clone"
                                onClick={() => {
                                  handleClone(row?.original);
                                }}
                              >
                                <FileCopyIcon fontSize="small" color={'primary'} />
                              </IconButton>
                            </span>
                          </HtmlTooltip>

                          <HtmlTooltip title={'Delete'}>
                            <span>
                              <IconButton
                                size="small"
                                aria-label="Delete"
                                disabled={row?.original?.canDelete ? false : true}
                                onClick={() => {
                                  handleDelete(row?.original);
                                }}
                              >
                                <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
                              </IconButton>
                            </span>
                          </HtmlTooltip>
                        </div>
                      ) : (
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
                      )}
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
