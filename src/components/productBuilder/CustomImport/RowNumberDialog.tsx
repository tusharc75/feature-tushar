import { Button, Dialog, Grid, TextField } from "@material-ui/core";
import { Form, Formik } from "formik";
import { useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import { CustomDialogTransition } from "src/constants/helpers";

const RowNumberDialog = ({ handleClose, onSuccess }) => {
	const [initialValues, setInitialValues] = useState({ fromRow: 0, toRow: 0 })

	const handleSave = (values) => {
		onSuccess(values)
	}

	return (
		<Dialog
			aria-labelledby="customized-dialog-title"
			fullWidth
			fullScreen={isMobile || isTablet}
			TransitionComponent={CustomDialogTransition}
			disableEnforceFocus
			maxWidth={'sm'}
			open={true}
			onClose={(e, reason) => {
				if (reason !== 'backdropClick') {
				}
			}}
		>
			<Formik initialValues={initialValues} onSubmit={handleSave}>
				{({ submitForm, touched, errors, setFieldValue, values }) => (
					<>
						<CustomDialogHeader title={'Excel Rows'} showRequiredLabel={false} onClose={handleClose} ></CustomDialogHeader>
						<CustomDialogContent>
							<Form autoComplete="off" autoCorrect="off" noValidate>
								<Grid container spacing={2}>
									<Grid item sm={12} xs={6} md={6} lg={6}>
										<TextField
											variant="outlined"
											type="number"
											label={'From'}
											name="fromRow"
											fullWidth
											margin="dense"
											size={'small'}
											value={values['fromRow']}
											onChange={(e) => {
												setFieldValue('fromRow', +e.target.value >= 0 ? +e.target.value : 0);
											}}
										/>
									</Grid>
									<Grid item sm={12} xs={6} md={6} lg={6}>
										<TextField
											variant="outlined"
											type="number"
											label={'To'}
											name="toRow"
											fullWidth
											margin="dense"
											size={'small'}
											value={values['toRow']}
											onChange={(e) => {
												setFieldValue('toRow', +e.target.value >= 0 ? +e.target.value : 0);
											}}
										/>
									</Grid>
								</Grid>

							</Form>
						</CustomDialogContent>
						<CustomDialogFooter>
							<Button size="small" onClick={handleClose} color="primary">
								Cancel
							</Button>
							<Button size="small" type="submit" color="primary" onClick={submitForm} variant="contained">
								Ok
							</Button>
						</CustomDialogFooter>
					</>
				)}
			</Formik>
		</Dialog>
	)
}

export default RowNumberDialog;
