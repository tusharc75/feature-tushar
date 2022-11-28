import { useState, useEffect, useContext, Fragment } from "react";
import { Grid, Box, Button, Paper } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import ManageWellMaster from "./ManageWellMaster";
import DeleteButton from "../../components/Helpers/DeleteButton";
import { wellMaster } from "src/constants/helpers";

const WellMasterDetailsPage = () => {
    const toastConfig = useContext(CustomToastContext);

    const { id } = useParams();
    const history = useHistory();
    const {
        state: { permissions },
    }: any = useData();
    const [headingLbl, setHeadingLbl] = useState("");
    const [loading, setLoading] = useState(false);
    const [wellMasterData, setWellMasterData] = useState(null);
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [wellMasterFields, setWellMasterFields] = useState([]);
    const [mainPoints, setMainPoints] = useState(null);
    const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });

    const [customizedRoutes, setCustomizedRoutes] = useState<any>([
        routes.wellMaster,
    ]);

    useEffect(() => {
        if (id) {
            getWellMasterFields();
            fetchWellMasterData();

        }
    }, [id]);

    const fetchWellMasterData = async () => {
        setLoading(true);
        try {
            const {
                data: { data },
            } = await axiosInstance().get(`${wellMaster.api}/${id}`);
            setHeadingLbl(data.wellName);
            setWellMasterData(data);
            setCustomizedRoutes([routes.wellMaster, { title: data.wellName }]);
            setLoading(false);
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };

    const getWellMasterFields = () => {
        axiosInstance()
            .get("/field?resource=Well Master")
            .then(({ data }) => {
                setWellMasterFields(data.data?.filter((field) => field.isRead))
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const handleDeleteWellMaster = () => {
        if (id) {
            if (permissions?.wellMaster?.isDelete) {
                axiosInstance()
                    .put(`${wellMaster.api}/remove`, { ids: [id] })
                    .then(({ data }) => {
                        setShowConfirmBox(false);

                        history.goBack();
                    })
                    .catch((err) => {
                        setShowConfirmBox(false);
                    });
            }
        } else {
            setShowConfirmBox(false);
        }
    };

    return (
        <>
            {
                showManageDialog.open &&
                <ManageWellMaster
                    isClone={showManageDialog.isClone}
                    wellMasterId={showManageDialog.idToClone}
                    onClose={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
                    onSuccess={() => {
                        setShowManageDialog({ open: false, isClone: false, idToClone: null });
                        fetchWellMasterData()
                    }}
                />
            }
            {showConfirmBox && (
                <ConfirmationDialog
                    open={showConfirmBox}
                    message={`Are you sure you want to delete ${routes.wellMaster.title.toLowerCase()} ${headingLbl}?`}
                    onClose={() => {
                        setShowConfirmBox(false)
                    }}
                    onOk={handleDeleteWellMaster}
                />
            )}
            <Fragment>
                <Grid container className="headerbox">
                    <CustomBreadCrumbs routes={customizedRoutes} />
                </Grid>
                <Grid container spacing={1} className="detail-container">
                    <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
                        <Paper>
                            {!wellMasterData ? (
                                <div>
                                    <Skeleton variant="text" width="150px" height="40px" />
                                    <Box display="flex">
                                        <Skeleton
                                            style={{ borderRadius: 6 }}
                                            width="120px"
                                            height="80px"
                                        />
                                        <Box marginX={1} />
                                        <Skeleton
                                            style={{ borderRadius: 6 }}
                                            width="120px"
                                            height="80px"
                                        />
                                    </Box>
                                </div>
                            ) : (
                                <DetailsPageHeader
                                    heading={headingLbl}
                                    mainPoints={mainPoints}
                                    showHeading={true}
                                >
                                    {permissions?.address?.isUpdate && (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            onClick={() => {
                                                if (permissions?.wellMaster?.isUpdate) {
                                                    setShowManageDialog({ open: true, isClone: false, idToClone: wellMasterData._id });
                                                }
                                            }}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                    <Box component="span" marginX={1} />
                                    {permissions?.address?.isDelete && (
                                        <span
                                            title={
                                                id
                                                    ? "Primarily selected address can't be deleted"
                                                    : "Permanently delete this address"
                                            }
                                        >
                                            <DeleteButton
                                                text="Delete"
                                                onClick={() => setShowConfirmBox(true)}
                                            />
                                        </span>
                                    )}
                                </DetailsPageHeader>
                            )}

                            <Box>
                                {loading || !wellMasterFields.length ? (
                                    <Grid container spacing={2} style={{ padding: "8px" }}>
                                        <CommonSkeleton lenArray={[...Array(7).keys()]} />
                                    </Grid>
                                ) : (
                                    <DetailsPage data={wellMasterData} fields={wellMasterFields} />
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Fragment>

        </>
    );
};

export default WellMasterDetailsPage;
