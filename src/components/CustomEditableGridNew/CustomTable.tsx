import { IconButton, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import MaUTable from '@material-ui/core/Table';
import { ChevronLeft, ChevronRight } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useScrollController } from 'src/hooks';
import { useVirtualizer, defaultRangeExtractor, Range } from '@tanstack/react-virtual';
import { addStickyIndexesInVirtualColumn, getColumnData } from 'src/components/CustomEditableGridNew/helper';

const CustomTable = ({ columns, flatRows, setFlatRows, constColummns, fields, extraDisabledFields, error, updateData, scrollToHeader }) => {
  const [displayRows, setDisplayRows] = useState([]);
  const activeStickyIndexRef = React.useRef(0);
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

  const {
    getTableProps,
    rows: tableRows,
    headerGroups,
    prepareRow,
    visibleColumns
  } = useTable(
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

  const {
    isLeftDisabled,
    isRightDisabled,
    scrollLeft,
    scrollRight,
    setRef: scrollContainerRef,
    container: tableContainer
  } = useScrollController({ scrollDistance: Math.floor(window.innerWidth / 2) });

  const { stickyIndexes } = useMemo(() => getColumnData(visibleColumns), [visibleColumns]);

  const isSticky = (index: number) => stickyIndexes.includes(index);

  const isActiveSticky = (index: number) => activeStickyIndexRef.current === index;

  const columnVirtualizer = useVirtualizer({
    count: visibleColumns?.length,
    estimateSize: (index) => {
      return visibleColumns[index].width;
    },
    getScrollElement: () => tableContainer,
    horizontal: true,
    overscan: 3
    // rangeExtractor: React.useCallback(
    //   (range: Range) => {
    //     activeStickyIndexRef.current = [...stickyIndexes].find((index) => range.startIndex >= index) ?? 0;

    //     const next = new Set([...defaultRangeExtractor(range), activeStickyIndexRef.current]);

    //     return [...next].sort((a, b) => a - b);
    //   },
    //   [stickyIndexes]
    // )
  });

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    estimateSize: () => 65,
    getScrollElement: () => tableContainer,
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5
  });

  const virtualColumns = columnVirtualizer.getVirtualItems();

  const virtualRows = rowVirtualizer.getVirtualItems();

  //different virtualization strategy for columns - instead of absolute and translateY, we add empty columns to the left and right
  let virtualPaddingLeft: number | undefined;
  let virtualPaddingRight: number | undefined;

  if (columnVirtualizer && virtualColumns?.length) {
    virtualPaddingLeft = virtualColumns[0]?.start ?? 0;
    virtualPaddingRight = columnVirtualizer.getTotalSize() - (virtualColumns[virtualColumns.length - 1]?.end ?? 0);
  }

  return (
    <>
      <div
        style={{
          display: 'block',
          overflow: 'auto',
          height: 'calc(100vh - 230px)',
          marginTop: '10px'
        }}
        ref={scrollContainerRef}
        className="custom-react-table editable-table-v1 border"
      >
        <MaUTable {...getTableProps()} style={{ display: 'grid' }} size="small">
          <TableHead
            style={{
              display: 'grid',
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}
          >
            {headerGroups.map((headerGroup, index) => (
              <>
                <TableRow {...headerGroup.getHeaderGroupProps()} key={index} style={{ display: 'flex', width: '100%' }}>
                  {virtualPaddingLeft ? <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingLeft }} /> : null}

                  {virtualColumns.map((vc) => {
                    const header = headerGroup.headers[vc.index];
                    return (
                      <TableCell
                        key={`${index}-${header?.Header}`}
                        {...header.getHeaderProps()}
                        className="th text-truncate table-header overflow-initial editable-table-cell relative"
                        ref={(ref) => setColumnRef(index, ref)}
                      >
                        <div className="d-flex align-items-center justify-content-space-between pos-rel">
                          <div className="d-flex align-items-center gap-2" {...header.getSortByToggleProps({ title: undefined })}>
                            <span
                              title={header.render('Header')}
                              className="text-truncate"
                              style={{ maxWidth: `${header?.width - 15}px`, fontWeight: 600 }}
                            >
                              {header.render('Header')}
                            </span>
                            {header?.required && <span style={{ color: '#dc3545', fontSize: '20px' }}>*</span>}
                          </div>
                        </div>
                        <div {...header.getResizerProps()} className="resizer absolute right-0 top-0 h-full w-[5px]" />
                      </TableCell>
                    );
                  })}
                  {/* {headerGroup.headers.map((column, index) => (
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
                  ))} */}
                  {virtualPaddingRight ? <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingRight }} /> : null}
                </TableRow>
              </>
            ))}
          </TableHead>
          <TableBody
            style={{
              display: 'grid',
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative'
              // overflowY: 'scroll',
              // overflowX: 'hidden'
            }}
            className="body"
          >
            {virtualRows?.map((virtualRow) => {
              const row = tableRows[virtualRow.index];
              prepareRow(row);
              const visibleCells = row.cells;

              return (
                <TableRow
                  {...row?.getRowProps()}
                  className="tr"
                  data-index={virtualRow.index} //needed for dynamic row height measurement
                  ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
                  key={row.id}
                  style={{
                    display: 'flex',
                    position: 'absolute',
                    transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
                    width: '100%'
                  }}
                >
                  {virtualPaddingLeft ? (
                    //fake empty column to the left for virtualization scroll padding
                    <td style={{ display: 'flex', width: virtualPaddingLeft }} />
                  ) : null}
                  {virtualColumns.map((vc) => {
                    const cell = visibleCells[vc.index];
                    const fieldData = constColummns.find((d) => d.fieldName === cell.column.id);
                    return (
                      <TableCell
                        style={{
                          display: 'flex',
                          width: cell.column.width,
                          minWidth: cell.column.minWidth
                        }}
                        {...cell.getCellProps()}
                        className={`td editable-table-cell ${cell.column.setCellClassNames ? cell.column.setCellClassNames(row.original) : ''} snap-center `}
                        key={cell.id}
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
                  {virtualPaddingRight ? (
                    //fake empty column to the right for virtualization scroll padding
                    <td style={{ display: 'flex', width: virtualPaddingRight }} />
                  ) : null}
                </TableRow>
              );
            })}
            {/* {tableRows &&
              tableRows?.map((row, index) => {
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
              })} */}
          </TableBody>
        </MaUTable>
      </div>
      <div className="sr-only mt-1 flex justify-end gap-3 lg:not-sr-only">
        <HtmlTooltip title="Scroll left">
          <IconButton
            style={{ borderRadius: 999, padding: 4, background: 'var(--new-theme-color)', opacity: isLeftDisabled ? '50%' : '100%' }}
            disabled={isLeftDisabled}
            onClick={scrollLeft}
          >
            <ChevronLeft className="text-white" />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title="Scroll right">
          <IconButton
            style={{ borderRadius: 999, padding: 4, background: 'var(--new-theme-color)', opacity: isRightDisabled ? '50%' : '100%' }}
            disabled={isRightDisabled}
            onClick={scrollRight}
          >
            <ChevronRight className="text-white" />
          </IconButton>
        </HtmlTooltip>
      </div>
    </>
  );
};

export default CustomTable;
