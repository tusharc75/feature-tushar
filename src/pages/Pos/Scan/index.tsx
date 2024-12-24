import React, { useEffect, useContext, useState, Fragment } from 'react';
import { Box, Button, capitalize, Chip, Dialog, Divider, IconButton, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { useHistory } from 'react-router-dom';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import ImageIcon from '@material-ui/icons/Image';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import { MdAddShoppingCart } from 'react-icons/md';
import { Image } from '@material-ui/icons';

export default function Scan({ onClose, plantId, setAssignCartProductQty }) {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [scanResult, setScanResult] = useState({ open: false, result: null });
  const [searchText, setSearchText] = useState(null);

  const closeDialog = () => {
    setScanResult({ open: false, result: null });
  };

  const fetchProduct = (barcode) => {
    const updatedFilters = [];
    updatedFilters.push({
      field: 'barcode',
      term: barcode
    });
    const deepFilter = `&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    axiosInstance()
      .get(`/pos?warehouse=${plantId}${deepFilter}`)
      .then(({ data: { data, count } }) => {
        if (data?.length === 1) {
          setAssignCartProductQty(data[0]);
          setSearchText(null);
        } else if (data?.length) {
          setScanResult({ open: true, result: data });
          setSearchText(null);
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
        <CustomDialogHeader title={`Scan`} showRequiredLabel={false} onClose={onClose}></CustomDialogHeader>
        <BarcodeScannerComponent
          width="100%"
          height="100%"
          onUpdate={(err, result: any) => {
            if (result && result?.text && result?.text !== searchText) {
              setSearchText(result?.text);
              fetchProduct(result?.text);
            }
          }}
        />
      </Dialog>
      {scanResult.open && (
        <Dialog open fullWidth maxWidth="sm" onClose={closeDialog} fullScreen={false} TransitionComponent={CustomDialogTransition}>
          <CustomDialogHeader title="Scanned Result" onClose={closeDialog} showRequiredLabel={false} showManimizeMaximize={false} />
          <CustomDialogContent>
            {scanResult?.result?.length > 0 ? (
              <List style={{ padding: 0 }}>
                {scanResult?.result?.map((product) => (
                  <ListItem divider key={product._id}>
                    <ListItemAvatar className="mr-3">
                      <Avatar variant="rounded" style={{ height: 80, width: 80 }} src={product?.productImage} alt={product?.productName ?? ''}>
                        <Image style={{ fontSize: 50 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={product?.productName} />
                    <Button
                      variant="outlined"
                      color="primary"
                      size="large"
                      onClick={() => {
                        setAssignCartProductQty(product);
                      }}
                    >
                      <MdAddShoppingCart />
                    </Button>
                  </ListItem>
                ))}
              </List>
            ) : (
              <h2 className="my-3">No Products Found...</h2>
            )}
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button variant="outlined" color="primary" onClick={closeDialog}>
              Close
            </Button>
          </CustomDialogFooter>
        </Dialog>
      )}
    </Fragment>
  );
}
