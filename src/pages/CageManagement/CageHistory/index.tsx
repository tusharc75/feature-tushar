import { useState, Fragment, useEffect, useContext } from "react";
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
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, dateTimeFormat } from "../../../constants/helpers";
import moment from "moment";
import ArrowDropDownCircleIcon from '@material-ui/icons/ArrowDropDownCircle';
import HtmlTooltip from "src/components/CustomTooltipTitle";

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
            title={`History`}
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
                <Tab label="History" value={0} aria-controls="a11y-tabpanel-0" id="a11y-tab-0" />
                <Tab label="Logs" value={1} aria-controls="a11y-tabpanel-1" id="a11y-tab-1" />
            </Tabs>
            {tabValue === 0
                && (products?.filter(d => d?.status === true)?.length ?
                    <List style={{ padding: 0 }}>
                        {(products?.filter(d => d?.status === true))?.map((product) => (
                            <ListItem divider key={product._id}>
                                <ListItemAvatar>
                                    <Avatar
                                        src={product?.productDetail?.productImage}
                                        alt={product?.productDetail?.productName ?? ''}
                                    />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Fragment>
                                            <Typography variant="subtitle1"  >
                                                {product?.productDetail?.productName}
                                            </Typography>
                                        </Fragment>
                                    }
                                    secondary={
                                        <Fragment>
                                            <Typography variant="subtitle2"  >
                                                Qty - {product?.qty}
                                            </Typography>
                                            <Typography variant="subtitle2"  >
                                                {`Pick Up Date - ${moment(product?.pickUpDate).format(dateTimeFormat)}`}
                                            </Typography>
                                        </Fragment>
                                    }
                                />
                                <Box display="flex" flexDirection="row"  >
                                    <Box pl={1}>
                                        <HtmlTooltip title="Drop">
                                            <Button
                                                color="secondary"
                                                size="small"
                                                variant="outlined"
                                                onClick={() => { handleDrop(product) }}>
                                                Drop
                                            </Button>
                                        </HtmlTooltip>
                                    </Box>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                    : (
                        <Box p={2}>
                            <Typography>No History</Typography>
                        </Box>
                    ))}
            {tabValue === 1 &&
                (products?.filter(d => d?.status === false)?.length ?
                    <List style={{ padding: 0 }}>
                        {(products?.filter(d => d?.status === false))?.map((product) => (
                            <ListItem divider key={product._id}>
                                <ListItemAvatar>
                                    <Avatar src={product?.productDetail?.productImage} alt={product?.productDetail?.productName ?? ''} />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Fragment>
                                            <Typography variant="subtitle1"  >
                                                {product?.productDetail?.productName}
                                            </Typography>
                                        </Fragment>
                                    }
                                    secondary={
                                        <Fragment>
                                            <Typography variant="subtitle2"  >
                                                Qty - {product?.qty}
                                            </Typography>
                                            <Typography variant="subtitle2"  >
                                                {`Pick Up Date - ${moment(product?.pickUpDate).format(dateTimeFormat)}`}
                                            </Typography>
                                            <Typography variant="subtitle2"  >
                                                {`Drop Date - ${moment(product?.dropDate).format(dateTimeFormat)}`}
                                            </Typography>
                                        </Fragment>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                    : (<Box p={2}>
                        <Typography>No Logs</Typography>
                    </Box>))}
        </CustomDialogContent>
    </Dialog>
    );
};

export default CageHistory;
