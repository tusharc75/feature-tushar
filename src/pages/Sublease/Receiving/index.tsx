import { Box, Button, IconButton, MenuItem } from "@material-ui/core";
import { map, startCase, uniq } from "lodash";
import { useContext, useEffect, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import { FiExternalLink } from "react-icons/fi";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "src/StateProvider/Provider";
import axiosInstance from "src/axios/axiosInstance";
import { fetch_child_resource_fields } from "src/components/ChildResourceField";
import CustomReactTable, { useColumns, useTableReducer } from "src/components/CustomReactTable";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import ImportExportMenu from "src/components/Helpers/ImportExportMenu";
import NoDataCell from "src/components/Helpers/NoDataCell";
import routes from "src/components/Helpers/Routes";
import CustomMessageDialog from "src/components/MessageDialog";
import { DetailsPageHeader } from "src/components/PageHeaders";
import { ASSET_STATUS, CHILD_RESOURCE, DELIVERY_FROM_TO_TYPE, DELIVERY_TICKET_REFERENCE_TYPE, DELIVERY_TICKET_STATUS, DELIVERY_TICKET_TYPE, INVENTORY_OWNER_TYPE, MATERIAL_TYPE, SUBLEASE_STATUS, SUBLEASE_TYPE, serializedAsset, sidebarResource, sublease, treeToFlatArray } from "src/constants/helpers";
import { subleaseMessage } from "src/constants/messageHelpers";
import ManageDeliveryTicket from "src/pages/DeliveryTicket/ManageDeliveryTicket";
import StartSubleaseDialog from "src/pages/Sublease/Receiving/StartSubleaseDialog";

const Receiving = ({ subleaseData, allowedToEdit, isIssued, setNextStep, setNextStepToolTip, renderedFrom, stepFullScreen, isProcessor }) => {
	const toastConfig = useContext(CustomToastContext);

	const { state, dispatch } = useTableReducer();
	const { dataRows, selectedRecords } = state;
	const { generateColumns } = useColumns();
	const [columns, setColumns] = useState(null);
	const {
		state: { user, permissions }
	}: any = useData();

	const [startSubleaseDialog, setStartSubleaseDialog] = useState(false);
	const [pdfColumns, setPdfColumns] = useState([]);
	const [openMessageDialog, setOpenMessageDialog] = useState({ open: false, errorMessages: [] });
	const [showTicketDialog, setShowTicketDialog] = useState({ open: false, data: {} });

	useEffect(() => {
		fetchFields();
		fetchAssetFields()
	}, []);

	const fetchAssetFields = () => {
		axiosInstance()
			.get(`/field?resource=${serializedAsset.resource}`)
			.then(({ data: { data } }) => {
				const newColumns = generateColumns(renderedFrom, data, routes.serializedAssetDetail.path);
				setPdfColumns(newColumns?.filter((e) => ['serialNumber', 'supplierSerialNumber']?.includes(e.field)))
			});
	}

	const fetchFields = async () => {
		var data = await fetch_child_resource_fields(CHILD_RESOURCE.subleaseProduct, subleaseData?.currency, allowedToEdit && !isIssued);
		const newColumns = generateColumns(
			renderedFrom,
			data?.map((e) => {
				return { ...e, fieldName: e.fieldName === 'qty' ? 'qtyDisplay' : e.fieldName };
			}),
			null,
			false,
			subleaseData?.currency
		);
		let coloum: any = [
			{
				accessor: 'index',
				Header: 'Index',
				width: 70,
				sticky: 'left',
				Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
			},
			{
				accessor: 'type',
				Header: 'Type',
				width: 200,
				sticky: isMobile || isTablet ? 'none' : 'left',
				Cell: ({ row }) => row.original['type'] ? <p className="text-truncate">{startCase(row.original.type)}</p> : <NoDataCell />
			},
			{
				accessor: 'detail',
				Header: 'Detail',
				minWidth: 300,
				width: 300,
				sticky: isMobile || isTablet ? 'none' : 'left',
				Cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<p> {row.original.detail}</p>
						<HtmlTooltip title="Details">
							<IconButton
								size="small"
								aria-label="Details"
								onClick={() => {
									if (row.original?.type === 'asset') {
										window.open(
											`${routes.serializedAssetDetail.path}/${row.original._id}`
										);
									} else {
										window.open(
											`${row.original.type === 'product' ? routes.productDetail.path : routes.packagesDetail.path}/${row.original.materialId}`
										);
									}
								}}
							>
								<FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
							</IconButton>
						</HtmlTooltip>
					</div>
				),
				Footer: () => {
					return <>Total</>;
				}
			},
			{
				accessor: 'description',
				Header: 'Description',
				width: 200,
				Cell: ({ row }) => {
					return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
				}
			}
		];
		coloum = [...coloum, ...newColumns];
		coloum.push({
			accessor: 'action',
			Header: 'Actions',
			minWidth: 100,
			width: 100,
			sticky: 'right',
			disableFilters: true,
			disableSortBy: true,
			Cell: ({ row }) => (
				<>

				</>
			)
		});
		setColumns(coloum);
	};

	useEffect(() => {
		fetchData()
	}, [subleaseData])

	const fetchData = async () => {
		dispatch({ type: 'loading', loading: true });
		dispatch({ type: 'selection', selectedRecords: [] });
		var data: any = [];
		var inventory: any = [];
		setNextStep(false)
		const response = await axiosInstance().get(`${sublease.api}/productpackage/${subleaseData._id}`);
		data = response?.data?.data;
		inventory = data.inventory;
		const assets = await axiosInstance().get(`${sublease.api}/asset/${subleaseData._id}`);
		const rows = data.material.filter((e) => e.parentId === null);
		rows.forEach((parent, i) => {
			parent.index = i + 1;
			parent.detail = parent.type === 'product' ? parent.productDetail?.productName : parent.packageDetail?.packageName;
			parent.description = parent.type === 'product' ? parent.productDetail?.productDescription : parent.packageDetail?.packageDescription;
			parent.qtyDisplay = parent.qty;
			parent.subRows = generateNestedRows(parent, [], assets?.data?.data)
			parent.assetQty = parent.assetQty;
			if (parent.type === 'package') {
				parent.subRows = generateNestedRows(parent, data.material, assets?.data?.data);
			}
		});
		let isComplate = true;
		assets?.data?.data?.map((u, i) => {
			if (
				u?.currentOwner?.optionValue !== subleaseData?.supplierAccount?.optionValue ||
				[ASSET_STATUS.reserved, ASSET_STATUS.inUse, ASSET_STATUS.repair].includes(u.status)
			) {
				isComplate = false;
			}
		});
		if (isComplate) {
			setNextStep(true);
			setNextStepToolTip(null);
		} else {
			setNextStep(false);
			setNextStepToolTip(subleaseMessage.subleaseProcessStep);
		}
		dispatch({ type: 'initialize', data: rows, count: rows?.length });
		dispatch({ type: 'loading', loading: false });
	}

	const generateNestedRows = (parent, material, assets) => {
		const subRow: any = []
		if (material?.length > 0) {
			const subRows: any = material.filter((e) => e.parentId === parent._id);
			subRows.forEach((_subRow, j) => {
				_subRow.index = parent.index + '.' + (j + 1);
				_subRow.detail = _subRow.productDetail?.productName;
				_subRow.description = _subRow.productDetail?.productDescription;
				_subRow.qtyDisplay = `${parent.qty * _subRow.qty}`;
				_subRow.subRows = generateNestedRows(_subRow, [], assets);
				_subRow.assetQty = _subRow.assetQty;
				subRow.push(_subRow)
			});
		}

		if (assets?.length > 0) {
			const asset = assets?.filter(a => a?.uniqueId === parent?._id && a?.productDetail?._id === parent?.materialId)
			asset.forEach((_asset, j) => {
				_asset.index = parent.index + '.' + (j + 1 + subRow?.length);
				_asset.type = 'asset';
				_asset.detail = _asset.assetNumber;
				subRow.push(_asset)
			});
		}
		return subRow;
	}

	const previewDownloadProps =
		columns && pdfColumns
			? {
				fileName: `${routes.sublease.title}-${subleaseData?.subleaseName}`,
				resource: sidebarResource.sublease,
				referenceId: subleaseData?._id,
				columns: [...columns?.filter(c => c?.accessor != 'action'), ...pdfColumns],
				defaultColumns: ['index', 'type', 'detail', 'description', 'qty']
			}
			: null;

	const LeftSideContents = () => {
		return (
			<>
				<Button
					variant={'contained'}
					color="primary"
					size="small"
					disabled={
						selectedRecords.length === 0
					}
					onClick={() => {
						setStartSubleaseDialog(true)
					}}
				>
					Receive
				</Button>
			</>
		);
	};

	const rightSideContents = () => {
		return (
			<>
				{allowedToEdit && (
					<ImportExportMenu
						permissions={permissions?.serializedAsset}
						module={routes.serializedAsset.title}
						api={`${serializedAsset.api}/custom-template`}
						afterImportCompleted={() => {
							fetchData();
						}}
						isExportAllOrSomeFeature={true}
						isDownloadExcel={false}
						recordsToExport={treeToFlatArray(selectedRecords, 'subRows').filter(f => f.type === 'asset')?.length ? treeToFlatArray(selectedRecords, 'subRows').filter(f => f.type === 'asset')?.length : treeToFlatArray(dataRows, 'subRows').filter(f => f.type === 'asset')?.length}
						ids={treeToFlatArray(selectedRecords, 'subRows').filter(f => f.type === 'asset')?.length ? treeToFlatArray(selectedRecords, 'subRows').filter(f => f.type === 'asset')?.map(d => d?._id) : treeToFlatArray(dataRows, 'subRows').filter(f => f.type === 'asset')?.map(d => d?._id)}
					/>
				)}
			</>
		);
	};

	const validateAction = () => {
		const errorMessages = [];
		treeToFlatArray(selectedRecords, 'subRows').filter(f => f.type === 'asset')?.forEach((e, i) => {
			if (e.currentOwnerType === INVENTORY_OWNER_TYPE.supplierAccount) {
				errorMessages.push({ index: e.index, message: subleaseMessage.assetsAlradyReturned });
			}
			else if (e.currentOwnerType === INVENTORY_OWNER_TYPE.customerAccount) {
				errorMessages.push({ index: e.index, message: subleaseMessage.assetsIsWithCustomer });
			}
			else if (![ASSET_STATUS.new, ASSET_STATUS.available, ASSET_STATUS.underReview]?.includes(e.status)) {
				errorMessages.push({ index: e.index, message: subleaseMessage.assetStatusSendSupplier });
			}
		});
		if (errorMessages?.length) {
			setOpenMessageDialog({ open: true, errorMessages: errorMessages });
			return true;
		}
		return false;
	};

	const checkUniqWarehouse = () => {
		const records = treeToFlatArray(selectedRecords, 'subRows').filter(f => f.type === 'asset');
		if (records.length === 0) {
			return false;
		} else if (uniq(map(records, 'warehouse.optionValue')).length === 1) {
			return true;
		} else {
			return false;
		}
	};

	const actionButtonMenuItems = () => {
		return (
			<>
				<MenuItem
					disabled={SUBLEASE_STATUS.completed != subleaseData?.status &&
						checkUniqWarehouse() && (allowedToEdit || isProcessor) ? false : true}
					onClick={() => {
						if (!validateAction()) {
							const records = treeToFlatArray(selectedRecords, 'subRows').filter(f => f.type === 'asset');
							const data = {};
							data['ticketName'] = subleaseData.subleaseName;
							data['referenceId'] = subleaseData._id;
							data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.plant;
							data['pickupFrom'] = records[0]?.warehouse?.optionValue;
							data['pickupFromAddress'] = records[0]?.currentLocation?.optionValue;
							data['deliveryToType'] = DELIVERY_FROM_TO_TYPE.supplier;
							data['deliveryTo'] = subleaseData?.supplierAccount?.optionValue;
							data['deliveryToAddress'] = subleaseData?.shippingAddress?.optionValue;
							data['isPickupFromDisable'] = true;
							data['isDeliveryToDisable'] = true;
							if (subleaseData?.wellName?.optionValue) {
								data['wellName'] = subleaseData?.wellName?.optionValue;
							}
							if (subleaseData?.wellNumber) {
								if (subleaseData?.wellNumber?.optionValue) {
									data['wellNumber'] = subleaseData?.wellNumber?.optionValue;
								} else {
									data['wellNumber'] = subleaseData?.wellNumber?.map((e) => e?.optionValue);
								}
							}
							if (subleaseData?.afeNumber) {
								data['afeNumber'] = subleaseData?.afeNumber;
							}
							if (subleaseData?.processor?.optionValue) {
								data['processor'] = subleaseData?.processor?.optionValue;
							}
							data['status'] = DELIVERY_TICKET_STATUS.delivered;
							setShowTicketDialog({ open: true, data: data });
						}
					}}
				>
					Send to Supplier
				</MenuItem>
			</>
		);
	};

	return (
		<>
			<DetailsPageHeader
				isAddButtonVisible={false}
				isActionButtonVisible={true}
				actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
				actionButtonMenuItems={actionButtonMenuItems()}
				previewDownloadProps={previewDownloadProps}
				rightSideContents={rightSideContents()}
				leftSideContents={LeftSideContents()}
				hasXpadding
			/>
			{columns ? (
				<Box zIndex={5} width={'100%'}>
					<CustomReactTable
						height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
						columns={columns}
						state={state}
						dispatch={dispatch}
						refreshGrid={fetchData}
						hideSelection={!allowedToEdit}
						hideAction={!allowedToEdit}
						renderedFrom={renderedFrom}
						isClientSideGrid={true}
						expander={true}
					/>
				</Box>
			) : (
				<Box p={2} height={500}>
					<CommonSkeleton lenArray={[...Array(10).keys()]} />
				</Box>
			)}

			{startSubleaseDialog && (
				<StartSubleaseDialog
					onClose={() => {
						setStartSubleaseDialog(false)
					}}
					material={treeToFlatArray(selectedRecords, 'subRows').filter(f => f.type === MATERIAL_TYPE.product)?.map(d => ({ uniqueId: d?._id, materialId: d?.materialId, type: d?.type, qty: d?.qty, assetQty: d?.assetQty, serializedProduct: d?.productDetail?.serializedProduct, detail: d?.productDetail?.productName }))}
					subleaseId={subleaseData?._id}
					onSuccess={() => {
						fetchData()
						setStartSubleaseDialog(false)
					}}
				/>
			)}

			{showTicketDialog.open && (
				<ManageDeliveryTicket
					ticketType={DELIVERY_TICKET_TYPE.delivery}
					referenceType={DELIVERY_TICKET_REFERENCE_TYPE.sublease}
					referenceData={showTicketDialog.data}
					assets={selectedRecords}
					onClose={() => setShowTicketDialog({ open: false, data: {} })}
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
	)
}

export default Receiving;
