import { Box, Button, Dialog, TableBody, TableCell, TableFooter, TableHead, TableRow } from "@material-ui/core";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { CustomDialogTransition, getObjKeysWithValues } from "src/constants/helpers";
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
import { useEffect, useMemo, useState } from "react";
import { calculateRowsField } from "src/components/RentalManagment/helper";
import { flattenArray } from "src/constants/columns";
import FormTypes from "src/components/CustomEditableGridNew/FormTypes";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import CustomButton from "src/components/Helpers/CustomButton";
import { isEmpty } from "lodash";
import { yupSchemaForBulkEdit } from "src/components/CustomEditableGridNew/helper";

const CustomEditableGrid = ({ onClose, fields, data, currency, extraData, extraDisabledFields, handleSave, isSubmitting }) => {

	const [displayRows, setDisplayRows] = useState([]);
	const [flatRows, setFlatRows] = useState(null);
	const [constColummns, setConstColummns] = useState([]);
	const [touched, setTouched] = useState<any>({});
	const [error, setError] = useState<any>({});

	useEffect(() => {
		const arr: any = []
		data?.forEach(_d => {
			const obj: any = {}
			obj['_id'] = _d?._id;
			fields.forEach(_f => {
				if (_f.type === 'switch' || _f.type === 'checkBox') {
					obj[_f.fieldName] = _d[_f.fieldName] ? _d[_f.fieldName] : false;
				} else if (_f?.type === 'dropDown' && _f?.lookup) {
					obj[_f?.fieldName] = _d[`${_f?.fieldName}Id`] ? _d[`${_f?.fieldName}Id`] : ''
				} else if (_f?.type === 'multiSelect') {
					let value = []
					if (_f?.lookup) {
						value = _d[`${_f?.fieldName}Id`] ? [_d[`${_f?.fieldName}Id`]] : []
						if (_d[`rest${_f?.fieldName}`]?.length > 0) {
							_d[`rest${_f?.fieldName}`]?.forEach(e => {
								value.push(e?.optionValue)
							});
						}
					} else {
						value = _d[_f?.fieldName] ? _d[_f?.fieldName]?.split(',')?.map(e => e?.trim()) : []
					}
					obj[_f?.fieldName] = value;
				} else if (_f?.type === 'freeStyleMultiSelect') {
					obj[_f?.fieldName] = _d[_f?.fieldName] ? _d[_f?.fieldName] : []
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
					obj[_f?.fieldName] = _d[_f?.fieldName] ? _d[_f?.fieldName] : ''
				}
			});
			extraData?.forEach(e => {
				obj[e] = _d[e]
			});
			arr.push(obj)
		});
		setFlatRows(arr)
	}, [data])

	useEffect(() => {
		generateColumnField();
	}, []);

	useEffect(() => {
		if (flatRows) {
			generateRows();
			setError(yupSchemaForBulkEdit(constColummns, flatRows));
		}
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
			...fields.map((m) => {
				return ({
					accessor: m?.fieldName,
					Header: m?.fieldLabel,
					id: m?.fieldName,
					minWidth: 180,
					width: 200,
				});
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

		let rows = tempRows.filter((e) => !e?.parentId || e.parentId === null);
		setDisplayRows(rows);
	};

	const updateData = async (row, inputField, value) => {
		let temflatRows = flatRows;
		let tempIndex = temflatRows.findIndex((obj) => obj._id === row._id);
		flatRows[tempIndex][inputField] = value;
		const values = { [inputField]: value };
		const calValues = await calculateRowsField(flattenArray(temflatRows), values, fields, temflatRows[tempIndex]);
		temflatRows = flatRows.map((d) => {
			let calculateTempIndex = calValues.findIndex((obj) => obj._id === d._id);
			if (calculateTempIndex > -1) {
				const obj: any = {}
				extraData?.forEach(e => {
					obj[e] = d[e]
				});
				return ({ ...calValues[calculateTempIndex], ...obj })
			} else return d;
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
				<CustomDialogHeader
					isMinimized={false}
					showManimizeMaximize={false}
					showRequiredLabel={false}
					title={`Bulk Edit `}
					onClose={onClose}
				/>
				{rows && rows?.length ? (
					<>
						<CustomDialogContent>
							<div
								style={{
									display: 'block',
									overflow: 'auto',
									height: '100%'
								}}
								className="border custom-react-table editable-table-v1"
							>
								<MaUTable {...getTableProps()} size="small" className="tableWrap table sticky">
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
																<div className="d-flex gap-2 align-items-center" {...column.getSortByToggleProps({ title: undefined })}>
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
																{['expander', 'detail', 'type', 'index']?.includes(cell.column.id) ? (
																	<div className="full-height-cell">{cell.render('Cell')}</div>
																) : (
																	<FormTypes
																			fieldData={fieldData}
																		values={row?.original}
																		currency={currency}
																		errors={error}
																		touched={touched}
																			disabled={extraDisabledFields?.includes(fieldData?.fieldName)}
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
								Close
							</Button>
							<CustomButton
								loading={isSubmitting}
								variant="contained"
								color="primary"
								type="submit"
								onClick={() => {
									console.log('eeeeeeeeeee', error)
									if (isEmpty(error)) {
										handleSave(flatRows)
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
	)
}

export default CustomEditableGrid;
