import { Box, Typography } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import moment from 'moment';
import React, { useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import routes from 'src/components/Helpers/Routes';
import { dateFormat } from 'src/constants/helpers';

const style = {
  serviceHead: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '5px',
    '& p': {
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      fontWeight: 500
    },
    '& p:first-of-type': {
      gap: '0',
      fontWeight: 500
    }
  },
  borderBottom: {
    borderBottom: '1px solid rgb(211, 211, 211)'
  },
  serviceItem: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: '5px',
    '&:last-of-type': {
      paddingBottom: 0
    },
    gap: '10px',
    '& p ': {
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    }
  }
};

function ConsumableLogDialog({ onClose, product, consumeLog }) {
  console.log(product, consumeLog);
  const [fullScreen, setFullScreen] = useState(false);
  return (
    <Dialog
      open
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
    >
      <CustomDialogHeader
        title={product.product + ' Request Log'}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />

      <CustomDialogContent>
        {consumeLog?.map((u, index) => {
          return (
            <Box
              mb={2}
              key={index}
              style={{
                cursor: 'pointer',
                backgroundColor: 'white',
                color: 'black',
                border: '1px solid #ebebeb',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <Box p={3}>
                <Box sx={style.serviceHead}>
                  <Typography>
                    Product:{' '}
                    <a className="link text-truncate" href={`${routes.productDetail.path}/${u?.product?.optionValue}`} target="_blank">
                      <span>{u?.product?.optionLabel}</span>
                    </a>
                  </Typography>
                </Box>
                <Box sx={style.serviceItem}>
                  <Typography>Qty: {u?.qty}</Typography>
                </Box>
                <Box sx={style.serviceItem}>
                  <Typography>Status: {u?.status}</Typography>
                </Box>
                <Box sx={style.serviceItem}>
                  <Typography>
                    Requested By:
                    <a className="link text-truncate" href={`${routes.userDetail.path}/${u?.requestBy?.optionValue}`} target="_blank">
                      {u?.requestBy?.optionLabel}
                    </a>
                    on {moment(u?.requestDate)?.format(dateFormat)}
                  </Typography>
                </Box>
                {u?.responseBy && (
                  <Box sx={style.serviceItem}>
                    <Typography>
                      Responsed By:
                      <a className="link text-truncate" href={`${routes.userDetail.path}/${u?.responseBy?.optionValue}`} target="_blank">
                        {u?.responseBy?.optionLabel}
                      </a>
                      on {moment(u?.responseDate)?.format(dateFormat)}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box />
            </Box>
          );
        })}
      </CustomDialogContent>
    </Dialog>
  );
}

export default ConsumableLogDialog;
