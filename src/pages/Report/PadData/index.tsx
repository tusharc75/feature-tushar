import { Box, Dialog, Grid } from "@material-ui/core";
import { useEffect, useState } from "react";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomReactTable, { useTableReducer } from "src/components/CustomReactTable";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import NoDataCell from "src/components/Helpers/NoDataCell";
import routes from "src/components/Helpers/Routes";
import { CustomDialogTransition } from "src/constants/helpers";

const PadData = ({ handleClose, column, data }) => {

	const { state, dispatch } = useTableReducer();

	const [columns, setColumns] = useState(null)

	useEffect(() => {
		fetchColumns()
		fetchRecords()
	}, [data])

	const fetchColumns = () => {
		setColumns([{
			accessor: 'padName',
			Header: 'Pad Name',
			width: 200,
			Cell: ({ row }) => (
				<div>
					{row?.original?.padName?.optionLabel ? (
						<p className="link text-truncate"
							onClick={() => {
								window.open(`${routes.padMasterDetail.path}/${row?.original?.padName?.optionValue}`)
							}}>{row?.original?.padName?.optionLabel}</p>
					) : 'Total'}
				</div>
			),
		}, {
			accessor: 'customerAccount',
			Header: 'Customer Account',
			width: 200,
			Cell: ({ row }) => (
				<div>
					{row?.original?.customerAccount?.optionLabel ? (
						<p className="link text-truncate"
							onClick={() => {
								window.open(`${routes.customerAccountDetail.path}/${row?.original?.customerAccount?.optionValue}`)
							}}>{row?.original?.customerAccount?.optionLabel}</p>
					) : <NoDataCell />}
				</div>
			),
		}, ...column])
	}

	const fetchRecords = () => {
		dispatch({ type: 'initialize', data: [...(data?.padData || []), data], count: (data?.padData?.length + 1) });
	}

	return (
		<Dialog fullScreen TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} fullWidth>
			<CustomDialogHeader title={`Pad Wise Data`} onClose={handleClose} showRequiredLabel={false}></CustomDialogHeader>
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
							showArrangeView={false}
							refreshGrid={fetchRecords}
							hideSelection={true}
							hideAction={true}
							setWholeRowsCellColor={(rowData) => {
								if (!rowData?.padName) return 'footerRow';
								return '';
							}}
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
