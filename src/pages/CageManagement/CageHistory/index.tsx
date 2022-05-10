import { useState, useEffect, useContext } from "react";
import {
    Avatar,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemIcon,
    ListItemText,
    Typography,
    Box,
    Tab,
    Tabs
} from "@material-ui/core";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import { isMobile, isTablet } from 'react-device-detect';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import { CustomDialogTransition, dateFormat } from "../../../constants/helpers";
import moment from "moment";

const CageHistory = ({ handleCloseDialog, fetchHistory, products, handleDrop }) => {

    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [tabValue, setTabValue] = useState(0);
    const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setTabValue(newValue);
    };
    return (<Dialog
        fullWidth
        fullScreen={fullScreen || (isMobile || isTablet)}
        maxWidth="md"
        TransitionComponent={CustomDialogTransition}
        open={true}
        onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
                handleCloseDialog()
            }
        }}
        aria-labelledby="assign-roles-dialog"
    >
        <CustomDialogHeader
            title={`History (${products?.length})`}
            showRequiredLabel={false}
            onClose={handleCloseDialog}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
                setFullScreen(prevState => !prevState)
            }}
            showManimizeMaximize={true}
        />
        <CustomDialogContent>
            <Tabs
                variant="scrollable"
                scrollButtons="auto"
                className="oms-tab"
                value={tabValue}
                onChange={handleMainTabChange}
                indicatorColor="primary"
                textColor="primary"
                aria-label="Product Details Tab"
                TabIndicatorProps={{
                    style: {
                        height: 0
                    }
                }}
            >
                <Tab label="Pick Up" value={0} aria-controls="a11y-tabpanel-0" id="a11y-tab-0" />
                <Tab label="History" value={1} aria-controls="a11y-tabpanel-1" id="a11y-tab-1" />
            </Tabs>
            {tabValue === 0 && (products?.filter(d => d?.dropDate === undefined || d?.dropDate === null)?.length ?
                <List style={{ padding: 0 }}>
                    {products?.filter(d => d?.dropDate === undefined || d?.dropDate === null).map((product) => (
                        <ListItem divider key={product._id}>
                            <ListItemAvatar>
                                <Avatar
                                    src={product?.productDetail?.productImage}
                                    alt={product?.productDetail?.productName ?? ''}
                                />
                            </ListItemAvatar>
                            <ListItemText
                                primary={product?.productDetail?.productName}
                                secondary={`Pick Up Date - ${moment(product?.pickUpDate).format(dateFormat)}`} />
                            <Box display="flex" flexDirection="row"  >
                                <IconButton
                                    disabled
                                    size="small">
                                    <Box pl={1} pr={1}>
                                        {`${product?.qty}`}
                                    </Box>
                                </IconButton>
                                <Box pl={1}>
                                    <IconButton
                                        style={{ border: "1px solid", color: "red" }}
                                        color="secondary"
                                        size="small"
                                        onClick={() => { handleDrop(product) }}>
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        </ListItem>
                    ))}
                </List>
                : (
                    <Typography>No Products</Typography>
                ))}
            {tabValue === 1 && (products?.length ?
                <List style={{ padding: 0 }}>
                    {products?.map((product) => (
                        <ListItem divider key={product._id}>
                            <ListItemAvatar>
                                <Avatar
                                    src={product?.productDetail?.productImage}
                                    alt={product?.productDetail?.productName ?? ''}
                                />
                            </ListItemAvatar>
                            <ListItemText
                                primary={product?.productDetail?.productName}
                                secondary={`Pick Up Date - ${moment(product?.pickUpDate).format(dateFormat)} ${product?.dropDate !== undefined ? '  Drop Date - ' + moment(product?.dropDate).format(dateFormat) : ''}`} />
                            <Box display="flex" flexDirection="row"  >
                                <IconButton
                                    disabled
                                    size="small">
                                    <Box pl={1} pr={1}>
                                        {`${product?.qty}`}
                                    </Box>
                                </IconButton>
                            </Box>
                        </ListItem>
                    ))}
                </List>
                : (
                    <Typography>No Products</Typography>
                ))}
        </CustomDialogContent>
        <CustomDialogFooter>
            {/* {(products?.length > 0) &&
                <Button
                    onClick={() => { }}
                    color="primary"
                    size="small"
                    variant="contained"
                >
                    {"Place your order"}
                </Button>
            } */}
        </CustomDialogFooter>
    </Dialog>
    );
};

export default CageHistory;
