import { useState, useEffect, useContext, Fragment } from "react";
import { Grid, Box, Button, Paper } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { pricingCondition } from "../../constants/helpers";
import DeleteButton from "../../components/Helpers/DeleteButton";
import ManagePricingConditionsDialog from "./ManagePricingConditionsDialog";
import routes from "../../components/Helpers/Routes";

const PricingConditionsDetailsPage = () => {
    const toastConfig = useContext(CustomToastContext);

    const { id } = useParams();
    const history = useHistory();
    const {
        state: { user, permissions }
    }: any = useData();
    const [headingLabel, setHeadingLabel] = useState("");
    const [loading, setLoading] = useState(false);
    const [pricingConditionsData, setPricingConditionsData] = useState(null);
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [pricingConditionsFields, setPricingConditionsFields] = useState([]);
    const [mainPoints, setMainPoints] = useState(null);
    const [customizedRoutes, setCustomizedRoutes] = useState([]);


    useEffect(() => {
        if (id) {
            getPricingConditionsFieldsAndData();
        }
        // eslint-disable-next-line
    }, [id]);

    const handleMainPoints = (data) => {
        let mainPoint = {};
        mainPoint['Quantity'] = data?.qty || '';
        mainPoint['MRP'] = data?.mrp || '';
        setMainPoints(mainPoint);
    };

    const getPricingConditionsFieldsAndData = () => {
        setLoading(true);
        axiosInstance()
            .get("/field?resource=Pricing Condition")
            .then(({ data: { data } }) => {
                setPricingConditionsFields(data)
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });

        axiosInstance()
            .get(`${pricingCondition.pricingConditionApi}/${id}`)
            .then(({ data: { data } }) => {
                handleMainPoints(data);
                setHeadingLabel(data.conditionName);
                setPricingConditionsData(data);
                setCustomizedRoutes([routes.pricingCondition, { title: data.conditionName }]);
                setLoading(false);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    const handleOpenUpdateDialog = () => {
        setOpenUpdateDialog(true);
    };

    const handleDelete = () => {

        axiosInstance().put(`${pricingCondition.pricingConditionApi}/remove`, { "ids": [id] }).then(() => {
            setShowConfirmBox(false);
            history.goBack();
        }).catch((error) => {
            toastConfig.setToastConfig(error)
            setShowConfirmBox(false);
        });
    }

    return (
        <>
            <Fragment>

                <Grid container className="headerbox">
                    <CustomBreadCrumbs routes={customizedRoutes} />
                </Grid>
                <Grid container spacing={1} className="detail-container">
                    <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
                        <Paper>
                            {!pricingConditionsData ? (
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
                                    heading={headingLabel}
                                    mainPoints={mainPoints}
                                    showHeading={true}
                                >
                                    {permissions?.pricingCondition?.isUpdate && (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            onClick={handleOpenUpdateDialog}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                    {permissions?.pricingCondition?.isDelete &&
                                        <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                                    }

                                </DetailsPageHeader>
                            )}


                            <Box>
                                {loading || !pricingConditionsFields.length ? (
                                    <Grid container spacing={2} style={{ padding: "8px" }}>
                                        <CommonSkeleton lenArray={[...Array(7).keys()]} />
                                    </Grid>
                                ) : (
                                    <>
                                        <DetailsPage data={pricingConditionsData} fields={pricingConditionsFields} />
                                    </>
                                )}
                            </Box>

                        </Paper>
                    </Grid>

                </Grid>

            </Fragment>
            {showConfirmBox && (
                <ConfirmationDialog
                    open={showConfirmBox}
                    message={`Are you sure you want to delete this pricing conditions ${headingLabel} ?`
                    }
                    onClose={() => {
                        setShowConfirmBox(false);
                    }}
                    onOk={handleDelete}
                />
            )}

            {openUpdateDialog && (
                <ManagePricingConditionsDialog
                    open={openUpdateDialog}
                    onSuccess={getPricingConditionsFieldsAndData}
                    onClose={() => {
                        setOpenUpdateDialog(false)
                    }}
                    pricingConditionId={id}
                />
            )}


        </>
    );
};

export default PricingConditionsDetailsPage;
