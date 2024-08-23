import { Box, Button, Dialog, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { useContext, useEffect, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomButton from "src/components/Helpers/CustomButton";
import { ASSET_STATUS, CustomDialogTransition, MATERIAL_TYPE, rentalManagement } from "src/constants/helpers";
import AssetDetailsChangeDialog from "src/pages/RentalManagement/ReceivingTicket/AssetDetailsChangeDialog";

const TransferToAnotherPackageDialog = ({ onClose, onSuccess, rentalManagementData, assets, material, assetPolicyData }) => {

	const toastConfig = useContext(CustomToastContext);
	const [packageOptions, setPackageOptions] = useState([]);
	const [selectedPackage, setSelectedPackage] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [openAssetDataDialog, setOpenAssetDataDialog] = useState({ open: false, statusPolicy: null });

	useEffect(() => {
		fetchData()
	}, [])

	const fetchData = async () => {
		const data = material?.filter((e) => e.type === MATERIAL_TYPE.package)?.map((e) => {
			return {
				optionLabel: e?.packageDetail?.packageName,
				optionValue: e?._id,
			}
		})
		setPackageOptions(data);
	}

	const handleSubmit = (assetData: any) => {
		setIsSubmitting(true);
		const data = []
		assets?.forEach((ele) => {
			const obj: any = {}
			obj.asset = ele?._id
			obj.uniqueId = ele?.uniqueId
			obj.productId = ele?.productId
			const matchedAsset = assetData?.find((e) => e._id === ele?._id);
			if (matchedAsset) {
				const { _id, ...assetData } = matchedAsset;
				obj.assetData = assetData;
			}
			data.push(obj);
		})
		axiosInstance().post(`${rentalManagement.api}/productpackage/${rentalManagementData._id}/move-asset-inter-package`,
			{ assets: data, uniqueId: selectedPackage.optionValue }).then(({ data }) => {
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

	return (
		<>
			<Dialog
				maxWidth="sm"
				fullScreen={isMobile || isTablet}
				TransitionComponent={CustomDialogTransition}
				aria-labelledby="customized-dialog-title"
				open={true}
				fullWidth
				onClose={(e, reason) => {
					if (reason !== 'backdropClick') {
						onClose();
					}
				}}
			>
				<CustomDialogHeader onClose={onClose} title={`Transfer to Another Package`} showRequiredLabel={false} showManimizeMaximize={false} />
				<CustomDialogContent>
					<Box m={1}>
						<Autocomplete
							size="small"
							options={packageOptions}
							value={selectedPackage}
							onChange={(_, val) => {
								setSelectedPackage(val);
							}}
							getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
							getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
							renderInput={(props) => <TextField
								{...props}
								placeholder={''}
								variant="outlined"
								name="packages"
								required={true}
								label={'Select Package'} />
							}
						/>
					</Box>
				</CustomDialogContent>
				<CustomDialogFooter>
					<Button variant="outlined" color="primary" size="small" onClick={onClose} >
						Cancel
					</Button>
					<CustomButton
						loading={isSubmitting}
						variant="contained"
						color="primary"
						disabled={!selectedPackage || isSubmitting}
						onClick={(e) => {
							const statusPolicy = assetPolicyData?.policy?.statusChangeFields?.find((ele) => ele.status === ASSET_STATUS.reserved);
							if (statusPolicy) {
								setOpenAssetDataDialog({ open: true, statusPolicy: statusPolicy });
							}
							else {
								handleSubmit([])
							}
						}}
					>
						Save
					</CustomButton>
				</CustomDialogFooter>
			</Dialog>
			{openAssetDataDialog.open && (
				<AssetDetailsChangeDialog
					ids={assets?.map((e) => e._id)}
					statusPolicy={openAssetDataDialog.statusPolicy}
					setAssetsData={() => { }}
					onClose={() => setOpenAssetDataDialog({ open: false, statusPolicy: null })}
					onSuccess={(data) => {
						handleSubmit(data)
						setOpenAssetDataDialog({ open: false, statusPolicy: null });
					}}
					staticLookUpFilters={{
						wellNumber: rentalManagementData?.wellNumber
							? rentalManagementData?.wellNumber?.optionValue || rentalManagementData?.wellNumber?.map((e) => e?.optionValue)
							: null,
					}}
				/>
			)}</>
	)
}

export default TransferToAnotherPackageDialog;
