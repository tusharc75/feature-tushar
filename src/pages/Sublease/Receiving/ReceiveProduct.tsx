import { Box, Button, Dialog, Grid, TextField } from "@material-ui/core";
import { FieldArray, Form, Formik } from "formik";
import { useContext, useState } from "react";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { sublease } from "src/constants/helpers";
import AssetDialog from "src/pages/Sublease/Receiving/AssetDialog";

const ReceiveProduct = ({ onClose, material, subleaseId, onSuccess }) => {

	const toastConfig = useContext(CustomToastContext);

	const [assetNumberDialog, setAssetNumberDialog] = useState({ open: false, material: [] });
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = (values) => {
		const data: any = [];
		values?.material?.forEach((element) => {
			if (parseInt(element?.qty)) {
				data.push({
					_id: element._id,
					product: element.materialId,
					productName: element.productName,
					qty: parseInt(element?.qty),
				});
			}
		});
		if (data?.length) {
			setAssetNumberDialog({ open: true, material: data });
		} else {
			onSuccess();
		}
	}

	const handleReceive = (material) => {
		setIsSubmitting(true);
		axiosInstance().put(`${sublease.api}/${subleaseId}/receive-sublease`, material?.map(m => ({
			_id: m?._id,
			product: m?.product,
			assetNumber: m?.assetNumber,
			assetNumberType: m?.assetNumberType
		}))).then(({ data }) => {
			setIsSubmitting(false);
			toastConfig.setToastConfig({
				open: true,
				type: 'success',
				message: data.message
			});
			setAssetNumberDialog({ open: false, material: [] });
			onSuccess();
		}).catch((error) => {
			toastConfig.setToastConfig(error);
			setIsSubmitting(false);
		});
	}

	const validate = (values) => {
		let errors: any = {};
		if (values.length > 0) {
			values.map((d) => {
				let tempProduct = material.find((u) => u.uniqueId === d._id);
				const qty = tempProduct?.qty - tempProduct?.assetQty
				if (!d.qty) {
					errors.qty = 'Please enter valid quantity';
				}
				else if (tempProduct && d.qty > qty) {
					errors.qty = 'Receiving quantity is more than actual quantity';
				}
			});
		}
		return errors;
	};

	return (
		<>
			<Dialog
				open
				fullScreen={true}
				maxWidth="md"
				fullWidth
				onClose={(e, reason) => {
					if (reason !== 'backdropClick') {
						onClose();
					}
				}}
			>
				<CustomDialogHeader title={'Receiving'} onClose={onClose} 		>
				</CustomDialogHeader>
				<Formik
					initialValues={{
						material: material.map((d) => ({
							_id: d.uniqueId,
							materialId: d.materialId,
							productName: d.productName,
							qty: d.qty - d?.assetQty,
						}))
					}}
					enableReinitialize={true}
					onSubmit={() => { }}
				>
					{({ values }) => (
						<>
							<CustomDialogContent>
								{values.material && values.material.length ? (
									<Box p={2}>
										<Form>
											<FieldArray
												name="material"
												render={(arrayHelpers) => (
													<div className="grid gap-[15px] sm:gap-[18px]">
														{values.material.map((data, index) => (
															<div
																style={{ border: '1.5px solid var(--common-border-color)', display: 'flex' }}
																className="rounded-[6px] pt-[17px] px-[23px] pb-[21px] grid sm:grid-cols-[24px,1fr] md:gap-[29px] gap-[15px] shadow-[0px_4px_26.8799991607666px_0px_rgba(0,0,0,0.06)]"
																key={index}
															>
																<Grid container spacing={2} direction="row">
																	<Grid item lg={4} md={4}>
																		<Box display={'flex'} justifyContent={'start'} alignItems={'center'}>
																			<div className="bg-[var(--new\_theme\_color)] w-[24px] h-[24px] rounded-[6px] flex items-center justify-center">
																				<p className="text-white text-[13px] font-[700] leading-none">{index + 1}</p>
																			</div>
																			<div className="pl-10">
																				{data?.productName}
																			</div>
																		</Box>
																	</Grid>
																	<Grid item lg={4} md={4}>
																		<TextField
																			fullWidth
																			label="Quantity"
																			variant="outlined"
																			type="number"
																			size="small"
																			onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
																			name="qty"
																			required
																			placeholder="Asset Quantity"
																			value={data.qty}
																			onChange={(e) => {
																				const value = e.target.value.replace(/[^0-9]/g, '');
																				arrayHelpers.replace(index, {
																					...values.material[index],
																					['qty']: value
																				});
																			}}
																			error={validate([data])?.qty}
																			helperText={validate([data]).qty ? validate([data]).qty : ''}
																		/>
																	</Grid>
																</Grid>
															</div>
														))}
													</div>
												)}
											/>
										</Form>
									</Box>
								) : (
									<Box p={2} height={300}>
										<CommonSkeleton lenArray={[...Array(6).keys()]} />
									</Box>
								)}
							</CustomDialogContent>
							<CustomDialogFooter>
								<Button variant="outlined" size="small" color="primary" onClick={onClose}>
									Cancel
								</Button>
								<Button
									onClick={() => {
										if (!validate(values.material).qty) {
											handleSubmit(values);
										}
									}}
									size="small"
									variant="contained"
									color="primary"
								>
									Save
								</Button>
							</CustomDialogFooter>
						</>
					)}
				</Formik>
			</Dialog>
			{assetNumberDialog.open && (
				<AssetDialog
					handleClose={() => setAssetNumberDialog({ open: false, material: [] })}
					products={assetNumberDialog.material}
					handleSuccess={(rows) => {
						handleReceive(rows);
					}}
					loading={isSubmitting}
					subleaseId={subleaseId}
				/>
			)}
		</>
	)
}

export default ReceiveProduct;
