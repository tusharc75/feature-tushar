import { Box, Button, Dialog } from "@material-ui/core";
import _ from "lodash";
import { useContext, useEffect, useState } from "react";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomReactTable, { useTableReducer } from "src/components/CustomReactTable";
import NoDataCell from "src/components/Helpers/NoDataCell";
import { CustomDialogTransition, rentalManagement } from "src/constants/helpers";

const TransferToAnotherPackageDialog = ({ onClose, onSuccess, rentalManagementData, selectedAssets }) => {
	const toastConfig = useContext(CustomToastContext);

	const { state, dispatch } = useTableReducer();
	const { dataRows } = state;
	const [isAdding, setIsAdding] = useState(false)

	const column = [
		{
			accessor: 'productName',
			Header: 'Product',
			width: 200,
			Cell: ({ row }) => {
				return row.original['productName'] ? <p className="text-truncate">{row.original.productName}</p> : <NoDataCell />;
			}
		},
		{
			accessor: 'packageName',
			Header: 'Package',
			width: 200,
			Cell: ({ row }) => {
				return row.original['packageName'] ? <p className="text-truncate">{row.original.packageName}</p> : <NoDataCell />;
			}
		},
		{
			accessor: 'qty',
			Header: 'Qty',
			width: 200,
			Cell: ({ row }) => {
				return row.original['qty'] ? <p className="text-truncate">{row.original.qty}</p> : <NoDataCell />;
			}
		},
	]

	useEffect(() => {
		fetchData()
	}, [rentalManagementData, selectedAssets])

	const fetchData = async () => {
		dispatch({ type: 'loading', loading: true });
		axiosInstance()
			.patch(`${rentalManagement.api}/productpackage/${rentalManagementData._id}/package-similar-product`, selectedAssets?.map(r => ({ asset: r?._id, _id: r?.uniqueId })))
			.then(({ data: { data } }) => {
				const rows: any = []
				data?.forEach(d => {
					rows.push(...d?.products?.map(p => ({
						productName: p?.productName,
						packageName: d?.package?.packageName,
						packageUniqueId: d?.package?.uniqueId,
						uniqueId: p?.uniqueId,
						qty: p?.qty
					})))
				});
				dispatch({ type: 'initialize', data: rows, count: rows?.length });
				dispatch({ type: 'loading', loading: false });
			}).catch((error) => {
				toastConfig.setToastConfig(error);
			})
	}

	const handleAdd = () => {
		setIsAdding(true)
		axiosInstance()
			.post(
				`${rentalManagement.api}/productpackage/${rentalManagementData._id}/move-asset-inter-package-product`,
				dataRows?.map(_d => {
					const assets: any = [];
					for (let i = 0; i < _d.qty; i++) {
						if (selectedAssets[i]) {
							assets.push(selectedAssets[i]?._id)
						}
					}
					return ({
						assets: assets,
						fromId: selectedAssets[0]?.uniqueId,
						toId: _d?.uniqueId
					})
				})
			)
			.then((res) => {
				setIsAdding(false)
				onSuccess()
			}).catch((error) => {
				setIsAdding(false)
				toastConfig.setToastConfig(error);
			})
	}

	return (
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
					title={"Transfer Assets To Another Package"}
					showManimizeMaximize={false}
					showRequiredLabel={false}

				/>
				<CustomDialogContent>
					<Box>
						<Box display={'flex'} justifyContent={'end'} alignItems={'center'}>
							<Button
								variant="contained"
								color="primary"
								size="small"
								disabled={
									state?.loading ||
									isAdding ||
									selectedAssets?.reduce((sum, cur) => sum + cur?.qty, 0) != dataRows?.reduce((sum, cur) => sum + cur?.qty, 0)
								}
								onClick={() => {
									handleAdd()
								}}
							>
								Add
							</Button>
						</Box>
						<Box>
							<CustomReactTable
								height={'calc(100vh - 210px)'}
								columns={column}
								state={state}
								dispatch={dispatch}
								refreshGrid={fetchData}
								hideAction={true}
								renderedFrom={'ReceivingTicket_TransferAnotherPackage'}
								isClientSideGrid={true}
							/>
						</Box>
					</Box>
				</CustomDialogContent>
			</Box>
		</Dialog>
	)
}

export default TransferToAnotherPackageDialog;
