import { Box, Button, Grid } from "@material-ui/core";
import { Edit } from "@material-ui/icons";
import { camelCase } from "lodash";
import { useContext, useEffect, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "src/StateProvider/Provider";
import axiosInstance from "src/axios/axiosInstance";
import DetailsPage from '../../components/Shared/DetailsPage';
import ActivityButton from "src/components/Activity/ActivityButton";
import CustomBreadCrumbs from "src/components/CustomBreadCrumbs";
import CustomTabs, { CustomTab, TabPanel } from "src/components/CustomTabs";
import { DeleteButton } from "src/components/Helpers/Buttons";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import routes from "src/components/Helpers/Routes";
import { ACTIVITY_RESOURCE, SUBCONTRACT_ASSEMBLY_STATUS, checkIsAllowedToEdit, sidebarResource, subcontractAssemblySteps } from "src/constants/helpers";
import ManageSubcontractAssembly from "src/pages/SubcontractAssembly/ManageSubcontractAssembly";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import Steps from "src/components/Steps";
import ContentFullScreen from "src/components/ContentFullScreen";
import Material from "src/pages/SubcontractAssembly/Material";
import Assign from "src/pages/SubcontractAssembly/Assign";

const SubcontractAssemblyDetail = () => {
	const { id } = useParams();
	const history = useHistory();
	const toastConfig = useContext(CustomToastContext);
	const renderedFrom = camelCase(routes?.subcontractAssembly?.title);
	const {
		state: { permissions, user }
	}: any = useData();

	const [subcontractAssemblyData, setSubcontractAssemblyData] = useState(null)
	const [fields, setFields] = useState(null);
	const [loading, setLoading] = useState(false);
	const [showConfirmBox, setShowConfirmBox] = useState(false);
	const [allowedToEdit, setAllowedToEdit] = useState(false);
	const [allowedToDelete, setAllowedToDelete] = useState(false);
	const [tabValue, setTabValue] = useState(0);
	const [currentStep, setCurrentStep] = useState(0);
	const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
	const [nextStep, setNextStep] = useState(false);
	const [stepFullScreen, setStepFullScreen] = useState(false);

	useEffect(() => {
		if (id) {
			fetchFields();
			fetchData();
		}
	}, [id]);

	const fetchFields = async () => {
		try {
			let data;
			const response = await axiosInstance().get(`/field?resource=${sidebarResource?.subcontractAssembly}`);
			data = response?.data?.data;
			setFields(data?.filter((field) => field.isRead));
		} catch (err) {
			toastConfig.setToastConfig(err);
		}
	};

	const fetchData = async () => {
		setLoading(true);
		try {
			const {
				data: { data }
			} = await axiosInstance().get(`${routes.subcontractAssembly.path}/${id}`);

			setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.subcontractAssembly, data));
			setAllowedToDelete(permissions?.subcontractAssembly?.isDelete && data.owner.optionValue === user?.user?._id && data?.canDelete);
			setSubcontractAssemblyData(data);
			// if (data?.status === PURCHASE_ORDER_STATUS.closed) {
			// 	setCurrentStep(purchaseOrderSteps?.length - 1);
			// } else {
			// setCurrentStep(getIndex(data?.processStatus, purchaseOrderSteps));
			// }
			setLoading(false);
		} catch (error) {
			toastConfig.setToastConfig(error);
		}
	};

	const handleOpenUpdateDialog = () => {
		setOpenUpdateDialog(true);
	};

	const closeUpdateDialog = () => {
		setOpenUpdateDialog(false);
	};

	const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
		setTabValue(newValue);
	};

	const handleDelete = () => {
		if (id) {
			axiosInstance()
				.put(`${routes?.subcontractAssembly?.path}/remove`, { ids: [id] })
				.then(({ data }) => {
					setShowConfirmBox(false);
					toastConfig.setToastConfig({
						open: true,
						type: 'success',
						message: data?.message
					});
					history.push(`${routes.subcontractAssembly.path}`);
				})
				.catch((err) => {
					setShowConfirmBox(false);
				});
		} else {
			setShowConfirmBox(false);
		}
	};

	return (
		<Box className="main-container-v1">
			<Box className="headerbox-v1">
				<Box className="nav-v1">
					<CustomBreadCrumbs routes={[routes.subcontractAssembly, { title: subcontractAssemblyData?.subcontractAssemblyNumber }]} />
				</Box>
				<Box className="controls-v1">
					<Box className="control-buttons-v1">
						{allowedToEdit && (
							<Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
								{isMobile && !isTablet ? <Edit /> : 'Edit'}
							</Button>
						)}
						{allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
						<ActivityButton
							referenceId={subcontractAssemblyData?._id}
							resource={ACTIVITY_RESOURCE.subcontractAssembly}
							resourceLabel={subcontractAssemblyData?.subcontractAssemblyNumber}
						/>
					</Box>
				</Box>
			</Box>
			<Box className="detail-container-v1">
				<CustomTabs value={tabValue} onChange={handleMainTabChange}>
					<CustomTab value={0}>Header</CustomTab>
					<CustomTab value={1}>Details</CustomTab>
				</CustomTabs>
				<TabPanel value={tabValue} index={0}>
					{loading || !fields?.length ? (
						<Grid container spacing={2} style={{ padding: '8px' }}>
							<CommonSkeleton lenArray={[...Array(7).keys()]} />
						</Grid>
					) : (
						<DetailsPage data={subcontractAssemblyData} fields={fields} />
					)}
				</TabPanel>
				<TabPanel value={tabValue} index={1}>
					<Steps
						isNextStep={false}
						nextStep={nextStep}
						steps={subcontractAssemblySteps}
						currentStep={currentStep}
						setCurrentStep={setCurrentStep}
						isStepEnded={[SUBCONTRACT_ASSEMBLY_STATUS.closed].includes(subcontractAssemblyData?.status)}
						setStepFullScreen={() => setStepFullScreen(true)}
					/>
					<ContentFullScreen title={subcontractAssemblySteps[currentStep]?.title} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
						{currentStep === 0 && subcontractAssemblyData && (
							<Material subcontractAssemblyData={subcontractAssemblyData} stepFullScreen={stepFullScreen} allowedToEdit={allowedToEdit} setNextStep={setNextStep} />
						)}
						{currentStep === 1 && subcontractAssemblyData && (
							<Assign subcontractAssemblyData={subcontractAssemblyData} stepFullScreen={stepFullScreen} allowedToEdit={allowedToEdit} setNextStep={setNextStep} />
						)}
					</ContentFullScreen>
				</TabPanel>

			</Box>
			{showConfirmBox && (
				<ConfirmationDialog
					open={showConfirmBox}
					message={`Are you sure you want to delete ${subcontractAssemblyData['subcontractAssemblyNumber']}  ?`}
					onClose={() => {
						setShowConfirmBox(false);
					}}
					onOk={handleDelete}
				/>
			)}
			{openUpdateDialog && (
				<ManageSubcontractAssembly
					id={id}
					isClone={false}
					onClose={closeUpdateDialog}
					onSuccess={() => {
						closeUpdateDialog();
						fetchData();
					}}
				/>
			)}
		</Box>
	)
}

export default SubcontractAssemblyDetail;
