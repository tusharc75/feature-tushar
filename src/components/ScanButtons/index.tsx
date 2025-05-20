import { IconButton } from '@mui/material';
import { QrCode, Contactless } from '@mui/icons-material';
import { useState } from 'react';
import { useData } from '../../StateProvider/Provider';
import AssignDialog from './AssignDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const ScanButtons = ({ referenceData, disabled, assignedProducts, setAssignedProducts, fetchData }) => {
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
      <HtmlTooltip title={`Assign ${resources?.serializedAsset?.titlePlural} through QR`}>
        <IconButton color="primary" onClick={() => setRfidQrDialogOpen({ open: true, type: 'qr' })} disabled={disabled}>
          <QrCode />
        </IconButton>
      </HtmlTooltip>
      {rfidQrDialogOpen?.open && (
        <AssignDialog
          selectedProducts={assignedProducts}
          onSuccess={() => {
            setRfidQrDialogOpen({ open: false, type: null });
            fetchData();
            setAssignedProducts([]);
          }}
          onClose={() => {
            setRfidQrDialogOpen({ open: false, type: null });
            setAssignedProducts([]);
          }}
          referenceData={referenceData}
          type={rfidQrDialogOpen?.type}
        />
      )}
    </>
  );
};
export default ScanButtons;
