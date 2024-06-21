import { Box, Button, CircularProgress, Dialog, Grid } from "@material-ui/core";
import axios, { CancelTokenSource } from "axios";
import { startCase } from "lodash";
import { useContext, useEffect, useState } from "react";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "src/StateProvider/Provider";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from "src/components/CustomReactTable";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import ConfirmationDialog from "src/components/Helpers/ConfirmationDialog";
import NoDataCell from "src/components/Helpers/NoDataCell";
import routes from "src/components/Helpers/Routes";
import SearchBox from "src/components/Helpers/SearchBox";
import { CustomDialogTransition, MATERIAL_TYPE, gridLoadingTimeout, isObjectEmpty, packages, prepareDataForGrid } from "src/constants/helpers";

const AddExistingProductInventory = ({ type, renderedFrom, rentalManagementData, isAddingProducts, handleClose, addMaterial }) => {

	const toastConfig = useContext(CustomToastContext);

	const { state, dispatch } = useTableReducer();
	const { dataRows, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
	const { generateColumns } = useColumns();

	const {
		state: { user, selectedEntity }
	}: any = useData();

	const [columns, setColumns] = useState(null);
	const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)

	const qtyColumn = [
		{
			accessor: 'qty',
			Header: 'Qty',
			minWidth: 150,
			width: 150,
			editable: true,
			disableFilters: true,
			disableSortBy: true,
			Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.qty || <NoDataCell />}</h5>
		}
	];

	const defaultColumns =
		type === MATERIAL_TYPE.product
			? [
				...qtyColumn,
				{
					accessor: 'availableAssetCount',
					Header: 'Available Asset',
					minWidth: 180,
					width: 180,
					disabled: true,
					Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.availableAssetCount || <NoDataCell />}</h5>
				}
			]
			: qtyColumn;

	useEffect(() => {
		fetchGridColumns();
	}, []);

	const fetchGridColumns = () => {
		axiosInstance()
			.get(type === MATERIAL_TYPE.product ? '/field?resource=Product&view=true' : `/field?resource=Packages&entity=${selectedEntity}&view=true`)
			.then(({ data: { data } }) => {
				let columns = [];
				let newColumns = generateColumns(renderedFrom, data, type === MATERIAL_TYPE.product ? routes.productDetail.path : routes.packagesDetail.path);
				columns = [...newColumns, ...getStaticFields()];
				setColumns([...defaultColumns, ...columns]);
			});
	};

	useEffect(() => {
		const cencelToken = axios.CancelToken.source();
		fetchMaterial(cencelToken);
		return () => cencelToken.cancel();
	}, [search, page, limit, filters, sorting, search, showFilteredRecordsOnly]);

	const getQueryString = () => {
		let deepFilter = `?warehouse=${rentalManagementData?.warehouse?.optionValue}&page=${page}&limit=${limit}`;
		if (showFilteredRecordsOnly) {
			deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
		}
		const updatedFilters = [];
		if (type === MATERIAL_TYPE.package) {
			updatedFilters.push({ field: 'packageType', term: 'product' });
		}
		// if (type === "product") {
		//     updatedFilters.push({ field: 'serializedProduct', term: 'yes' })
		// }
		if (!isObjectEmpty(filters)) {
			Object.keys(filters).forEach((field) => {
				updatedFilters.push({
					field: field,
					term: filters[field].filter
				});
			});
		}
		if (updatedFilters.length) {
			deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
		}
		if (sorting.length > 0) {
			deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
		}
		if (search) {
			deepFilter = `${deepFilter}&search=${search}`;
		}
		return deepFilter;
	};

	const fetchMaterial = (cancelTokenSource?: CancelTokenSource) => {
		dispatch({ type: 'loading', loading: true });
		const queryString = getQueryString();
		axiosInstance()
			.get(`${type === MATERIAL_TYPE.product ? `/rental-management/product-with-inventory` : packages.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
			.then(({ data: { data, count } }) => {
				let rows = data.map((u) => {
					let finalObject = prepareDataForGrid(u);
					finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);;
					finalObject['type'] = type;
					finalObject['qty'] = 1;
					const qtyAdded = selectedRecords?.filter((e) => e._id === u._id);
					if (qtyAdded.length) {
						finalObject['qty'] = qtyAdded[0].qty;
					}
					finalObject['productCategory'] = u.productCategory?.optionLabel;
					finalObject['priceTemplate'] = u.priceTemplate?.optionLabel;
					finalObject['unitMain'] = u.unit;
					finalObject['pricingMethodMain'] = u.pricingMethod;
					return {
						...finalObject
					};
				});
				dispatch({ type: 'initialize', data: rows, count: count });
				setTimeout(() => {
					dispatch({ type: 'loading', loading: false });
				}, gridLoadingTimeout);
			})
			.catch((error) => {
				toastConfig.setToastConfig(error);
				dispatch({ type: 'loading', loading: false });
			});
	};

	const handleSearch = (e) => {
		dispatch({ type: 'search', search: e.target.value });
	};

	const onSaveEdit = (data, row) => {
		if (!data || !data?.qty) return;
		const rows = [...dataRows];
		rows?.forEach((d) => {
			if (row?._id === d._id) {
				d.qty = parseInt(data.qty);
				d.isChecked = true;
			}
		});
		if (!selectedRecords?.find((e) => e._id === row?._id)) {
			const editRow = rows?.find((e) => e._id === row?._id);
			if (editRow) {
				dispatch({ type: 'selection', selectedRecords: [...selectedRecords, editRow] });
			}
		}
		else {
			const updatedSelectedRecords = selectedRecords?.map((e) => {
				if (e?._id === row?._id) {
					return { ...e, qty: parseInt(data?.qty), isChecked: true };
				}
				return e;
			});
			dispatch({ type: 'selection', selectedRecords: updatedSelectedRecords });
		}
		dispatch({ type: 'update', data: rows });
	};

	return (
		<Dialog
			maxWidth="md"
			fullScreen={true}
			TransitionComponent={CustomDialogTransition}
			aria-labelledby="customized-dialog-title"
			open={true}
			fullWidth
		>

			<>
				<CustomDialogHeader title={`Add ${startCase(type)}`} onClose={handleClose} showRequiredLabel={false}></CustomDialogHeader>

				<div className="listing-grid p-3">
					<Box mb={2}>
						<Grid container>
							<Grid item xs={10} sm={10} md={11} container justify="flex-end">
								<SearchBox onChange={handleSearch} className="terms_header_search_bar" width="300px" value={search} />
							</Grid>
							<Grid item xs={2} sm={2} md={1} container justify="flex-end">
								<Box ml={1}>
									<Button
										size="small"
										color="primary"
										onClick={() => {
											if (type === MATERIAL_TYPE.package && selectedRecords?.some(r => r?.qty > 1)) {
												setShowConfirmationDialog(true)
											} else {
												addMaterial(selectedRecords)
											}
										}}
										variant="contained"
										disabled={!selectedRecords?.length || isAddingProducts}
										endIcon={isAddingProducts && <CircularProgress size={20} color="primary" />}
									>
										Add
										{selectedRecords?.length ? ' (' + selectedRecords?.length + ')' : ''}
									</Button>
								</Box>
							</Grid>
						</Grid>
					</Box>
					{columns ? (
						<CustomReactTable
							height={'calc(100vh - 250px)'}
							columns={columns}
							state={state}
							dispatch={dispatch}
							renderedFrom={'renderedFrom'}
							onSaveEdit={onSaveEdit}
							refreshGrid={fetchMaterial}
							showOnlyShowFilteredRecordSwitch={true}
						/>
					) : (
						<Box p={2} height={500}>
							<CommonSkeleton lenArray={[...Array(10).keys()]} />
						</Box>
					)}
				</div>

				{showConfirmationDialog && (
					<ConfirmationDialog
						open={true}
						message="Please confirm this if you want to split this quantity into multiple line item(s)?"
						onOk={() => {
							setShowConfirmationDialog(false);
							const data: any = []
							selectedRecords?.forEach(r => {
								for (let i = 0; i < r?.qty; i++) {
									data.push({
										...r,
										qty: 1
									})
								}
							});
							addMaterial(data)
						}}
						onClose={() => {
							setShowConfirmationDialog(false);
							addMaterial(selectedRecords)
						}}
					/>
				)}

			</>
		</Dialog>
	)
}

export default AddExistingProductInventory;
