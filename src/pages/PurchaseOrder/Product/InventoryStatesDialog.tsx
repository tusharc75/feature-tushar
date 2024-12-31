import { Box, Button, Dialog, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaEye } from 'react-icons/fa';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, purchaseOrder } from 'src/constants/helpers';
import { useHistory } from 'react-router-dom';
import ManageIrtTicket from 'src/pages/IrtTicket/ManageIrtTicket';
import { useData } from 'src/StateProvider/Provider';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const InventoryStatesDialog = ({ onClose, product, warehouse, data, purchaseOrderData }) => {
  const history = useHistory();
  const [fullScreen, setFullScreen] = useState(true);
  const [irtTicketDialog, setIrtTicketDialog] = useState({ open: false, data: null });
  const [inventoryData, setInventoryData] = useState(null);
  const [irtTicketData, setIrtTicketData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const {
    state: { resources }
  }: any = useData();

  const fetchData = () => {
    axiosInstance()
      .get(`${purchaseOrder.api}/product-stat?product=${product}&warehouse=${warehouse}`)
      .then(({ data: { data } }) => {
        setInventoryData(data);
        let filterById = [];
        filterById.push({ field: 'purchaseOrder', term: purchaseOrderData?._id });
        filterById.push({ field: 'product', term: product });
        axiosInstance()
          .get(`/irt-ticket?filterById=${encodeURIComponent(JSON.stringify(filterById))}&filterType=and`)
          .then(({ data: { data } }) => {
            setIrtTicketData(data?.data);
          });
      });
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      <CustomDialogHeader
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        showRequiredLabel={false}
        title={'Explore Inventory'}
        onClose={onClose}
      />
      <CustomDialogContent isFooterPresent={false}>
        <div className="p-3">
          {inventoryData && irtTicketData ? (
            <TableContainer component={Paper}>
              <Table aria-label="customized table">
                <TableHead>
                  <TableRow>
                    <TableCell>Plant</TableCell>
                    <TableCell>PO Qty</TableCell>
                    <TableCell>Inventory</TableCell>
                    <TableCell>Average Cost</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Inventory Age</TableCell>
                    <TableCell>Contact Person</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryData &&
                    inventoryData?.map((item: any, index: any) => (
                      <TableRow key={index}>
                        <TableCell>{item?.warehouse?.optionLabel}</TableCell>
                        <TableCell>{data?.qty}</TableCell>
                        <TableCell>{item?.qty}</TableCell>
                        <TableCell>{item?.price}</TableCell>
                        <TableCell>{item?.qty * item?.price}</TableCell>
                        <TableCell>{item?.age}</TableCell>
                        <TableCell>{item?.managers?.map((e) => e.optionLabel)?.toString()}</TableCell>
                        <TableCell>
                          {irtTicketData?.find((d) => d.warehouse?.optionValue === item?.warehouse?.optionValue) ? (
                            <ThemeButton 
                              onClick={() => {
                                history.push(
                                  `${routes.irtTicketDetail.path}/${
                                    irtTicketData.find((d) => d.warehouse?.optionValue === item?.warehouse?.optionValue)?._id
                                  }`
                                );
                              }}
                              startIcon={<FaEye />}
                              buttonType='theme'
                            >
                              View
                            </ThemeButton>
                          ) : (
                            <ThemeButton 
                              onClick={() => {
                                setIrtTicketDialog({ open: true, data: item });
                              }}
                              buttonType='theme'
                            >
                              {`Create ${resources?.irtTicket?.titleSingular}`}
                            </ThemeButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </div>
      </CustomDialogContent>
      {irtTicketDialog.open && (
        <ManageIrtTicket
          onClose={() => setIrtTicketDialog({ open: false, data: null })}
          referenceData={{
            purchaseOrder: purchaseOrderData?._id,
            product: product,
            warehouse: irtTicketDialog.data?.warehouse?.optionValue,
            qty: data?.qty > irtTicketDialog.data?.qty ? irtTicketDialog.data?.qty : data?.qty,
            amount:
              data?.qty > irtTicketDialog.data?.qty
                ? irtTicketDialog.data?.qty * irtTicketDialog.data?.price
                : data?.qty * irtTicketDialog.data?.price,
            approver: irtTicketDialog.data?.managers?.map((e) => e.optionValue),
            collaborator: irtTicketDialog.data?.managers?.map((e) => e.optionValue)
          }}
          onSuccess={() => {
            setIrtTicketDialog({ open: false, data: null });
            fetchData();
          }}
        />
      )}
    </Dialog>
  );
};

export default InventoryStatesDialog;
