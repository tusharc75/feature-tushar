import { Box, IconButton, MenuItem } from "@material-ui/core";
import { OpenInNew } from "@material-ui/icons";
import { map, uniq } from "lodash";
import { useContext, useEffect, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";
import { fetch_child_resource_fields } from "src/components/ChildResourceField";
import CustomReactTable, { useColumns, useTableReducer } from "src/components/CustomReactTable";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import NoDataCell from "src/components/Helpers/NoDataCell";
import routes from "src/components/Helpers/Routes";
import CustomMessageDialog from "src/components/MessageDialog";
import { DetailsPageHeader } from "src/components/PageHeaders";
import { CHILD_RESOURCE, DELIVERY_FROM_TO_TYPE, DELIVERY_TICKET_REFERENCE_TYPE, DELIVERY_TICKET_STATUS, DELIVERY_TICKET_TYPE, MATERIAL_TYPE, deliveryTicket } from "src/constants/helpers";
import { subcontractAssemblyActions, subcontractAssemblyMessage } from "src/constants/messageHelpers";
import ManageDeliveryTicket from "src/pages/DeliveryTicket/ManageDeliveryTicket";

const LoadingTicket = ({ subcontractAssemblyData, setNextStep, stepFullScreen }) => {
	const renderedFrom = `${routes.subcontractAssembly.title}_LoadingTicket`;
	const toastConfig = useContext(CustomToastContext);

	const [columns, setColumns] = useState(null);
	const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });
	const [openMessageDialog, setOpenMessageDialog] = useState({ open: false, errorMessages: [] });

	const { state, dispatch } = useTableReducer();
	const { selectedRecords } = state;
	const { generateColumns } = useColumns();

	useEffect(() => {
		fetchFields();
		fetchData()
	}, [subcontractAssemblyData]);

	const fetchFields = async () => {
		var data = await fetch_child_resource_fields(CHILD_RESOURCE.subcontractAssemblyMaterial, subcontractAssemblyData?.currency, true);
		const newColumns = generateColumns(renderedFrom, data, null, false, subcontractAssemblyData?.currency);
		let coloum: any = [
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
				Header: 'Detail',
				disabled: true,
				sticky: isMobile || isTablet ? 'none' : 'left',
				width: 200,
				Cell: ({ row }) => (
					<div style={{ display: 'flex', alignItems: 'center' }}>
						{<p title={row.original?.detail}>{row.original?.detail}</p>}
						<Box ml={1}>
							<IconButton
								size="small"
								onClick={() => {
									window.open(`${routes.productDetail.path}/${row.original.materialId}`);
								}}
							>
								<OpenInNew fontSize="small" color="primary" />
							</IconButton>
						</Box>
					</div>
				)
			},
			{
				accessor: 'description',
				Header: 'Description',
				width: 200,
				Cell: ({ row }) => {
					return row.original['description'] ? <div><p className="text-truncate">{row.original.description}</p></div> : <NoDataCell />;
				}
			},
			{
				accessor: 'parent',
				Header: 'Parent',
				width: 200,
				Cell: ({ row }) => {
					return row.original['parent'] ? <div><p className="text-truncate">{row.original.parent}</p></div> : <NoDataCell />;
				}
			},
			{
				accessor: 'loadingTicket',
				Header: 'Loading Ticket',
				Cell: ({ row }) =>
					row?.original?.loadingTicket ? (
						<div>
							<h5 className="text-truncate">{row?.original?.loadingTicket}</h5>
							<Box ml={1}>
								<IconButton
									size="small"
									onClick={() => {
										window.open(`${routes.deliveryTicketDetail.path}/${row?.original?.loadingTicketId}`);
									}}
								>
									<OpenInNew fontSize="small" color="primary" />
								</IconButton>
							</Box>
						</div>
					) : (
						<NoDataCell />
					)
			},
			{
				accessor: 'loadingTicketStatus',
				Header: 'Status',
				Cell: ({ row }) =>
					row?.original?.loadingTicketStatus ? (
						<h5 className="text-truncate">{row?.original?.loadingTicketStatus}</h5>
					) : (
						<NoDataCell />
					)
			}
		];
		coloum = [...coloum, ...newColumns];
		setColumns(coloum);
	};

	const fetchData = async () => {

		dispatch({ type: 'loading', loading: true });
		dispatch({ type: 'selection', selectedRecords: [] });

		setNextStep(false);

		const result = await axiosInstance().get(
			`${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.subcontractAssembly}&referenceId=${subcontractAssemblyData._id}&ticketType=${DELIVERY_TICKET_TYPE.delivery}`
		);
		const deliveryTicketList = result?.data?.data;

		var material: any = [];
		const response = await axiosInstance().get(`${routes.subcontractAssembly.path}/${subcontractAssemblyData._id}/material`);
		material = response?.data?.data?.material;

		const rows = material.filter((e) => e.parentId != null && MATERIAL_TYPE.product);
		rows.forEach((obj, i) => {
			obj.index = i + 1;
			obj.detail = obj.productDetail?.productName;
			obj.description = obj?.productDetail?.productDescription;
			obj.qty = obj.qty;
			obj.uniqueId = obj._id;
			obj.parent = material?.find(m => m?.parentId === null && m?._id === obj?.parentId)?.productDetail?.productName || '';
			obj.parentId = null
		});

		deliveryTicketList.map((obj) => {
			if (obj.ticketType === DELIVERY_TICKET_TYPE.delivery) {
				rows.map((d, index) => {
					if (obj?.products?.some((p) => p?.product === d?.materialId && p?.uniqueId === d?.uniqueId)) {
						rows[index]['loadingTicket'] = obj?.ticketName;
						rows[index]['loadingTicketId'] = obj?._id;
						rows[index]['loadingTicketStatus'] = obj?.status;
					}
				});
			}
		});

		if (rows.some((e) => e.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered)) {
			setNextStep(true);
		}

		dispatch({ type: 'initialize', data: rows, count: rows?.length });
		dispatch({ type: 'loading', loading: false });
	};

	const validateAction = (action) => {
		const errorMessages = [];
		var records = [...selectedRecords];
		records?.forEach((e) => {
			if (action === subcontractAssemblyActions.createLoadingTicket) {
				if (e.hasOwnProperty('loadingTicketId')) {
					errorMessages.push({ index: e.index, message: subcontractAssemblyMessage.loadingAlreadyCreated });
				}
			} else if (action === subcontractAssemblyActions.deliveredLoadingTicket) {
				if (!e.hasOwnProperty('loadingTicketId')) {
					errorMessages.push({ index: e.index, message: subcontractAssemblyMessage.loadingNotCreated });
				} else if (e?.loadingTicketStatus === DELIVERY_TICKET_STATUS.delivered) {
					errorMessages.push({ index: e.index, message: subcontractAssemblyMessage.loadingAlreadyDelivered });
				}
			}
		});
		if (errorMessages?.length) {
			setOpenMessageDialog({ open: true, errorMessages: errorMessages });
			return true;
		}
		return false;
	};

	const handleDeliveryTicketDialog = () => {
		if (selectedRecords.length) {
			const data = {};
			data['ticketName'] = subcontractAssemblyData.subcontractAssemblyNumber;
			data['referenceId'] = subcontractAssemblyData._id;

			data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
			data['pickupFrom'] = subcontractAssemblyData?.warehouse?.optionValue;

			data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.supplier;
			data['deliveryTo'] = subcontractAssemblyData?.supplierAccount?.optionValue;
			data['deliveryToAddress'] = subcontractAssemblyData.shippingAddress?.optionValue;

			data['isPickupFromDisable'] = true;
			data['isDeliveryToDisable'] = true;

			setShowTicketDialog({ open: true, data: data });
		}
	};

	const handelDeliverTickets = () => {
		let data = {};
		const loadingTicketIds = uniq(map(selectedRecords, 'loadingTicketId'));
		if (loadingTicketIds.length) {
			data['_ids'] = loadingTicketIds?.map((e) => e);
			data['status'] = DELIVERY_TICKET_STATUS.delivered;
			data['signatures'] = [];
			data['warehouse'] = subcontractAssemblyData?.warehouse?.optionValue;
			data['receiveDate'] = new Date();
			axiosInstance()
				.post(`${deliveryTicket.api}/updatebulk`, data)
				.then(({ data: { data } }) => {
					toastConfig.setToastConfig({
						open: true,
						type: 'success',
						message: `Delivered Successfully`
					});
					fetchData();
				})
				.catch((error) => {
					toastConfig.setToastConfig(error);
				});
		}
	};

	const actionButtonMenuItems = () => {
		return (
			<>
				<MenuItem
					onClick={() => {
						if (!validateAction(subcontractAssemblyActions.createLoadingTicket)) {
							handleDeliveryTicketDialog()
						}
					}}
					disabled={selectedRecords.length === 0}
				>
					Create Loading Ticket
				</MenuItem>
				<MenuItem
					onClick={() => {
						if (!validateAction(subcontractAssemblyActions.deliveredLoadingTicket)) {
							handelDeliverTickets()
						}
					}}
					disabled={selectedRecords.length === 0}
				>
					Delivered Loading Ticket
				</MenuItem>
			</>
		);
	};

	return (
		<>
			<>
				<DetailsPageHeader
					isAddButtonVisible={false}
					isActionButtonVisible={true}
					actionButtonMenuItems={actionButtonMenuItems()}
					actionButtonProps={{ disabled: selectedRecords.length === 0 }}
					hasXpadding
				/>
				{columns ? (
					<Box zIndex={5}>
						<CustomReactTable
							height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
							columns={columns}
							state={state}
							dispatch={dispatch}
							renderedFrom={renderedFrom}
							isClientSideGrid={true}
							refreshGrid={fetchData}
						/>
					</Box>
				) : (
					<Box p={2} height={500}>
						<CommonSkeleton lenArray={[...Array(10).keys()]} />
					</Box>
				)}
				{showTicketDialog.open && (
					<ManageDeliveryTicket
						ticketType={DELIVERY_TICKET_TYPE.delivery}
						referenceType={DELIVERY_TICKET_REFERENCE_TYPE.subcontractAssembly}
						referenceData={showTicketDialog.data}
						onClose={() => setShowTicketDialog({ open: false, data: {} })}
						products={selectedRecords?.map((e) => { return { ...e, _id: e.materialId } })}
						onSuccess={() => {
							setShowTicketDialog({ open: false, data: {} });
							fetchData();
						}}
					/>
				)}
				{openMessageDialog.open && (
					<CustomMessageDialog
						open={openMessageDialog.open}
						errorMessages={openMessageDialog.errorMessages}
						onClose={() => {
							setOpenMessageDialog({ open: false, errorMessages: [] });
						}}
					/>
				)}
			</>
		</>
	)
}

export default LoadingTicket;
