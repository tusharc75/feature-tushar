import { Box, IconButton, MenuItem } from "@material-ui/core";
import { camelCase } from "lodash";
import { useContext, useEffect, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { fetch_child_resource_fields } from "src/components/ChildResourceField";
import CustomReactTable, { useColumns, useTableReducer } from "src/components/CustomReactTable";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import NoDataCell from "src/components/Helpers/NoDataCell";
import routes from "src/components/Helpers/Routes";
import { DetailsPageHeader } from "src/components/PageHeaders";
import { CHILD_RESOURCE, DELIVERY_TICKET_REFERENCE_TYPE, DELIVERY_TICKET_TYPE, MATERIAL_TYPE, deliveryTicket } from "src/constants/helpers";
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import { ownerAndColaborator } from "src/constants/messageHelpers";
import axiosInstance from "src/axios/axiosInstance";
import AssignProductDialog from "src/components/AssignRolesDialog/AssignProductDialog";
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import MaterialDialog from "src/pages/SubcontractAssembly/Material/MaterialDialog";
import { FiExternalLink } from "react-icons/fi";

const Assign = ({ subcontractAssemblyData, stepFullScreen, allowedToEdit, setNextStep }) => {

	const renderedFrom = `${camelCase(routes?.subcontractAssembly.title)}_Assign`;
	const toastConfig = useContext(CustomToastContext);

	const { state, dispatch } = useTableReducer();
	const { dataRows, selectedRecords } = state;
	const { generateColumns } = useColumns();

	const [columns, setColumns] = useState(null);
	const [allFields, setAllFields] = useState([]);
	const [open, setOpen] = useState({ open: false, type: '' })
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [deleteData, setDeleteData] = useState(null);
	const [isDeleting, setDeleting] = useState(false);
	const [openMaterialDialog, setOpenMaterialDialog] = useState({ open: false, data: null })

	useEffect(() => {
		fetchFields();
	}, [subcontractAssemblyData]);

	useEffect(() => {
		if (columns) {
			fetchMaterial();
		}
	}, [columns]);

	const fetchFields = async () => {
		var data = await fetch_child_resource_fields(CHILD_RESOURCE.subcontractAssemblyMaterial, subcontractAssemblyData?.currency, allowedToEdit);
		setAllFields(JSON.parse(JSON.stringify(data)));
		const newColumns = generateColumns(renderedFrom, data, null, false, subcontractAssemblyData?.currency);
		let column: any = [
			{
				accessor: 'index',
				Header: 'Index',
				width: 70,
				sticky: 'left',
				Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
				Footer: () => {
					return <>Total</>;
				}
			},
			{
				accessor: 'detail',
				Header: 'Details',
				minWidth: 300,
				width: 300,
				disabled: true,
				sticky: isMobile || isTablet ? 'none' : 'left',
				Cell: ({ row }) => (
					row.original.detail ?
						<div className="flex items-center gap-2">
							{row.original.parentId && !row?.original?.loadingTicketId ?
								<p
									onClick={() => {
										setOpenMaterialDialog({ open: true, data: row?.original })
									}}
									className="link text-truncate"
									title={row.original.detail}
								>
									{row.original.detail}
								</p>
								:
								<p className="text-truncate"
									title={row.original.detail}>
									{row.original.detail}
								</p>
							}
							<IconButton
								size="small"
								onClick={() => {
									window.open(`${routes.productDetail.path}/${row.original.materialId}`);
								}}
							>
								<FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
							</IconButton>
						</div>
						: <NoDataCell />
				)
			},
			{
				accessor: 'description',
				Header: 'Description',
				width: 200,
				Cell: ({ row }) => {
					return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
				}
			},
		];
		column = [...column, ...newColumns];
		column.push({
			accessor: 'action',
			Header: 'Actions',
			minWidth: 100,
			width: 100,
			sticky: 'right',
			disableFilters: true,
			disableSortBy: true,
			canDrag: false,
			Cell: ({ row, table }) => {
				return (row?.original?.parentId &&
					<>
						<HtmlTooltip title={allowedToEdit ? 'Edit' : ownerAndColaborator}>
							<IconButton
								size="small"
								aria-label="Edit"
								disabled={!allowedToEdit || row?.original?.loadingTicketId}
								onClick={() => {
									setOpenMaterialDialog({ open: true, data: row?.original })
								}}
							>
								<EditIcon fontSize="small" color={!allowedToEdit || row?.original?.loadingTicketId ? 'disabled' : 'primary'} />
							</IconButton>
						</HtmlTooltip>
						<HtmlTooltip title={'Delete'}>
							<span>
								<IconButton
									size="small"
									aria-label="Delete"
									disabled={!allowedToEdit || !row?.original?.canDelete || row?.original?.loadingTicketId}
									onClick={() => {
										const obj: any = [{ id: row.original._id, materialId: row.original?.materialId }];
										setDeleteData(obj);
									}}
								>
									<DeleteIcon fontSize="small" color={!allowedToEdit || !row?.original?.canDelete || row?.original?.loadingTicketId ? 'disabled' : 'error'} />
								</IconButton>
							</span>
						</HtmlTooltip>
					</>
				);
			}
		});
		setColumns(column);
	};

	const fetchMaterial = async () => {
		setNextStep(false);
		dispatch({ type: 'loading', loading: true });
		dispatch({ type: 'selection', selectedRecords: [] });
		const result = await axiosInstance().get(
			`${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.subcontractAssembly}&referenceId=${subcontractAssemblyData._id}&ticketType=${DELIVERY_TICKET_TYPE.delivery}`
		);
		const deliveryTicketList = result?.data?.data;

		let data;
		const response = await axiosInstance().get(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material`);
		data = response?.data?.data?.material;
		let rows = data?.filter((d: any) => !d.parentId);
		rows.forEach((parent, i) => {
			parent.index = i + 1;
			parent.detail = parent.productDetail?.productName || '';
			parent.description = parent.productDetail?.productDescription || '';
			parent.canDelete = parent.canDelete ?? true;
			parent.subRows = generateNestedData(data, parent, deliveryTicketList);
		});

		if (rows?.length && rows?.every(r => r?.subRows?.length)) {
			setNextStep(true);
		}
		dispatch({ type: 'initialize', data: rows, count: rows?.length });
		dispatch({ type: 'loading', loading: false });
	};

	const generateNestedData = (material, parent, deliveryTicketList) => {
		const subRows: any = material.filter((e) => e.parentId === parent._id);
		subRows.forEach((_subRow, j) => {
			_subRow.index = parent.index + '.' + (j + 1);
			_subRow.detail = _subRow.productDetail?.productName || '';
			_subRow.description = _subRow.productDetail?.productDescription || '';
			_subRow.canDelete = _subRow.canDelete ?? true;
			_subRow.subRows = generateNestedData(material, _subRow, deliveryTicketList);
		});

		deliveryTicketList.map((obj) => {
			if (obj.ticketType === DELIVERY_TICKET_TYPE.delivery) {
				subRows?.map((d, index) => {
					if (obj?.products?.some((p) => p?.product === d?.materialId && p?.uniqueId === d?._id)) {
						subRows[index]['loadingTicketId'] = obj?._id;
					}
				});
			}
		});
		return subRows;
	};

	const ActionButtonMenuItms = () => {
		return (
			<>
				<HtmlTooltip title={''}>
					<MenuItem
						disabled={isSubmitting || !selectedRecords.some((ele) => !ele?.parentId) || selectedRecords?.some(r => r?.receivedQty > 0)}
						onClick={() => {
							setOpen({ open: true, type: MATERIAL_TYPE.product })
						}}
					>
						Add Consumables
					</MenuItem>
				</HtmlTooltip>
				<HtmlTooltip title={`Delete selected records`}>
					<MenuItem
						disabled={selectedRecords.some((e) => !e.canDelete || e.loadingTicketId || !e.parentId) || !allowedToEdit}
						onClick={() => {
							const dataToDelete: any = selectedRecords?.map(s => {
								return ({
									id: s._id,
									materialId: s?.materialId
								}
								)
							});
							setDeleteData(dataToDelete);
						}}
					>
						{`Delete (${selectedRecords?.length})`}
					</MenuItem>
				</HtmlTooltip>
			</>
		);
	};

	const addMaterial = async (rows) => {
		setIsSubmitting(true);
		const material: any = [];
		selectedRecords?.filter(s => !s?.parentId)?.forEach(r => {
			rows.forEach((d) => {
				const element: any = {};
				element.materialId = d._id;
				element.type = open.type;
				element.unit = d?.unitMain && d?.unitMain?.length ? d.unitMain[0] : d?.unit ? d?.unit : '';
				element.qty = d.qty ? parseFloat(d.qty) : 1;
				element.parentId = r?._id;
				material.push(element);
			});
		});

		await axiosInstance()
			.post(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material`, { material })
			.then(() => {
				fetchMaterial();
				setOpen({ open: false, type: '' });
				setIsSubmitting(false);
			})
			.catch((error) => {
				toastConfig.setToastConfig(error);
				setIsSubmitting(false);
			});
	};

	const handleDelete = async (rows) => {
		try {
			setDeleting(true);
			const material = rows?.map((ele) => ({ id: ele.id, materialId: ele.materialId }));
			if (material?.length) {
				await axiosInstance().put(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material/delete`, { ids: material });
			}
			setDeleting(false);
			fetchMaterial();
			setDeleteData(null);
		} catch (error) {
			setDeleting(false);
			toastConfig.setToastConfig(error);
			setDeleteData(null);
		}
	};

	const handleSaveData = async (rows: any) => {
		try {
			setIsSubmitting(true);
			await axiosInstance().put(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material`, { material: rows });
			fetchMaterial();
			setOpenMaterialDialog({ open: false, data: null });
			setIsSubmitting(false);
		} catch (error) {
			setIsSubmitting(false);
			toastConfig.setToastConfig(error);
		}
	};

	return (
		<>
			{allowedToEdit && (
				<>
					<DetailsPageHeader
						isAddButtonVisible={false}
						isActionButtonVisible={true}
						actionButtonMenuItems={<ActionButtonMenuItms />}
						actionButtonProps={{ disabled: !Boolean(selectedRecords?.length) }}
						hasXpadding
					/>
				</>
			)}
			{columns ? (
				<Box zIndex={5} >
					<CustomReactTable
						height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
						columns={columns}
						state={state}
						dispatch={dispatch}
						renderedFrom={renderedFrom}
						isClientSideGrid={true}
						refreshGrid={fetchMaterial}
						expander={true}
					/>
				</Box>
			) : (
				<Box p={2} height={500}>
					<CommonSkeleton lenArray={[...Array(10).keys()]} />
				</Box>
			)}
			{open.open && open.type === MATERIAL_TYPE.product && (
				<AssignProductDialog
					handleCloseDialog={() => setOpen({ open: false, type: '' })}
					onSuccess={(products) => {
						addMaterial(products);
					}}
					isSubmitting={isSubmitting}
				/>
			)}
			{deleteData?.length && (
				<ConfirmationDialog
					open={true}
					message={`Are you sure you want to delete the record(s)?`}
					onClose={() => setDeleteData(null)}
					onOk={() => handleDelete(deleteData)}
					okBtnLoading={isDeleting}
				/>
			)}
			{openMaterialDialog.open && (
				<MaterialDialog
					onClose={() => {
						setOpenMaterialDialog({ open: false, data: null })
					}}
					subcontractAssemblyData={subcontractAssemblyData}
					rowData={openMaterialDialog.data}
					material={dataRows}
					allFields={allFields}
					handleSaveData={handleSaveData}
					loading={isSubmitting}
				/>
			)}
		</>
	)
}

export default Assign;
