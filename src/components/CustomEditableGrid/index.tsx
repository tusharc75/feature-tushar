import { Box, Button, Dialog, TableBody, TableCell, TableFooter, TableHead, TableRow } from '@mui/material';
import MaUTable from '@mui/material/Table';
import { isEmpty } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaAngleDown, FaAngleRight } from 'react-icons/fa';
import {
  useColumnOrder,
  useExpanded,
  useFilters,
  useFlexLayout,
  useResizeColumns,
  useRowSelect,
  useRowState,
  useSortBy,
  useTable
} from 'react-table';
import { useSticky } from 'react-table-sticky';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { flattenArray } from 'src/constants/columns';
import { CustomDialogTransition, getObjKeysWithValues } from 'src/constants/helpers';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import CustomButton from '../Helpers/CustomButton';
import { calculateRowsField } from '../RentalManagment/helper';
import FormTypes from './FormTypes';
import { yupSchemaForBulkEdit } from './helper';

const CustomEditableGrid = ({ onClose, data, fields, columns, currency, handleSave }) => {
  const [fullScreen, setFullScreen] = useState(true);
  const [displayRows, setDisplayRows] = useState([]);
  const [constColummns, setConstColummns] = useState([]);
  const [flatRows, setFlatRows] = useState(data);
  const [touched, setTouched] = useState<any>({});
  const [error, setError] = useState<any>({});

  useEffect(() => {
    generateColumnField();
  }, []);

  useEffect(() => {
    generateRows();
    setError(yupSchemaForBulkEdit(constColummns, flatRows));
  }, [flatRows]);

  const generateColumnField = () => {
    let column = [];
    let _fields = JSON.parse(JSON.stringify(fields));
    _fields.forEach((ele) => {
      if (ele.type === 'currencyAmount') {
        ele.fieldLabel = ele.fieldLabel + ' ' + currency;
        ele.fieldName = ele.fieldName + '_' + currency?.toLowerCase();
        column.push(ele);
      } else {
        column.push(ele);
      }
    });
    setConstColummns(column);
  };

  const newColumns = useMemo(
    () => [
      {
        id: 'expander',
        fieldName: 'expander',
        Header: ({ isAllRowsExpanded }) => (
          <span
            style={{
              paddingLeft: '0.3rem',
              color: 'black'
            }}
          >
            {isAllRowsExpanded ? (
              <FaAngleDown
                className="cursor-pointer"
                onClick={() => {
                  toggleAllRowsExpanded(false);
                }}
              />
            ) : (
              <FaAngleRight
                className="cursor-pointer"
                onClick={() => {
                  toggleAllRowsExpanded(true);
                }}
              />
            )}
          </span>
        ),
        sticky: 'left',
        width: isMobile && !isTablet ? 40 : 70,
        minWidth: isMobile && !isTablet ? 40 : 70,
        canDrag: false,
        Cell: ({ row }) =>
          row.canExpand ? (
            <span
              {...row.getToggleRowExpandedProps({
                style: {
                  paddingLeft: `${row.depth * 2}rem`
                }
              })}
            >
              {row.isExpanded ? <FaAngleDown /> : <FaAngleRight />}
            </span>
          ) : null
      },
      ...columns.map((m) => {
        return m.canFilter ? { ...m } : { ...m, filter: 'filterRowsWithSubrows' };
      })
    ],
    []
  );

  const { getTableProps, rows, headerGroups, footerGroups, prepareRow, toggleRowExpanded, toggleAllRowsExpanded } = useTable(
    {
      columns: newColumns,
      data: displayRows,
      initialState: {
        autoResetExpanded: false,
        expanded: true
      },
      getSubRows: (row: any) => row.subRows
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

  const generateRows = () => {
    const tempRows = flatRows.map((d) => {
      let tempFieldData = getObjKeysWithValues(d, fields);
      return { ...d, ...tempFieldData };
    });
    let rows = tempRows.filter((e) => e.parentId === null);

    rows.forEach((parent, i) => {
      parent.subRows = generateNestedData(tempRows, parent);
    });
    setDisplayRows(rows);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const updateData = async (row, inputField, value) => {
    let temflatRows = flatRows;
    let tempIndex = temflatRows.findIndex((obj) => obj._id === row._id);
    flatRows[tempIndex][inputField] = value;
    const values = { [inputField]: value };
    const calValues = await calculateRowsField(flattenArray(temflatRows), values, fields, temflatRows[tempIndex], currency);
    temflatRows = flatRows.map((d) => {
      let calculateTempIndex = calValues.findIndex((obj) => obj._id === d._id);
      if (calculateTempIndex > -1) {
        return calValues[calculateTempIndex];
      } else return d;
    });
    setFlatRows(temflatRows);
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      <CustomDialogHeader
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        title={`Bulk Edit `}
        onClose={onClose}
      />
      {rows && rows.length ? (
        <>
          <CustomDialogContent>
            <div
              style={{
                display: 'block',
                overflow: 'auto',
                height: '100%'
              }}
              className="custom-react-table editable-table-v1 border"
            >
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
                          >
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
                  {rows.map((row, index) => {
                    prepareRow(row);
                    return (
                      <TableRow {...row.getRowProps()} className="tr">
                        {row.cells.map((cell) => {
                          return (
                            <TableCell
                              {...cell.getCellProps()}
                              className={`td ${cell.column.setCellClassNames ? cell.column.setCellClassNames(row.original) : ''}`}
                            >
                              {['expander', 'detail', 'type', 'index']?.includes(cell.column.id) ? (
                                <div className="full-height-cell">{cell.render('Cell')}</div>
                              ) : (
                                <FormTypes
                                  fieldData={constColummns.find((d) => d.fieldName === cell.column.id || cell.column.id.includes(d.fieldName))}
                                  values={row.original}
                                  currency={currency}
                                  errors={error}
                                  touched={touched}
                                  style={{ marginTop: '4px' }}
                                  onChange={(inputField, val) => {
                                    updateData(row.original, inputField, val);
                                    setTouched((prevState) => {
                                      prevState[`${row.original._id}_${inputField}`] = true;
                                      return prevState;
                                    });
                                  }}
                                  size="small"
                                />
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
                {rows?.length > 0 && (
                  <TableFooter style={{ overflowY: 'auto', overflowX: 'hidden' }} className="footer ">
                    {footerGroups.map((group) => (
                      <TableRow {...group.getFooterGroupProps()} className="tr">
                        {group.headers.map((column) => (
                          <TableCell {...column.getHeaderProps()} className="th text-truncate font-weight-bold text-black">
                            {column.render('Footer')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableFooter>
                )}
              </MaUTable>
            </div>
          </CustomDialogContent>

          <CustomDialogFooter>
            <Button size="small" color="primary" onClick={onClose}>
              {'Close'}
            </Button>
            <CustomButton
              loading={false}
              variant="contained"
              color="primary"
              type="submit"
              onClick={() => {
                if (isEmpty(error)) {
                  handleSave(flatRows);
                }
              }}
            >
              {' '}
              Save
            </CustomButton>
          </CustomDialogFooter>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default CustomEditableGrid;
