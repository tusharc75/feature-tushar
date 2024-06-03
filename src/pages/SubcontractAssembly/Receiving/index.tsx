import { Box, IconButton } from "@material-ui/core";
import { History, OpenInNew, AddCircleOutline } from "@material-ui/icons";
import { camelCase } from "lodash";
import { useContext, useEffect, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";
import { fetch_child_resource_fields } from "src/components/ChildResourceField";
import CustomReactTable, { useColumns, useTableReducer } from "src/components/CustomReactTable";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import NoDataCell from "src/components/Helpers/NoDataCell";
import routes from "src/components/Helpers/Routes";
import { CHILD_RESOURCE } from "src/constants/helpers";
import ReceivingCostDialog from "src/pages/SubcontractAssembly/Receiving/ReceivingCostDialog";

const Receiving = ({ subcontractAssemblyData, stepFullScreen }) => {
	const renderedFrom = `${camelCase(routes?.subcontractAssembly.title)}_Receaving`;
	const toastConfig = useContext(CustomToastContext);

	const { state, dispatch } = useTableReducer();
	const { generateColumns } = useColumns();

	const [columns, setColumns] = useState(null);
	const [costDialog, setCostDialog] = useState({ open: false, _id: null })
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		fetchFields();
		fetchData()
	}, [subcontractAssemblyData]);

	const fetchFields = async () => {
		var data = await fetch_child_resource_fields(CHILD_RESOURCE.subcontractAssemblyMaterial, subcontractAssemblyData?.currency, true);
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
				Cell: ({ row, table }) => (
					<div style={{ display: 'flex', alignItems: 'center' }}>
						{row.original.detail ? (
							<p
								className="text-truncate"
								title={row.original.detail}
							>
								{row.original.detail}
							</p>
						) : (
							<NoDataCell />
						)}

						<Box ml={1} className=" flex-shrink-0">
							<IconButton
								size="small"
								onClick={() => {
									window.open(`${routes.productDetail.path}/${row.original.materialId}`);
								}}
							>
								<OpenInNew fontSize="small" color="primary" />
							</IconButton>
						</Box>
					</div >
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
			Cell: ({ row }) => {
				return (
					<>
						{row?.original?.status != 'Received' && (
							<HtmlTooltip title={'Receive'}>
								<IconButton
									size="small"
									aria-label="Edit"
									onClick={() => {
										setCostDialog({ open: true, _id: row?.original?._id })
									}}
								>
									<AddCircleOutline fontSize="small" color={'primary'} />
								</IconButton>
							</HtmlTooltip>
						)}
						{row?.original?.status === 'Received' && (
							<HtmlTooltip title={'View History'}>
								<span>
									<IconButton
										size="small"
										aria-label="history"
										onClick={() => {
										}}
									>
										<History fontSize="small" color={'primary'} />
									</IconButton>
								</span>
							</HtmlTooltip>
						)}
					</>
				);
			}
		});
		setColumns(column);
	};

	const fetchData = async () => {
		dispatch({ type: 'loading', loading: true });
		dispatch({ type: 'selection', selectedRecords: [] });
		let data;
		const response = await axiosInstance().get(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material`);
		data = response?.data?.data?.material;
		let rows = data?.filter((d: any) => !d.parentId);
		rows.forEach((parent, i) => {
			parent.index = i + 1;
			parent.detail = parent.productDetail?.productName || '';
			parent.description = parent.productDetail?.productDescription || '';
			parent.canDelete = parent.canDelete ?? true;
		});
		dispatch({ type: 'initialize', data: rows, count: rows?.length });
		dispatch({ type: 'loading', loading: false });
	};

	const handleUpdateStatus = (value) => {
		setIsSubmitting(true)
		axiosInstance().put(`${routes.subcontractAssembly.path}/${subcontractAssemblyData?._id}/material/status`, { ...value, _id: costDialog?._id })
			.then((res) => {
				fetchData()
				setIsSubmitting(false)
				setCostDialog({ open: false, _id: null })
			}).catch((error) => {
				toastConfig.setToastConfig(error);
				setIsSubmitting(false)
			})
	}

	return (
		<>

			{columns ? (
				<Box zIndex={5} width={'100%'}>
					<CustomReactTable
						height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
						columns={columns}
						state={state}
						dispatch={dispatch}
						renderedFrom={renderedFrom}
						isClientSideGrid={true}
						refreshGrid={fetchData}
						hideSelection={true}
					/>
				</Box>
			) : (
				<Box p={2} height={500}>
					<CommonSkeleton lenArray={[...Array(10).keys()]} />
				</Box>
			)}

			{costDialog.open && (
				<ReceivingCostDialog
					onClose={() => {
						setCostDialog({ open: false, _id: null })
					}}
					onSuccess={(val) => {
						handleUpdateStatus(val)
					}}
					subcontractAssemblyData={subcontractAssemblyData}
					isSubmitting={isSubmitting}
				/>
			)}
		</>
	)
}

export default Receiving;
