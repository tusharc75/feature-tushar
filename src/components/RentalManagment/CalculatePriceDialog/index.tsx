import { Dialog, Button, CircularProgress, List, ListItem, ListItemText, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Grid, Box, Typography } from "@material-ui/core";
import { map, uniq } from "lodash";
import { useContext, useState, useEffect } from "react";
import axiosInstance from "src/axios/axiosInstance";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import Loader from "src/components/Loader";
import { getUniqueCurrencies, pricingCondition } from "src/constants/helpers";

const CalculatePriceDialog = ({
    setPriceData,
    onClose,
    rentalManagementData,
    material
}) => {
    const [pricingConditionData, setPricingConditionData] = useState([]);
    const [displayData, setDisplayData] = useState([]);
    const [submitData, setSubmitData] = useState([]);
    const [value, setValue] = useState(null);

    useEffect(() => {
        if (rentalManagementData) {
            fetchCalculatePrice()
        }
        // eslint-disable-next-line
    }, []);

    const fetchCalculatePrice = () => {
        const data: any = {};
        data.conditionType = ['Rent'];
        data.material = material.filter((d) => d.listPrice === null || d.listPrice === undefined || d.listPrice === 0).map((ele) => ({
            materialId: ele?.materialId,
            materialType: ele?.type,
            qty: ele?.qty,
            pricingMethod: ele?.pricingMethod,
            unit: ele?.unit,
            currency: rentalManagementData?.currency
        }));
        data.supplier = [];
        data.customer = [rentalManagementData?.customerAccount?.optionValue];
        data.warehouse = [rentalManagementData?.warehouse?.optionValue];
        axiosInstance()
            .post(pricingCondition.api + `/calculatePrice`, data)
            .then(({ data: { data } }) => {
                let products = uniq(map(data, 'materialId'));
                if (products.length === data.length) {
                    setPriceData(data)
                }
                else {
                    let customData = products.map((materialId) => {
                        let pricingConditionList = data.filter((field) => field.materialId === materialId);
                        if (pricingConditionList.length === 1) {
                            setSubmitData((prevState) => {
                                return [...prevState, ...pricingConditionList];
                            });
                        }
                        else {
                            let tempDetail = material.find((d) => d.materialId === materialId)?.detail;
                            let productData = { materialId: materialId, detail: tempDetail }
                            return { productData, pricingConditionList };
                        }
                    }).filter(d => d);
                    setValue(customData.reduce(
                        (obj, item) => Object.assign(obj, { [item.productData?.materialId]: item.pricingConditionList[0]?.mrp }), {}))
                    setDisplayData(customData)
                    setPricingConditionData(data);
                }
            })
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>, materialId) => {
        setValue((prevState) => ({
            ...prevState,
            [`${materialId}`]: Number((event.target as HTMLInputElement).value)
        }))
    };

    return (
        <>
            {pricingConditionData.length !== 0 ?
                <Dialog
                    fullWidth
                    maxWidth="md"
                    open={true}
                    onClose={onClose}
                    aria-labelledby="pricing-condition-dialog"
                >
                    <CustomDialogHeader title="Select Pricing Condition" showRequiredLabel={false} />
                    <CustomDialogContent>
                        {displayData.length === 0 ? (
                            <Loader text="Loading Pricing Conditions" />
                        ) : (
                            <>
                                {displayData.map((obj) => (
                                    <Box p={1}>
                                        <Box border={0.7} p={1} borderColor="grey.300">
                                            <Typography
                                                variant="subtitle2"
                                            >
                                                {` ${obj.productData?.detail}`}
                                            </Typography>
                                            <FormControl component="fieldset">
                                                <RadioGroup row aria-label="pricing-condition" name={obj.productData?.materialId} value={value[obj.productData?.materialId] ?? null} onChange={(event) => handleChange(event, obj.productData?.materialId)}>
                                                    {obj.pricingConditionList?.map((price) => (
                                                        <FormControlLabel value={Number(price?.mrp)} labelPlacement="end" control={<Radio />} label={`${price?.conditionName} : ${getUniqueCurrencies().find((d) => d.currencyCode === price['currency'])?.symbolNative} ${price?.mrp}`} />
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                        </Box>
                                    </Box>
                                ))}
                            </>
                        )}
                    </CustomDialogContent>
                    <CustomDialogFooter>
                        <Button
                            onClick={() => {
                                setPriceData([...submitData, ...pricingConditionData.filter(d => value[d.materialId] === d.mrp)])
                            }}
                            color="primary"
                            size="small"
                            variant="contained"
                        >
                            Apply
                        </Button>
                    </CustomDialogFooter>
                </Dialog>
                : null}
        </>

    );
};

export default CalculatePriceDialog;
