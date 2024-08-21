import { Box, Dialog } from "@material-ui/core";
import { useEffect, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import { fetch_child_resource_fields } from "src/components/ChildResourceField";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { CHILD_RESOURCE, CustomDialogTransition } from "src/constants/helpers";
import DetailsPage from '../../../components/Shared/DetailsPage';
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";

const ViewCost = ({ data, title, onClose, subcontractAssemblyData }) => {
	const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
	const [fields, setFields] = useState(null);
	const fetchData = async () => {
		var fields = await fetch_child_resource_fields(CHILD_RESOURCE.subcontractAssemblyCost, subcontractAssemblyData?.currency, false, false);
		setFields(fields?.map(f => ({ fieldData: f })));
	}

	useEffect(() => {
		fetchData()
	}, [])

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
			{fields && fields?.length ? (
				<Box>
					<CustomDialogHeader
						onClose={onClose}
						title={`View Cost (${title})`}
						isMinimized={!fullScreen}
						onMinimizeMaximize={() => {
							setFullScreen((prevState) => !prevState);
						}}
						showManimizeMaximize={true}
						showRequiredLabel={false}
					/>
					<Box p={2}>
						<DetailsPage data={data} fields={fields} />
					</Box>
				</Box>
			) : (
				<Box p={2} height={500}>
					<CommonSkeleton lenArray={[...Array(10).keys()]} />
				</Box>
			)}
		</Dialog>
	)
}

export default ViewCost;
