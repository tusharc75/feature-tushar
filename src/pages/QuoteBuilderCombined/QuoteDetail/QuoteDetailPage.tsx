import { Button, makeStyles } from "@material-ui/core";
import DetailsPage from "../../../components/Shared/DetailsPage";
import axiosInstance from '../../../axios/axiosInstance';
import { useMemo, useState, useContext, useEffect } from "react";
import { formatAmountWithCurrency, processFieldName, stepsToIgnoreManualCompleteForOpportunity } from "../../../constants/helpers";
import { BiLayerPlus } from "react-icons/bi";
import { HiPencil } from "react-icons/hi";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";

const useStyles = makeStyles(() => ({
    detailBox: {
        border: "1px solid #163340",
    },
    btnHeader: {
        position: "absolute",
        top: "4px",
        right: "20px",
    },
}));

export default function QuoteDetailPage({ quoteData, quotePermissions, selectedEntity, ifQuoteApprovedAapproved, allowedToEdit, handleOpenUpdateDialog,handleOpenCloneDialog, handleSetSteps }) {
    const classes = useStyles();
    const [loadingFields, setLoadingFields] = useState(false);
    const [quoteFields, setQuoteFields] = useState([]);
    const toastConfig = useContext(CustomToastContext);


    const getCopyOfQuoteData = useMemo(() => {
        let modifiedData = {};
        if (quoteData) {
            Object.assign(modifiedData, quoteData);
            modifiedData["estimatedAmount"] = formatAmountWithCurrency(
                modifiedData["currency"],
                modifiedData["estimatedAmount"]
            ).shortFormatAmount;

            modifiedData["invoiceAmount"] = formatAmountWithCurrency(
                modifiedData["currency"],
                modifiedData["invoiceAmount"]
            ).shortFormatAmount;
        }
        return modifiedData;
    }, [quoteData?.accountName, quoteData?.closeDate, quoteData?.estimatedAmount, quoteData?.currency, quoteData?.owner,]);

    useEffect(() => {
        if (quoteData._id) {
            getQuoteFields()
        }
    }, [quoteData._id]);

    const getQuoteFields = () => {
        if (selectedEntity) {
            setLoadingFields(true);
            axiosInstance()
                .get(`/field?resource=Quotes&entity=${selectedEntity}`)
                .then(({ data: { data } }) => {
                    setQuoteFields(data);
                    const processSteps = data.find(
                        (d) =>
                            d.isRead &&
                            d.fieldData.fieldName.toLowerCase() ===
                            processFieldName.toLowerCase()
                    );
                    if (processSteps && processSteps.isRead) {
                        let tempSteps = processSteps.fieldData.option.map((m) => {
                            return {
                                text: m.optionLabel,
                                canCompleteManually:
                                    !stepsToIgnoreManualCompleteForOpportunity.some(
                                        (s) => s === m.optionValue.toLowerCase()
                                    ),
                            };
                        })

                        handleSetSteps(tempSteps)
                    }
                    setLoadingFields(false);
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                    setLoadingFields(false);
                });
        }
    };

    return (
        <div className={`position-relative ${classes.detailBox}`}>
            {quoteData  && (
                <>
                    <div className={classes.btnHeader}>
                        {quotePermissions?.isCreate ? (
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                className="mr-1"
                                startIcon={<BiLayerPlus />}
                                onClick={handleOpenCloneDialog}
                            >
                                Clone
                            </Button>
                        ) : null}
                        {allowedToEdit ? (
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<HiPencil />}
                                onClick={handleOpenUpdateDialog}
                            >
                                Edit
                            </Button>
                        ) : null}
                    </div>
                    {!loadingFields && quoteFields ? (
                        <DetailsPage
                            data={getCopyOfQuoteData}
                            fields={
                                !ifQuoteApprovedAapproved
                                    ? quoteFields.filter(
                                        (_f) =>
                                            _f.fieldData.sectionName !==
                                            "Post-Quote Information"
                                    )
                                    : quoteFields
                            }
                        />
                    ) : null}
                </>
            )}
        </div>
    )
}
