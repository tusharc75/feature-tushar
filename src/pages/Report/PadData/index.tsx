import { Box, Dialog, Grid } from "@material-ui/core";
import { useEffect } from "react";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomReactTable, { useTableReducer } from "src/components/CustomReactTable";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { CustomDialogTransition } from "src/constants/helpers";

const PadData = ({ handleClose, columns, data }) => {
	const { state, dispatch } = useTableReducer();

	useEffect(() => {
		fetchRecords()
	}, [data])

	const fetchRecords = () => {
		dispatch({ type: 'initialize', data: data, count: data?.length });
	}

	return (
		<Dialog fullScreen TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} fullWidth>
			<CustomDialogHeader title={`Pad Data`} onClose={handleClose} showRequiredLabel={false}></CustomDialogHeader>
			<CustomDialogContent isFooterPresent={false}>
				<Grid item xs={12} md={12} sm={12} className="mt-3">
					{columns ? (
						<CustomReactTable
							height={'calc(100vh - 200px)'}
							columns={columns}
							state={state}
							dispatch={dispatch}
							renderedFrom={'historical-report_pad_data'}
							isClientSideGrid={true}
							refreshGrid={fetchRecords}
							hideSelection={true}
							hideAction={true}
						/>
					) : (
						<Box p={2} height={500}>
							<CommonSkeleton lenArray={[...Array(10).keys()]} />
						</Box>
					)}
				</Grid>
			</CustomDialogContent>
		</Dialog>
	)
}

export default PadData;
