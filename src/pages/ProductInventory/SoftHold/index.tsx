import { useState, useEffect } from 'react';
import { Box, Button, Grid, Tab, Tabs, TextField, Typography } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import axiosInstance from 'src/axios/axiosInstance';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { Link } from 'react-router-dom'
import routes from "../../../components/Helpers/Routes"
import { productInventory } from "../../../constants/helpers";

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`main-tabpanel-${index}`} aria-labelledby={`main-tab-${index}`} {...other}>
      {children}
    </div>
  );
}

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`
  };
}

const SoftHoldDialog = ({ close, data }) => {

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [softHoldData, setSoftHoldData] = useState([]);
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    softHoldDataFetch();
  }, []);

  const softHoldDataFetch = () => {
    axiosInstance()
      .get(`${productInventory.api}/soft-hold/${data.productId}?wareHouse=${data.plantId}`)
      .then(({ data: { data } }) => {
        const result = []
        data?.forEach((e) => {
          result.push({
            path: e.referenceType === "Sales Order" ? routes.salesOrderDetail.path : routes.transferInventoryDetail.path,
            ...e
          })
        })
        setSoftHoldData(result);
      });
  };

  return (<Dialog
    maxWidth="sm"
    fullScreen={fullScreen || isMobile || isTablet}
    TransitionComponent={CustomDialogTransition}
    aria-labelledby="customized-dialog-title"
    open={true}
    fullWidth
  >
    <CustomDialogHeader
      title={'Soft Hold History'}
      onClose={close}
      isMinimized={!fullScreen}
      onMinimizeMaximize={() => {
        setFullScreen((prevState) => !prevState);
      }}
      showManimizeMaximize={true}
      showRequiredLabel={false}
    ></CustomDialogHeader>
    <CustomDialogContent>
      <Tabs
        textColor="primary"
        TabIndicatorProps={{
          style: {
            display: 'none'
          }
        }}
        value={value}
        onChange={handleChange} >
        {softHoldData?.map((row, index) => (
          <Tab
            className={'tabLayout'}
            style={{
              background: value === index ? 'white' : '',
              color: value === index ? '#163340' : '#163340'
            }}
            label={
              <div className="d-flex align-items-center tab-font">
                {row.referenceType}
              </div>
            } {...a11yProps(index)} />
        ))}
      </Tabs>
      <TabPanel value={value} index={0}>
        <Box p={1}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <span style={{ color: 'black' }}>Reference Number</span>
                  </TableCell>
                  <TableCell align="right">
                    <span style={{ color: 'black' }}>Inventory</span>
                  </TableCell>
                </TableRow>
              </TableHead>
              {softHoldData[value] && <TableBody>
                <TableRow key={"reference"}>
                  <TableCell component="th" scope="row">
                    <Link className="link text-truncate" to={`${softHoldData[value]?.path}/${softHoldData[value]?.reference?.optionValue}`}>
                      {softHoldData[value]?.reference?.optionLabel}
                    </Link>
                  </TableCell>
                  <TableCell align="right">{softHoldData[value]?.qty}</TableCell>
                </TableRow>
              </TableBody>}
            </Table>
          </TableContainer>
        </Box>
      </TabPanel>
    </CustomDialogContent>
  </Dialog>
  );
};

export default SoftHoldDialog;
