import { Box, Button, Dialog, TextField } from "@material-ui/core";
import _, { camelCase, uniqBy } from "lodash";
import { useContext, useEffect, useState } from "react";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomReactTable, { useTableReducer } from "src/components/CustomReactTable";
import CustomButton from "src/components/Helpers/CustomButton";
import NoDataCell from "src/components/Helpers/NoDataCell";
import routes from "src/components/Helpers/Routes";
import { ASSET_STATUS, CustomDialogTransition, rentalManagement } from "src/constants/helpers";
import AssetDetailsChangeDialog from "src/pages/RentalManagement/ReceivingTicket/AssetDetailsChangeDialog";

const TransferToAnotherProductDialog = ({ onClose, onSuccess, rentalManagementData, assets, assetPolicyData }) => {

	const toastConfig = useContext(CustomToastContext);
	const renderedFrom = `${camelCase(routes?.rentalManagement.title)}_TransferToAnotherPackage`;

	const { state, dispatch } = useTableReducer();
	const { selectedRecords } = state;
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [openAssetDataDialog, setOpenAssetDataDialog] = useState({ open: false, statusPolicy: null, _ids: null });

	useEffect(() => {
		fetchData()
	}, [])

	const column = [
		{
			accessor: 'productName',
			Header: 'Product',
			width: 200,
			disabled: true,
			Cell: ({ row }) => {
				return row.original['productName'] ? <p className="text-truncate">{row.original.productName}</p> : <NoDataCell />;
			}
		},
		{
			accessor: 'packageName',
			Header: 'Package',
			width: 200,
			disabled: true,
			Cell: ({ row }) => {
				return row.original['packageName'] ? <p className="text-truncate">{row.original.packageName}</p> : <NoDataCell />;
			}
		},
		{
			accessor: 'qty',
			Header: 'Qty',
			width: 200,
			disabled: true,
			Cell: ({ row }) => {
				return row.original['qty'] ? <p className="text-truncate">{row.original.qty}</p> : <NoDataCell />;
			}
		},
	]

	const fetchData = async () => {
		const data = assets?.map(e => ({ asset: e?._id, _id: e?.uniqueId }));
		dispatch({ type: 'loading', loading: true });
		axiosInstance().patch(`${rentalManagement.api}/productpackage/${rentalManagementData._id}/package-similar-product`, data).then(({ data: { data } }) => {
			dispatch({ type: 'initialize', data: data, count: data?.length });
			dispatch({ type: 'loading', loading: false });
		}).catch((error) => {
			toastConfig.setToastConfig(error);
		})
	}

	const handleAdd = (rows) => {
		setIsSubmitting(true)
		const tempAssets = [...assets]
		const data = [];
		selectedRecords?.forEach((ele) => {
			for (let i = 0; i < ele.qty; i++) {
				const asset = tempAssets?.find((e) => e.productId === ele.materialId && !e.isCount)
				if (asset) {
					const obj: any = { asset: asset?._id, fromId: asset.uniqueId, toId: ele._id }
					const matchedAsset = rows?.find((e) => e._id === asset?._id);
					if (matchedAsset) {
						const { _id, ...assetData } = matchedAsset;
						obj.assetData = assetData;
					}
					asset.isCount = true;
					data.push(obj)
				}
			}
		})
		axiosInstance().post(`${rentalManagement.api}/productpackage/${rentalManagementData._id}/move-asset-inter-package-product`, data).then(({ data }) => {
			toastConfig.setToastConfig({
				open: true,
				type: 'success',
				message: data.message
			});
			setIsSubmitting(false)
			onSuccess()
		}).catch((error) => {
			setIsSubmitting(false)
			toastConfig.setToastConfig(error);
		})
	}

	const addButtonDisabled = () => {
		if (assets?.length >= selectedRecords?.reduce((sum, cur) => sum + cur?.qty, 0)) {
			return false
		}
		return true
	}

	const checkAssetPolicy = (status) => {
		let result: any = null;
		const statusPolicy = assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === status);
		if (statusPolicy) {
			if (statusPolicy?.products && statusPolicy?.products?.length > 0) {
				const assetIds = assets?.filter(r => statusPolicy?.products?.includes(r?.productId))?.map(a => a?._id)
				if (assetIds && assetIds?.length > 0) {
					result = { statusPolicy: statusPolicy, assetIds: assetIds }
				}
			} else {
				result = { statusPolicy: statusPolicy, assetIds: assets?.map(a => a?._id) }
			}
		}
		return result;
	}

	return (
		<>
			<Dialog
				TransitionComponent={CustomDialogTransition}
				open={true}
				fullScreen={true}
				aria-labelledby="customized-dialog-title"
				fullWidth
				maxWidth={'md'}
				onClose={(e, reason) => {
					if (reason !== 'backdropClick') {
					}
				}}
			>
				<Box>
					<CustomDialogHeader
						onClose={onClose}
						title={"Transfer to another Package"}
						showManimizeMaximize={false}
						showRequiredLabel={false}
					/>
					<CustomDialogContent>
						<Box>
							<Box display={'flex'} justifyContent={'end'} alignItems={'center'}>
								<CustomButton
									loading={isSubmitting}
									disabled={isSubmitting || selectedRecords?.length === 0 || addButtonDisabled()}
									variant="contained"
									color="primary"
									type="submit"
									onClick={() => {
										const statusPolicy = checkAssetPolicy(ASSET_STATUS.reserved);
										if (statusPolicy) {
											setOpenAssetDataDialog({ open: true, statusPolicy: statusPolicy?.statusPolicy, _ids: statusPolicy?.assetIds });
										}
										else {
											handleAdd([])
										}
									}}
								>
									{`Add ${selectedRecords?.length ? `(${selectedRecords?.length})` : ''}`}
								</CustomButton>
							</Box>
							<Box>
								<CustomReactTable
									height={'calc(100vh - 210px)'}
									columns={column}
									state={state}
									dispatch={dispatch}
									refreshGrid={fetchData}
									renderedFrom={renderedFrom}
									isClientSideGrid={true}
								/>
							</Box>
						</Box>
					</CustomDialogContent>
				</Box>
			</Dialog>
			{openAssetDataDialog.open && (
				<AssetDetailsChangeDialog
					ids={openAssetDataDialog._ids}
					statusPolicy={openAssetDataDialog.statusPolicy}
					setAssetsData={() => { }}
					onClose={() => setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null })}
					onSuccess={(data) => {
						handleAdd(data)
						setOpenAssetDataDialog({ open: false, statusPolicy: null, _ids: null });
					}}
					staticLookUpFilters={{
						wellNumber: rentalManagementData?.wellNumber
							? rentalManagementData?.wellNumber?.optionValue || rentalManagementData?.wellNumber?.map((e) => e?.optionValue)
							: null,
					}}
					productsDefaultData={selectedRecords?.map(d => ({ materialId: d?.materialId, assetDefaultData: [{ wellNumber: d?.wellNumber, qty: d?.qty, package: d?.packageId }] }))}
				/>
			)}
		</>
	)
}

export default TransferToAnotherProductDialog;
