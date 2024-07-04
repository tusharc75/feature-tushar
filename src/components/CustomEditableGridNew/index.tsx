import { Box, Button, Dialog, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition, getObjKeysWithValues } from 'src/constants/helpers';
import MaUTable from '@material-ui/core/Table';
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
import { useEffect, useMemo, useState } from 'react';
import FormTypes from 'src/components/CustomEditableGridNew/FormTypes';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import { isEmpty } from 'lodash';
import { yupSchemaForBulkEdit } from 'src/components/CustomEditableGridNew/helper';

const CustomEditableGrid = ({ onClose, fields, columns, data, extraDisabledFields, handleSave, isSubmitting }) => {
  const [displayRows, setDisplayRows] = useState([]);
  const [flatRows, setFlatRows] = useState(null);
  const [constColummns, setConstColummns] = useState([]);
  const [error, setError] = useState<any>({});

  useEffect(() => {
    const arr: any = [];
    const newData = JSON.parse(JSON.stringify(data));
    newData?.forEach((_d) => {
      const obj: any = {};
      obj['_id'] = _d?._id;
      fields.forEach((_f) => {
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
    setFlatRows(arr);
  }, [data]);

  useEffect(() => {
    generateColumnField();
  }, []);

  useEffect(() => {
    if (flatRows) {
      generateRows(flatRows);
      setError(yupSchemaForBulkEdit(constColummns, flatRows));
    }
  }, [flatRows]);

  const generateColumnField = () => {
    const column = [];
    const _fields = JSON.parse(JSON.stringify(fields));
    _fields.forEach((ele) => {
      if (ele.type === 'currencyAmount' || ele?.type === 'converter' || ele?.isConverter === true) {
        if (ele?.type !== 'currencyAmount' && (ele?.type === 'converter' || ele?.isConverter === true)) {
          ele?.displayUnits.forEach((_unit) => {
            const fieldName = ele?.fieldName + '_' + _unit.toLowerCase();
            const fieldLabel = ele?.fieldLabel + ' ' + _unit;
            column.push({ ...ele, fieldName, fieldLabel });
          });
        } else if (ele?.type === 'currencyAmount' && (ele?.type === 'converter' || ele?.isConverter === true)) {
          ele?.displayUnits.forEach((_unit) => {
            ele?.displayCurrency.forEach((_currency) => {
              const fieldName = ele?.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
              const fieldLabel = ele?.fieldLabel + ' ' + _unit + '/' + _currency;
              column.push({ ...ele, fieldName, fieldLabel });
            });
          });
        } else if (ele?.type === 'currencyAmount') {
          ele?.displayCurrency.forEach((_currency) => {
            const fieldName = ele?.fieldName + '_' + _currency.toLowerCase();
            const fieldLabel = ele?.fieldLabel + ' ' + _currency;
            column.push({ ...ele, fieldName, fieldLabel });
          });
        }
      } else {
        column.push(ele);
      }
    });
    setConstColummns(column);
  };

  const newColumns = useMemo(
    () =>
      [
        ...fields.map((m) => {
          if (m?.type === 'converter' || m?.type === 'currencyAmount' || m?.isConverter === true) {
            const column = [];
            if (m?.type !== 'currencyAmount' && (m?.type === 'converter' || m?.isConverter === true)) {
              m?.displayUnits.forEach((_unit) => {
                const fieldName = m?.fieldName + '_' + _unit.toLowerCase();
                const fieldLabel = m?.fieldLabel + ' ' + _unit;
                column.push({
                  accessor: fieldName,
                  accessorKey: fieldName,
                  Header: fieldLabel,
                  id: fieldName,
                  unit: _unit,
                  minWidth: 180,
                  width: 200
                });
              });
            } else if (m?.type === 'currencyAmount' && (m?.type === 'converter' || m?.isConverter === true)) {
              m?.displayUnits.forEach((_unit) => {
                m?.displayCurrency.forEach((_currency) => {
                  const fieldName = m?.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
                  const fieldLabel = m?.fieldLabel + ' ' + _unit + '/' + _currency;
                  column.push({
                    accessor: fieldName,
                    accessorKey: fieldName,
                    Header: fieldLabel,
                    id: fieldName,
                    currency: _currency,
                    unit: _unit,
                    minWidth: 180,
                    width: 200
                  });
                });
              });
            } else if (m?.type === 'currencyAmount') {
              m?.displayCurrency.forEach((_currency) => {
                const fieldName = m?.fieldName + '_' + _currency.toLowerCase();
                const fieldLabel = m?.fieldLabel + ' ' + _currency;
                column.push({
                  accessor: fieldName,
                  accessorKey: fieldName,
                  Header: fieldLabel,
                  id: fieldName,
                  currency: _currency,
                  minWidth: 180,
                  width: 200
                });
              });
            }
            return column;
          }
          return {
            accessor: m?.fieldName,
            accessorKey: m?.fieldName,
            Header: m?.fieldLabel,
            id: m?.fieldName,
            minWidth: 220,
            width: 250
          };
        })
      ]?.flat(1),
    // columns?.filter((c) => !['index', 'action']?.includes(c?.accessor)),
    []
  );

  const { getTableProps, rows, headerGroups, footerGroups, prepareRow, toggleRowExpanded, toggleAllRowsExpanded } = useTable(
    {
      columns: newColumns,
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

  const generateRows = (flatRows) => {
    const tempRows = flatRows.map((d) => {
      let tempFieldData = getObjKeysWithValues(d, fields);
      return { ...d, ...tempFieldData };
    });

    let rows = tempRows.filter((e) => !e?.parentId || e.parentId === null);
    setDisplayRows(rows);
  };

  const updateData = async (row, value, inputField = '') => {
    let temflatRows = flatRows;
    let tempIndex = temflatRows.findIndex((obj) => obj._id === row._id);
    let obj: any = {};
    if (!inputField) {
      obj = value;
    } else {
      obj[inputField] = value;
    }
    temflatRows = flatRows.map((d, i) => {
      if (i === tempIndex && row?._id === d?._id) {
        return { ...d, ...obj };
      } else {
        return d;
      }
    });
    setFlatRows(temflatRows);
  };

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={true}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
    >
      <>
        <CustomDialogHeader isMinimized={false} showManimizeMaximize={false} showRequiredLabel={false} title={`Bulk Edit `} onClose={onClose} />
        {rows && rows?.length ? (
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
                  {/* {rows?.length > 0 && (
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
									)} */}
                </MaUTable>
              </div>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button size="small" color="primary" onClick={onClose}>
                Close
              </Button>
              <CustomButton
                loading={isSubmitting}
                variant="contained"
                color="primary"
                type="submit"
                onClick={() => {
                  if (isEmpty(error)) {
                    handleSave(flatRows);
                  }
                }}
              >
                Save
              </CustomButton>
            </CustomDialogFooter>
          </>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </>
    </Dialog>
  );
};

export default CustomEditableGrid;
