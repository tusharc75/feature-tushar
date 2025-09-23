import { Dialog, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { startCase } from 'lodash';
import { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';

const LogDialog = ({ onClose, data }) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
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
        title={`Log - ${data?.user?.optionLabel} (${data?.date})`}
        onClose={onClose}
      />
      <CustomDialogContent isFooterPresent={false}>
        <div className="p-3">
          <TableContainer component={Paper}>
            <Table aria-label="customized table">
              <TableHead>
                <TableRow>
                  <TableCell>Detail</TableCell>
                  <TableCell>Old Value</TableCell>
                  <TableCell>New Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.log && data?.log.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell >{startCase(item?.fieldName)}</TableCell>
                    <TableCell>
                      {item?.oldValue === "" || item?.oldValue === undefined || item?.oldValue === null
                        ? "--"
                        : Array.isArray(item?.oldValue)
                          ? JSON.stringify(item.oldValue)
                          : item?.oldValue}
                    </TableCell>
                    <TableCell>
                      {item?.newValue === "" || item?.newValue === undefined || item?.newValue === null
                        ? "--"
                        : Array.isArray(item?.newValue)
                          ? JSON.stringify(item.newValue)
                          : item?.newValue}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </CustomDialogContent>
    </Dialog>
  );
};

export default LogDialog;
