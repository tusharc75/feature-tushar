import { useState } from 'react';
import { CustomDialogTransition } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import { isMobile, isTablet } from 'react-device-detect';
import {
  Dialog,
  Table,
  TableHead,
  Paper,
  TableContainer,
  TableBody,
  TableCell,
  TableRow,
  IconButton,
} from '@mui/material';
import { useData } from 'src/StateProvider/Provider';
import routes from 'src/components/Helpers/Routes';
import { FiExternalLink } from 'react-icons/fi';

const ShowInventory = ({ data, onClose, productName }) => {
  const {
    state: { resources, user, permissions }
  }: any = useData();

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
        title={`Inventory - ${productName}`}
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
                <TableCell align="left">Qty</TableCell>
                <TableCell align="left">{resources?.warehouse?.titleSingular}</TableCell>
                {user?.user?.brandPolicy?.storageLocation && <TableCell align="left">{resources?.storageLocation?.titleSingular}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((element, index) => (
                <TableRow key={data.id}>
                  <TableCell component="th" scope="row">
                    {index + 1}
                  </TableCell>
                  <TableCell align="left">{element?.qty}</TableCell>
                  <TableCell align="left">
                    {element?.warehouse?.optionLabel}
                    {permissions?.warehouse?.isRead &&
                      <IconButton
                        size="small" onClick={() => { window.open(`${routes.warehouseDetail.path}/${element?.warehouse?.optionValue}`); }}>
                        <FiExternalLink size={16} className="-mt-[2px] ml-1 text-gray-500 dark:text-gray-300" />
                      </IconButton>
                    }
                  </TableCell>
                  {user?.user?.brandPolicy?.storageLocation && <TableCell align="left">
                    {element?.storageLocation?.optionLabel}
                    {permissions?.storageLocation?.isRead &&
                      <IconButton
                        size="small" onClick={() => { window.open(`${routes.storageLocationDetail.path}/${element?.storageLocation?.optionValue}`); }}>
                        <FiExternalLink size={16} className="-mt-[2px] ml-1 text-gray-500 dark:text-gray-300" />
                      </IconButton>
                    }
                  </TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CustomDialogContent>
    </Dialog>
  );
};

export default ShowInventory;
