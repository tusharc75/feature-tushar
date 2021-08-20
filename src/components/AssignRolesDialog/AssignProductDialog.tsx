import { useState, useEffect, useContext } from "react";
import {
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    FormControl,
    FormControlLabel,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
} from "@material-ui/core";
import CustomDialogContent from "../CustomDialog/CustomDialogContent";
import CustomDialogHeader from "../CustomDialog/CustomDialogHeader";
import Loader from "../Loader";
import CustomDialogFooter from "../CustomDialog/CustomDialogFooter";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import SearchBox from "../Helpers/SearchBox";

const AssignProductDialog = ({
    productsDialogOpen,
    productId,
    onSuccess,
    handleCloseDialog,
    assignedProducts
}) => {
    const toastConfig = useContext(CustomToastContext);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isAssigning, setAssigning] = useState(false);
    const [search, setSearch] = useState("");
    const [productsConst, setProductsConst] = useState([]);

    useEffect(() => {
        setLoadingProducts(true);
        axiosInstance()
            .get(`/product`)
            .then(({ data: { data } }) => {
                setProducts(data.filter(product => !assignedProducts.some(item => item?._id === product?._id)).map(obj => ({ ...obj, isChecked: false })))
                setProductsConst(data.filter(product => !assignedProducts.some(item => item?._id === product?._id)).map(obj => ({ ...obj, isChecked: false })))
                setLoadingProducts(false);
            })
            .catch((error) => {
                setLoadingProducts(false);
                toastConfig.setToastConfig(error);
            });
        // eslint-disable-next-line
    }, []);


    const handleAssignProduct = async () => {
        if (selectedProducts.length) {
            setAssigning(true);

            const dataObj = {
                "_id": productId,
                "frequentlyBoughtTogether": selectedProducts
            };

            await axiosInstance()
                .put(`/product/frequent`, dataObj)
                .then(({ data }) => {
                    setAssigning(false);
                    toastConfig.setToastConfig({
                        message: data.message,
                        type: "success",
                        open: true,
                    });

                    onSuccess();
                })
                .catch((error) => {
                    setAssigning(false);
                    toastConfig.setToastConfig(error);
                });
        }
    };

    const handleSearch = (e) => {
        let value = e.target.value;
        setSearch(value);
        let result = [];
        result = productsConst.filter((data) => {
            return data.concatedName.toLowerCase().search(value.toLowerCase()) != -1 || data.email.toLowerCase().search(value.toLowerCase()) != -1;
        });
        setProducts(result)
    };

    return (
        <Dialog
            fullWidth
            maxWidth="xs"
            open={productsDialogOpen}
            onClose={handleCloseDialog}
            aria-labelledby="assign-roles-dialog"
        >
            <CustomDialogHeader title="Assign products" />
            <CustomDialogContent>
                {loadingProducts ? (
                    <Loader text="Loading products" />
                ) : productsConst.length ? (
                    <>
                        <List style={{ padding: 0 }}>
                            <ListItem divider>
                                <Grid container>
                                    <Grid item xs={12} md={6} sm={6} className="d-flex align-items-center gap-1">
                                        <FormControl component="fieldset">
                                            {/* <FormControlLabel
                        value="top"
                        className="m-0"
                        control={
                          <Checkbox
                            edge="start"
                            onChange={(e) => {
                              products.forEach((product) => product.isChecked = e.target.checked)
                              setSelectedProducts(products.filter(r => r.isChecked).map(obj => obj._id))
                            }
                            }
                            checked={products.every(x => x.isChecked)}
                            inputProps={{
                              "aria-labelledby": `checkbox-list-label-select-all`,
                            }}
                          />}
                        label="Select all products"
                      /> */}
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={6} sm={6} className="d-flex align-items-center gap-1">
                                        <SearchBox
                                            onSearch={handleSearch}
                                            searchbox="terms_header_search_bar"
                                            width="300px"
                                            value={search}
                                        />
                                    </Grid>
                                </Grid>
                            </ListItem>

                            {products.map((product) => (
                                <ListItem divider key={product._id}>
                                    <ListItemIcon>
                                        <Checkbox
                                            edge="start"
                                            onChange={(e) => {
                                                product.isChecked = e.target.checked
                                                if (products.filter(r => r.isChecked).length > 3) {
                                                    products.find(r => r._id === selectedProducts[0]).isChecked = false
                                                }
                                                setSelectedProducts(products.filter(r => r.isChecked).map(obj => obj._id))

                                            }
                                            }
                                            checked={product.isChecked}
                                            inputProps={{
                                                "aria-labelledby": `checkbox-list-label-${product._id}`,
                                            }}
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={product.productName}
                                        secondary={product.mrp}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </>
                ) : (
                    <Typography>All products has been assigned</Typography>
                )}
            </CustomDialogContent>
            <CustomDialogFooter>
                <Button
                    disabled={isAssigning}
                    onClick={handleCloseDialog}
                    color="primary"
                    size="small"
                >
                    Cancel
                </Button>
                <Button
                    disabled={!selectedProducts.length || isAssigning}
                    onClick={handleAssignProduct}
                    color="primary"
                    size="small"
                    variant="contained"
                >
                    {isAssigning ? <CircularProgress size={22} /> : "Save"}
                </Button>
            </CustomDialogFooter>
        </Dialog>
    );
};

export default AssignProductDialog;
