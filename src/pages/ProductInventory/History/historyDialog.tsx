import { useState, useEffect } from 'react';
import { Box, Button, Grid, Tab, Tabs, TextField, Typography } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import History from './index';


const HistoryDialog = ({ close, product, warehouse }) => {

    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    return (<Dialog
        fullScreen
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
    >
        <CustomDialogHeader
            title={'History'}
            onClose={close}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            showRequiredLabel={false}
        ></CustomDialogHeader>
        <CustomDialogContent>
            <History product={product} warehouse={warehouse} />
        </CustomDialogContent>
    </Dialog>
    );
};

export default HistoryDialog;
