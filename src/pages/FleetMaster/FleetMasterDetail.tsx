import { Box, Button, Grid, Tab, Tabs } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { isMobile, isTablet } from 'react-device-detect';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import { useData } from 'src/StateProvider/Provider';
import { useParams, useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ManageFleetMaster from './ManageFleetMaster';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { ACTIVITY_RESOURCE } from 'src/constants/helpers';
import TabPanel from '../../components/TabPanel';
import { FaWpforms } from 'react-icons/fa';

const FleetMasterDetail = () => {

    const { id } = useParams();
    const history = useHistory();
    const toastConfig = useContext(CustomToastContext);
    const { state: { permissions, user } }: any = useData();

    const [fleetMasterData, setFleetMasterData] = useState(null);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [fields, setFields] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [allowedToEdit, setAllowedToEdit] = useState(false);
    const [allowedToDelete, setAllowedToDelete] = useState(false);
    const [tabValue, setTabValue] = useState(0)

    useEffect(() => {
        if (id) {
            fetchFields();
            fetchData();
        }
    }, [id]);

    const fetchFields = async () => {
        axiosInstance()
            .get('/field?resource=Fleet Master')
            .then(({ data }) => {
                setFields(data.data?.filter((field) => field.isRead));
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const {
                data: { data }
            } = await axiosInstance().get(`${routes.fleetMaster.path}/${id}`);
            setFleetMasterData(data);
            setAllowedToEdit(data?.owner?.optionValue === user?.user?._id);
            setAllowedToDelete(data?.owner?.optionValue === user?.user?._id);
            setLoading(false);
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };

    const handleDelete = () => {
        if (id) {
            axiosInstance()
                .put(`${routes?.fleetMaster?.path}/remove`, { ids: [id] })
                .then(({ data }) => {
                    setShowConfirmBox(false);

                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: data?.message
                    });
                    history.goBack();
                })
                .catch((err) => {
                    setShowConfirmBox(false);
                });
        } else {
            setShowConfirmBox(false);
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


    return (
        <Box className="main-container-v1">
            <Box className="headerbox-v1">
                <Box className="nav-v1">
                    <CustomBreadCrumbs routes={[routes.fleetMaster, { title: fleetMasterData?.fleetNumber }]} />
                </Box>
                <Box className="controls-v1">
                    <Box className="control-buttons-v1">
                        {permissions?.fleetMaster?.isUpdate && (
                            <Button
                                variant={isMobile && !isTablet ? 'text' : 'contained'}
                                className="btn-outline-v1"
                                onClick={handleOpenUpdateDialog}
                                style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                            >
                                {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                            </Button>
                        )}
                        {permissions?.fleetMaster?.isDelete && (
                            <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                        )}
                    </Box>
                </Box>
            </Box>
            <Box className="detail-container-v1">
                <Tabs
                    className="new-tab-container-v1"
                    value={tabValue}
                    onChange={handleMainTabChange}
                    textColor="primary"
                    TabIndicatorProps={{
                        style: {
                            height: 0
                        }
                    }}
                >
                    <Tab
                        className={'tabLayout'}
                        label={
                            <div className="d-flex align-items-center tab-font">
                                <FaWpforms className="mr-1" fontSize="inherit" /> Header
                            </div>
                        }
                        value={0}
                        aria-controls="a11y-tabpanel-0"
                        id="a11y-tab-0"
                    />
                </Tabs>
                <TabPanel value={tabValue} index={0}>
                    {loading || !fields?.length ? (
                        <Grid container spacing={2} style={{ padding: '8px' }}>
                            <CommonSkeleton lenArray={[...Array(7).keys()]} />
                        </Grid>
                    ) : (
                        <DetailsPage data={fleetMasterData} fields={fields} />
                    )}
                </TabPanel>
            </Box>
            {showConfirmBox && (
                <ConfirmationDialog
                    open={showConfirmBox}
                    message={`Are you sure you want to delete ${routes?.fleetMaster?.title?.toLowerCase()} ?`}
                    onClose={() => {
                        setShowConfirmBox(false);
                    }}
                    onOk={handleDelete}
                />
            )}
            {openUpdateDialog && (
                <ManageFleetMaster
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
    );
};

export default FleetMasterDetail;
