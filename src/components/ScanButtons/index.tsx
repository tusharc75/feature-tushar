import { IconButton } from '@mui/material';
import { QrCode, Contactless } from '@mui/icons-material';
import { useState } from 'react';
import { useData } from '../../StateProvider/Provider';
import AssignDialog from './AssignDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const ScanButtons = ({ referenceData, disabled, products, fetchData }) => {
  const {
    state: { resources }
  }: any = useData();

  const [rfidQrDialogOpen, setRfidQrDialogOpen] = useState({ open: false, type: null });

  return (
    <>
      <HtmlTooltip title={`Assign ${resources?.serializedAsset?.titlePlural} through RFID`}>
        <IconButton color="primary" onClick={() => setRfidQrDialogOpen({ open: true, type: 'rfid' })} disabled={disabled}>
          <Contactless />
        </IconButton>
      </HtmlTooltip>
      <HtmlTooltip title={`Assign ${resources?.serializedAsset?.titlePlural} through QR/Barcode`}>
        <IconButton color="primary" onClick={() => setRfidQrDialogOpen({ open: true, type: 'qr' })} disabled={disabled}>
          <QrCode />
        </IconButton>
      </HtmlTooltip>
      {rfidQrDialogOpen?.open && (
        <AssignDialog
          selectedProducts={products}
          onSuccess={() => {
            setRfidQrDialogOpen({ open: false, type: null });
            fetchData();
          }}
          onClose={() => {
            setRfidQrDialogOpen({ open: false, type: null });
          }}
          referenceData={referenceData}
          type={rfidQrDialogOpen?.type}
        />
      )}
    </>
  );
};
export default ScanButtons;
