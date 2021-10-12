import { useState, useEffect, useContext, Fragment } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, ListItemSecondaryAction, ListItem, List, ListItemText, makeStyles } from "@material-ui/core";
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
import BoxWithBorder from "../../components/BoxWithBorder";
import { ControlPoint } from "@material-ui/icons";
import ManagePricingDiscountDialog from "./ManagePricingDiscountDialog";

const useStyles = makeStyles((theme) => ({
    demo: {
        backgroundColor: theme.palette.background.paper,
        width: "100%",
    },
    title: {
        margin: theme.spacing(4, 0, 2),
    },
    list: {
        width: "100%",
        padding: 0,
    },
}));

const PricingConditionsDetailsPage = () => {
    const toastConfig = useContext(CustomToastContext);

    const { id } = useParams();
    const history = useHistory();
    const {
        state: { user, permissions }
    }: any = useData();
    const classes = useStyles();
    const [headingLabel, setHeadingLabel] = useState("");
    const [loading, setLoading] = useState(false);
    const [pricingConditionsData, setPricingConditionsData] = useState(null);
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [openPricingConditionDialog, setOpenPricingConditionDialog] = useState(false);
    const [pricingConditionsFields, setPricingConditionsFields] = useState([]);
    const [mainPoints, setMainPoints] = useState(null);
    const [customizedRoutes, setCustomizedRoutes] = useState([]);
    const [currency, setCurrency] = useState(null);
    const [discountType, setDiscountType] = useState(null);


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
                setCurrency(data.currency)
                setDiscountType(data.type)
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
                    <Grid item xs={12} sm={12} md={4} lg={4} spacing={2}>
                        {/* <Paper>
                            <Box
                                padding={1}
                                bgcolor="grey.200"
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography variant="subtitle2">
                                    Pricing Conditions
                                </Typography>

                                {permissions.pricingCondition.isUpdate && (
                                    <IconButton
                                        title="Assign users"
                                        color="primary"
                                        size="small"
                                        onClick={() => { setOpenPricingConditionDialog(true) }}
                                    >
                                        <ControlPoint />
                                    </IconButton>
                                )}
                            </Box>
                            {(
                                <Box>
                                    {loading ? (
                                        [1, 2].map((i) => (
                                            <BoxWithBorder
                                                key={i}
                                                style={{
                                                    margin: "8px",
                                                }}
                                            >
                                                <Box padding={1}>
                                                    <Skeleton
                                                        variant="text"
                                                        width="100px"
                                                        height="20px"
                                                    />
                                                    <Box marginTop={1} />
                                                    <Skeleton variant="text" width="100%" height="15px" />
                                                </Box>
                                            </BoxWithBorder>
                                        ))

                                    ) : (
                                        pricingConditionsData?.discount && pricingConditionsData?.discount.length > 0 ?
                                            <>
                                                <div className={classes.demo}>
                                                    <List disablePadding>
                                                        {pricingConditionsData?.discount && pricingConditionsData?.discount.length
                                                            ? pricingConditionsData?.discount.map((obj) => (
                                                                <BoxWithBorder key={obj._id} style={{ margin: "8px" }}>
                                                                    <ListItem disableGutters className={classes.list}>
                                                                        <div>
                                                                            <ListItemText
                                                                                primary={
                                                                                    <Typography>
                                                                                        {`Quantity ${obj?.quantity || ""}`}
                                                                                    </Typography>
                                                                                }
                                                                                secondary={discountType === "Flat Discount" ? `Discount % ${obj?.amount}` : `Amount ${currency} ${obj?.amount}`}
                                                                            />
                                                                        </div>
                                                                    </ListItem>
                                                                </BoxWithBorder>
                                                            ))

                                                            : null}
                                                    </List>
                                                </div>

                                            </>
                                            : <Box textAlign="center" padding={2}>
                                                <Typography>No price condition has been assigned </Typography>
                                            </Box>
                                    )}
                                </Box>
                            )}
                        </Paper> */}
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
                    onClose={() => {
                        setOpenUpdateDialog(false)
                    }}
                    onSuccess={() => {
                        setOpenUpdateDialog(false)
                        getPricingConditionsFieldsAndData()
                    }}
                    pricingConditionId={id}
                />
            )}
            {openPricingConditionDialog && (
                <ManagePricingDiscountDialog
                    open={openPricingConditionDialog}
                    onClose={() => {
                        setOpenPricingConditionDialog(false)
                    }}
                    currency={currency}
                    pricingConditionsData={pricingConditionsData}
                    discountType={discountType}
                    onSuccess={() => {
                        setOpenPricingConditionDialog(false)
                        getPricingConditionsFieldsAndData()
                    }}
                />
            )

            }

        </>
    );
};

export default PricingConditionsDetailsPage;
