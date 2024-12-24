import {
  Dialog,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Grid,
  Box,
  Typography,
  TextField
} from '@mui/material';
import { Autocomplete } from '@material-ui/lab';
import { map, uniq } from 'lodash';
import { useContext, useState, useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import Loader from 'src/components/Loader';
import { CustomDialogTransition, PRICING_SETUP_TYPE, getUniqueCurrencies, pricingCondition } from 'src/constants/helpers';

const CalculatePriceDialog = ({ handleSucess, onClose, referenceData, material }) => {
  const [pricingConditionData, setPricingConditionData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [submitData, setSubmitData] = useState([]);
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (referenceData) {
      fetchCalculatePrice();
    }
  }, []);

  const fetchCalculatePrice = () => {
    const data: any = {};
    data.conditionType = [PRICING_SETUP_TYPE.rent];
    data.material = material
      .filter((d) => d.listPrice === null || d.listPrice === undefined || d.listPrice === 0)
      .map((ele) => ({
        materialId: ele?.materialId,
        materialType: ele?.type,
        qty: ele?.qty,
        pricingMethod: ele?.pricingMethod?.split(',')[0],
        unit: ele?.unit,
        currency: referenceData?.currency
      }));
    data.supplier = [];
    data.customer = [referenceData?.customerAccount?.optionValue];
    data.warehouse = [referenceData?.warehouse?.optionValue];
    data.address = referenceData?.shippingAddress?.optionValue ? [referenceData?.shippingAddress?.optionValue] : [];
    axiosInstance()
      .post(pricingCondition.api + `/calculatePrice`, data)
      .then(({ data: { data } }) => {
        data = data.filter((d) => d.mrp !== undefined && d.mrp !== null);
        handleSucess(data);
        //let products = uniq(map(data, 'materialId'));
        // if (products.length === data.length) {
        //     handleSucess(data)
        // }
        // else {
        //     let customData = products.map((materialId) => {
        //         let pricingConditionList = data.filter((field) => field.materialId === materialId);
        //         if (pricingConditionList.length === 1) {
        //             setSubmitData((prevState) => {
        //                 return [...prevState, ...pricingConditionList];
        //             });
        //         }
        //         else {
        //             let tempDetail = material.find((d) => d.materialId === materialId)?.detail;
        //             let productData = { materialId: materialId, detail: tempDetail }
        //             return { productData, pricingConditionList };
        //         }
        //     }).filter(d => d);
        //     setValue(customData.reduce((obj, item) => Object.assign(obj, { [item.productData?.materialId]: item.pricingConditionList[0] }), {}))
        //     setDisplayData(customData)
        //     setPricingConditionData(data);
        // }
      });
  };

  return (
    <>
      {pricingConditionData.length !== 0 ? (
        <Dialog
          TransitionComponent={CustomDialogTransition}
          fullWidth
          maxWidth="xs"
          open={true}
          onClose={onClose}
          aria-labelledby="pricing-condition-dialog"
        >
          <CustomDialogHeader title="Select Pricing Condition" showRequiredLabel={false} onClose={onClose} />
          <CustomDialogContent>
            {displayData.length === 0 ? (
              <Loader text="Loading Pricing Conditions" />
            ) : (
              <>
                {displayData.map((obj) => (
                  <Box p={1}>
                    <Box border={0.7} p={1} borderColor="var(--common-border-color)">
                      <Grid spacing={3} container>
                        <Grid item xs={12} sm={6} md={6}>
                          <Typography variant="subtitle2">{` ${obj.productData?.detail}`}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={6}>
                          <Autocomplete
                            size="small"
                            fullWidth
                            options={obj.pricingConditionList}
                            autoHighlight
                            value={value[obj.productData?.materialId]}
                            getOptionLabel={(option) => option.conditionName || ''}
                            getOptionSelected={(option, val) => (option ? option.conditionId === val.conditionId : false)}
                            onChange={(_, val) => {
                              setValue((prevState) => ({
                                ...prevState,
                                [`${obj.productData?.materialId}`]: val
                              }));
                            }}
                            renderInput={(params) => <TextField {...params} label={`Select Pricing Condition`} variant="outlined" />}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                ))}
              </>
            )}
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button
              onClick={() => {
                handleSucess([...submitData, ...pricingConditionData.filter((d) => value[d.materialId]?.conditionId === d?.conditionId)]);
              }}
              color="primary"
              size="small"
              variant="contained"
            >
              Apply
            </Button>
          </CustomDialogFooter>
        </Dialog>
      ) : null}
    </>
  );
};

export default CalculatePriceDialog;
