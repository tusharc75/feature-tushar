import { Box, Button, Dialog, TextField } from "@material-ui/core";
import { FieldArray, Form, Formik } from "formik";
import { isEqual, startCase } from "lodash";
import { useContext, useState } from "react";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { MATERIAL_TYPE, sublease } from "src/constants/helpers";
import AssetDialog from "src/pages/Sublease/Receiving/AssetDialog";

const StartSubleaseDialog = ({ onClose, material, subleaseId, onSuccess }) => {

	const toastConfig = useContext(CustomToastContext);

	const [assetNumberDialog, setAssetNumberDialog] = useState({ open: false, material: [] });
	const [isSubmitting, setIsSubmitting] = useState(false)

	const validate = (values) => {
		let errors: any = {};
		if (values.length > 0) {
			values.map((d) => {
				let tempProduct = material.find((u) => u.uniqueId === d._id);

				if (tempProduct && d.assetQuantity > tempProduct?.qty) {
					errors.assetQuantity = 'should be greater';
				}
			});
		}
		return errors;
	};

	const handleSubmit = (values) => {
		const data: any = [];
		values?.material?.forEach((element) => {
			if (parseInt(element?.assetQuantity)) {
				data.push({
					_id: element._id,
					type: element.type,
					materialId: element.materialId,
					serializedProduct: element.serializedProduct,
					assetQuantity: parseInt(element?.assetQuantity),
				});
			}
		});
		if (data?.length) {
			if (data?.find((e) => e?.assetQuantity)) {
				setAssetNumberDialog({ open: true, material: data });
			} else {
				handleReceive(data);
			}
		} else {
			onSuccess();
		}
	}

	const handleReceive = (material) => {
		setIsSubmitting(true);
		axiosInstance()
			.put(`${sublease.api}/${subleaseId}/receive-sublease`, material?.map(m => ({ _id: m?.id, product: m?.product, assetNumber: m?.assetNumber, assetNumberType: m?.assetNumberType })))
			.then(({ data }) => {
				setIsSubmitting(false);
				toastConfig.setToastConfig({
					open: true,
					type: 'success',
					message: data.message
				});
				setAssetNumberDialog({ open: false, material: [] });
				onSuccess();
			})
			.catch((error) => {
				toastConfig.setToastConfig(error);
				setIsSubmitting(false);
			});
	}

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
				<>
					<CustomDialogHeader
						title={'Start Sublease'}
						onClose={onClose}
						isMinimized={false}
						showManimizeMaximize={true}
					>
					</CustomDialogHeader>
					<Formik
						initialValues={{
							material: material.map((d) => ({
								_id: d.uniqueId,
								type: d.type,
								materialId: d.materialId,
								detail: d.detail,
								assetQuantity: d.serializedProduct ? (d.qty - d?.assetQty) : 0,
								serializedProduct: d.serializedProduct,
							}))
						}}
						enableReinitialize={true}
						onSubmit={() => { }}
					>
						{({ values, setFieldValue, errors }) => (
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
																	style={{ border: '1.5px solid var(--common-border-color)' }}
																	className="rounded-[6px] pt-[17px] px-[23px] pb-[21px] grid sm:grid-cols-[24px,1fr] md:gap-[29px] gap-[15px] shadow-[0px_4px_26.8799991607666px_0px_rgba(0,0,0,0.06)]"
																	key={index}
																>
																	<div className="bg-[var(--new\_theme\_color)] w-[24px] h-[24px] rounded-[6px] flex items-center justify-center">
																		<p className="text-white text-[13px] font-[700] leading-none">{index + 1}</p>
																	</div>
																	<div>
																		<div
																			style={{ borderBottom: '1px solid var(--common-border-color)' }}
																			className="flex flex-wrap border-b  border-b-[var(--common-border-color)] gap-[20px] md:gap-[61px] pb-[9px]"
																		>
																			<span>
																				<span className="text-[var(--primary-text)] font-semibold">{startCase(data?.type)}: </span>
																				{data?.detail}
																			</span>
																		</div>
																		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px] md:gap-[25px] mt-[28px]">
																			{data?.serializedProduct && (
																				<TextField
																					fullWidth
																					label="Asset Quantity"
																					variant="outlined"
																					type="number"
																					size="small"
																					onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
																					name="assetQuantity"
																					placeholder="Asset Quantity"
																					value={data.assetQuantity}
																					onChange={(e) => {
																						const value = e.target.value.replace(/[^0-9]/g, '');
																						arrayHelpers.replace(index, {
																							...values.material[index],
																							['assetQuantity']: value
																						});
																					}}
																					error={validate([data])?.assetQuantity}
																					helperText={validate([data]).assetQuantity ? 'Receiving quantity is more than actual quantity' : ''}
																				/>
																			)}
																		</div>
																	</div>
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
											if (!validate(values.material).assetQuantity) {
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
				</>
			</Dialog>
			{assetNumberDialog.open && (
				<AssetDialog
					handleClose={() => setAssetNumberDialog({ open: false, material: [] })}
					products={assetNumberDialog.material
						?.filter((e) => e.serializedProduct && e.type === MATERIAL_TYPE.product)
						?.map((e) => {
							return { id: e._id, product: material.find((u) => u.uniqueId === e._id)?.materialId, productName: material.find((u) => u.uniqueId === e._id)?.detail, qty: e.assetQuantity };
						})}
					handleSuccess={(rows) => {
						handleReceive(rows);
					}}
					loading={isSubmitting}
				/>
			)}
		</>
	)
}

export default StartSubleaseDialog;
