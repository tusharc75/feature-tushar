import { Box } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { map, uniq } from 'lodash';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { Link } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import routes from '../../../components/Helpers/Routes';
import { CustomDialogTransition, productInventory } from '../../../constants/helpers';

const SoftHoldDialog = ({ close, data, warehouse }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [softHoldData, setSoftHoldData] = useState([]);
  const [tabs, setTabs] = useState([]);

  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    softHoldDataFetch();
  }, []);

  const softHoldDataFetch = () => {
    axiosInstance()
      .get(`${productInventory.api}/soft-hold/${data.productId}?wareHouse=${warehouse}`)
      .then(({ data: { data } }) => {
        var unique = uniq(map(data, 'referenceType'));
        setTabs(unique);
        const result = [];
        data?.forEach((e) => {
          result.push({
            path:
              e.referenceType === 'Sales Order'
                ? routes.salesOrderDetail.path
                : e.referenceType === 'Transfer Inventory'
                ? routes.transferInventoryDetail.path
                : e.referenceType === 'Transfer Asset'
                ? routes.transferAssetDetail.path
                : e.referenceType === 'Work Order'
                ? routes.workOrderDetail.path
                : '',
            ...e
          });
        });
        setSoftHoldData(result);
      });
  };

  return (
    <Dialog
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
      <CustomDialogContent isFooterPresent={false}>
        <CustomTabs value={value} onChange={handleChange}>
          {tabs?.map((row, index) => (
            <CustomTab value={index} label={row} />
          ))}
        </CustomTabs>
        <Box pt={1}>
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
              <TableBody>
                {softHoldData
                  ?.filter((e) => e.referenceType === tabs[value])
                  ?.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        {row?.path === '' ? (
                          row?.reference?.optionLabel
                        ) : (
                          <Link className="link text-truncate" to={`${row?.path}/${row?.reference?.optionValue}`}>
                            {row?.reference?.optionLabel}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell align="right">{row?.qty}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </CustomDialogContent>
    </Dialog>
  );
};

export default SoftHoldDialog;
