import { useEffect, useState, useContext } from "react";
import {
    Dialog,
    Button,
    CircularProgress,
    Grid,
    useTheme,
    useMediaQuery,
    Box,
    TextField,
} from "@material-ui/core";
import { Autocomplete, Skeleton } from "@material-ui/lab";
import axiosInstance from "../../axios/axiosInstance";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { useHistory } from "react-router-dom";
import { getObjKeys, yupSchema, isFieldNotTouched, setFieldsInAscendingOrder, getObjKeysWithValues, cycleCountPhysicalInventory } from "../../constants/helpers";
import { useData } from '../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";


const ManageCycleCountPInventory = ({ open, close, onSuccess }) => {
    const theme = useTheme();
    const [isSubmitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [optionsArray, setOptionsArray] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState({ inventoryCycle: null, user: null, productCategory: null, warehouse: null, });

    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const history = useHistory();
    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, permissions }
    }: any = useData();


    useEffect(() => {
        fetchDropdownData()
    }, []);

    const fetchDropdownData = () => {
        setLoading(true);
        axiosInstance()
            .get(`/sa-formbuilder/lookup?lookupResource=Product Category,User,Warehouse,Inventory Cycle`)
            .then(({ data: { data } }) => {
                if (data) {
                    setOptionsArray(data);
                }
                setLoading(false);
            })
            .catch((err) => {
                setLoading(false);
            });
    };

    const handleSubmit = () => {
        setSubmitting(true);
        axiosInstance().post(cycleCountPhysicalInventory.api, {
            warehouse: selectedOptions?.warehouse?.optionValue,
            productCategory: selectedOptions?.productCategory?.optionValue,
            inventoryCycle: selectedOptions?.inventoryCycle?.optionValue,
            user: selectedOptions?.user?.optionValue,
        })
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                });
                onSuccess()
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);

            });

    };

    return (
        <Dialog
            open={open}
            onClose={close}
            maxWidth="md"
            fullWidth
            fullScreen={fullScreen || (isMobile || isTablet)}
        >
            <CustomDialogHeader title={"Create Cycle Count Physical Inventory"}
                onClose={close}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                    setFullScreen(prevState => !prevState)
                }}
                showManimizeMaximize={true}
            />

            {loading ?
                <Box p={2} height={500} bgcolor="white">
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
                : (
                    <>
                        <CustomDialogContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={6}>
                                    <Autocomplete
                                        options={optionsArray["Inventory Cycle"]}
                                        getOptionLabel={(option) => option.optionLabel}
                                        value={selectedOptions?.inventoryCycle?.optionLabel}
                                        fullWidth
                                        onChange={(event, newValue) => {
                                            selectedOptions["inventoryCycle"] = newValue
                                            setSelectedOptions(selectedOptions);
                                        }}
                                        size="small"
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Inventory Cycle"
                                                variant="outlined"
                                                required
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={6}>
                                    <Autocomplete
                                        options={optionsArray["User"]}
                                        getOptionLabel={(option) => option.optionLabel}
                                        value={selectedOptions?.user?.optionLabel}
                                        fullWidth
                                        onChange={(event, newValue) => {
                                            selectedOptions["user"] = newValue
                                            setSelectedOptions(selectedOptions);
                                        }}
                                        size="small"
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Users"
                                                variant="outlined"
                                                required
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={6}>
                                    <Autocomplete
                                        options={optionsArray["Product Category"]}
                                        getOptionLabel={(option) => option.optionLabel}
                                        value={selectedOptions?.productCategory?.optionLabel}
                                        fullWidth
                                        onChange={(event, newValue) => {
                                            selectedOptions["productCategory"] = newValue
                                            setSelectedOptions(selectedOptions);
                                        }}
                                        size="small"
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Product Category"
                                                variant="outlined"
                                                required
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={6}>
                                    <Autocomplete
                                        options={optionsArray["Warehouse"]}
                                        getOptionLabel={(option) => option.optionLabel}
                                        value={selectedOptions?.warehouse?.optionLabel}
                                        fullWidth
                                        onChange={(event, newValue) => {
                                            selectedOptions["warehouse"] = newValue
                                            setSelectedOptions(selectedOptions);
                                        }}
                                        size="small"
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Warehouse"
                                                variant="outlined"
                                                required
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button size="small" variant="outlined" color="primary" onClick={close}>
                                Cancel
                            </Button>
                            <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit} >
                                {"Submit"}
                            </Button>
                        </CustomDialogFooter>
                    </>
                )}
        </Dialog>
    );
};

export default ManageCycleCountPInventory;
