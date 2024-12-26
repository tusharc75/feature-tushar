import { Avatar, Box, Button, Dialog, List, ListItem, ListItemAvatar, ListItemText, Typography } from '@mui/material';
import { Fragment, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomDialogTransition, displayDateTime } from '../../../constants/helpers';
import { Image } from '@mui/icons-material';

const CageHistory = ({ handleCloseDialog, fetchHistory, products, handleDrop }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [tabValue, setTabValue] = useState(0);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleCloseDialog();
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
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <CustomDialogContent isFooterPresent={false}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>History</CustomTab>
          <CustomTab value={1}>Logs</CustomTab>
        </CustomTabs>
        <TabPanel index={tabValue} value={0}>
          {tabValue === 0 &&
            (products?.filter((d) => d?.status === true)?.length ? (
              <List style={{ padding: 0 }}>
                {products
                  ?.filter((d) => d?.status === true)
                  ?.map((product) => (
                    <ListItem divider key={product._id}>
                      <ListItemAvatar>
                        <Avatar src={product?.productDetail?.productImage} alt={product?.productDetail?.productName ?? ''}>
                          <Image style={{ fontSize: 24 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Fragment>
                            <Typography variant="subtitle1">{product?.productDetail?.productName}</Typography>
                          </Fragment>
                        }
                        secondary={
                          <Fragment>
                            <Typography variant="subtitle2">Qty - {product?.qty}</Typography>
                            <Typography variant="subtitle2">{`Pick Up Date - ${displayDateTime(product?.pickUpDate)}`}</Typography>
                          </Fragment>
                        }
                      />
                      <Box display="flex" flexDirection="row">
                        <Box pl={1}>
                          <HtmlTooltip title="Drop">
                            <Button
                              color="secondary"
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                handleDrop(product);
                              }}
                            >
                              Drop
                            </Button>
                          </HtmlTooltip>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
              </List>
            ) : (
              <Box p={2}>
                <Typography>No History</Typography>
              </Box>
            ))}
        </TabPanel>
        <TabPanel index={tabValue} value={1}>
          {tabValue === 1 &&
            (products?.filter((d) => d?.status === false)?.length ? (
              <List style={{ padding: 0 }}>
                {products
                  ?.filter((d) => d?.status === false)
                  ?.map((product) => (
                    <ListItem divider key={product._id}>
                      <ListItemAvatar>
                        <Avatar src={product?.productDetail?.productImage} alt={product?.productDetail?.productName ?? ''}>
                          <Image style={{ fontSize: 24 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Fragment>
                            <Typography variant="subtitle1">{product?.productDetail?.productName}</Typography>
                          </Fragment>
                        }
                        secondary={
                          <Fragment>
                            <Typography variant="subtitle2">Qty - {product?.qty}</Typography>
                            <Typography variant="subtitle2">{`Pick Up Date - ${displayDateTime(product?.pickUpDate)}`}</Typography>
                            <Typography variant="subtitle2">{`Drop Date - ${displayDateTime(product?.dropDate)}`}</Typography>
                          </Fragment>
                        }
                      />
                    </ListItem>
                  ))}
              </List>
            ) : (
              <Box p={2}>
                <Typography>No Logs</Typography>
              </Box>
            ))}
        </TabPanel>
      </CustomDialogContent>
    </Dialog>
  );
};

export default CageHistory;
