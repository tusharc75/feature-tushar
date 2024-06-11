import { Fragment, useContext, useEffect, useState } from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import { Form, Formik } from 'formik';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import { isEqual } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import InputField from 'src/components/Helpers/InputField';
import { isMobile, isTablet } from 'react-device-detect';
import CustomButton from 'src/components/Helpers/CustomButton';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { CHILD_RESOURCE, CustomDialogTransition, getObjKeys, yupSchema } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import routes from 'src/components/Helpers/Routes';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';

export default function ReceivingCostDialog({ onClose, onSuccess, _id, subcontractAssemblyData, isSubmitting }) {

	const toastConfig = useContext(CustomToastContext);
	const [initialData, setInitialData] = useState({ fields: [], values: {} });
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		var fields = await fetch_child_resource_fields(CHILD_RESOURCE.subcontractAssemblyCost, subcontractAssemblyData?.currency, true, false);

		axiosInstance().get(`${routes.subcontractAssembly.path}/total-consumables-cost/${subcontractAssemblyData?._id}/${_id}`).then(({ data: { data } }) => {
			const tempInitialData = getObjKeys('', fields);
			const calValues = autoCalculateSpecificFields({ [`consumableCost_${subcontractAssemblyData?.currency.toLowerCase()}`]: data?.totalConsumablesCost }, tempInitialData, fields);
			Object.assign(tempInitialData, calValues);
			setInitialData({
				fields: fields,
				values: tempInitialData
			});
		}).catch((err) => {
			toastConfig.setToastConfig(err);
		});
	}

	const handleSubmit = (values) => {
		onSuccess(values)
	};

	return (
		<Dialog
			TransitionComponent={CustomDialogTransition}
			open={true}
			aria-labelledby="customized-dialog-title"
			fullWidth
			fullScreen={fullScreen}
			maxWidth={'md'}
			onClose={(e, reason) => {
				if (reason !== 'backdropClick') {
				}
			}}
		>
			{initialData.fields.length ? (
				<Formik
					initialValues={initialData.values}
					enableReinitialize={true}
					validationSchema={yupSchema(initialData.fields)}
					onSubmit={handleSubmit}
				>
					{({ values, errors, setFieldValue, touched, submitForm, setValues }) => (
						<Fragment>
							<CustomDialogHeader
								onClose={() => {
									if (isEqual(initialData.values, values)) onClose();
									else setShowConfirmDialog(true);
								}}
								title={`Cost`}
								isMinimized={!fullScreen}
								onMinimizeMaximize={() => {
									setFullScreen((prevState) => !prevState);
								}}
								showManimizeMaximize={true}
							/>
							<CustomDialogContent>
								<Form autoComplete="off" autoCorrect="off" noValidate>
									<InputField
										errors={errors}
										values={values}
										setFieldValue={setFieldValue}
										touched={touched}
										fieldsData={initialData.fields}
										size="small"
										fullWidth
									/>
								</Form>
							</CustomDialogContent>
							<CustomDialogFooter>
								<Button
									size="small"
									color="primary"
									disabled={isSubmitting}
									onClick={() => {
										if (isEqual(initialData.values, values)) onClose();
										else setShowConfirmDialog(true);
									}}
								>
									Cancel
								</Button>
								<CustomButton
									disabled={isSubmitting}
									loading={isSubmitting}
									variant="contained"
									color="primary"
									type="submit"
									onClick={(e) => {
										e.preventDefault();
										submitForm();
									}}
								>
									{' '}
									Save
								</CustomButton>
							</CustomDialogFooter>
							{showConfirmDialog ? (
								<ConfirmationCancelDialog
									close={() => setShowConfirmDialog(false)}
									open={showConfirmDialog}
									onSave={() => {
										setShowConfirmDialog(false);
										submitForm();
									}}
									onClose={() => {
										setShowConfirmDialog(false);
										onClose();
									}}
								/>
							) : null}
						</Fragment>
					)}
				</Formik>
			) : (
				<Box p={2} height={500}>
					<CommonSkeleton lenArray={[...Array(10).keys()]} />
				</Box>
			)}
		</Dialog>
	);
}
