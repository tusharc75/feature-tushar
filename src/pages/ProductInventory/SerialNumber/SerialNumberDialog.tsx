import { useState, useEffect } from 'react';
import { Box, Button, Grid, Tab, Tabs, TextField, Typography } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, productInventory } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import History from './index';
import axiosInstance from 'src/axios/axiosInstance';
import AddSerialNumber from './AddSerialNumber';


const SerialNumberDialog = ({ close, product, warehouse }) => {


    const [serialNumberCount, setSerialNumberCount] = useState(0);
    const [addserialNumber, setAddserialNumber] = useState(false);
    const [refresh, setRefresh] = useState(true);

    useEffect(() => {
        if (warehouse) {
            fetchRecords()
        }
    }, []);

    const fetchRecords = () => {
        axiosInstance()
            .get(`${productInventory.api}/product/${product}?warehouse=${warehouse}`)
            .then(({ data: { data } }) => {
                const count = (data?.inventory - (data?.softHold || 0)) - data?.serialNumber
                if (count > 0) {
                    setSerialNumberCount(count)
                }
                else {
                    setSerialNumberCount(0)
                }
            })
            .catch((err) => {
            });
    };

    return (<Dialog
        fullScreen
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
    >
        <CustomDialogHeader
            title={'Serial Number'}
            onClose={close}
            showRequiredLabel={false}
        ></CustomDialogHeader>
        <CustomDialogContent>
            {serialNumberCount ?
                <Box>
                    <Button
                        variant='contained'
                        color="primary"
                        size="small"
                        onClick={() => { setAddserialNumber(true) }}
                        aria-controls="action-menu"
                    >
                        Add Serial Number
                    </Button>
                </Box>
                : null
            }
            {refresh ? <History product={product} warehouse={warehouse} /> : null}
        </CustomDialogContent>
        {addserialNumber &&
            <AddSerialNumber
                product={product}
                warehouse={warehouse}
                serialNumberCount={serialNumberCount}
                handleClose={() => setAddserialNumber(false)}
                handleSucess={() => {
                    setAddserialNumber(false)
                    fetchRecords()
                    setRefresh(false)
                    setRefresh(true)
                }}
            />
        }
    </Dialog>
    );
};

export default SerialNumberDialog;
