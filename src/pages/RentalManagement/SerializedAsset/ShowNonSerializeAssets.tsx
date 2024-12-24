import { useState } from 'react';
import { CustomDialogTransition } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import { isMobile, isTablet } from 'react-device-detect';
import routes from 'src/components/Helpers/Routes';
import {
  Dialog,
  Box,
  Button,
  Link,
  TextField,
  Table,
  TableHead,
  Paper,
  TableContainer,
  TableBody,
  TableCell,
  TableRow,
  Typography
} from '@mui/material';

const ShowNonSerializeAssets = ({ data, onClose, title }) => {
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
        title={`${title} - ${data?.productName}`}
        onClose={() => {
          onClose();
        }}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        showRequiredLabel={false}
      ></CustomDialogHeader>
      <CustomDialogContent isFooterPresent={false}>
        <TableContainer component={Paper}>
          <Table aria-label="customized table">
            <TableHead>
              <TableRow>
                <TableCell>Index</TableCell>
                <TableCell align="left">Serial Number</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.data?.map((element, index) => (
                <TableRow key={data.id}>
                  <TableCell component="th" scope="row">
                    {index + 1}
                  </TableCell>
                  <TableCell align="left">{element?.assetNumber}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CustomDialogContent>
    </Dialog>
  );
};

export default ShowNonSerializeAssets;
