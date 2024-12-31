import { useRef, useState, useContext } from 'react';
import { Box, Dialog, Stepper, Step, StepLabel, Typography, Divider } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../constants/helpers';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import SignaturePad from 'react-signature-canvas';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import TextField from '@mui/material/TextField';

export default function SignatureDialog(props) {
  const { open, onClose, onSigned, forDelivery, steps, label, submitting } = props;
  const { setToastConfig } = useContext(CustomToastContext);

  const [activeStep, setActiveStep] = useState(0);
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');

  const signCanvas1: any = useRef(null);
  const signCanvas2: any = useRef(null);

  const [loading, setLoading] = useState(false);

  const clearSignCanvas1 = () => signCanvas1.current?.clear();
  const clearSignCanvas2 = () => signCanvas2.current?.clear();

  const handleClickNext = (signCanvas) => {
    const isEmpty = signCanvas.current?.isEmpty();
    if (!isEmpty) {
      let signedData: any = {};
      if (label.includes('Dispatch')) {
        signedData = {
          type: activeStep === 0 ? 'supervisor' : 'deliveryPerson',
          sign: signCanvas.current?.getTrimmedCanvas().toDataURL('image/png')
        };
      } else if (label.includes('Delivery')) {
        signedData = {
          type: activeStep === 0 ? 'deliveryPerson' : 'receiver',
          sign: signCanvas.current?.getTrimmedCanvas().toDataURL('image/png')
        };
      }
      if (forDelivery) {
        signedData.name = activeStep === 0 ? name1 : name2;
      }
      if (label.includes('Customer Sign')) {
        signedData = {
          sign: signCanvas.current?.getTrimmedCanvas().toDataURL('image/png'),
          name: name1 || name2
        };
      }
      onSigned(signedData);
      if (activeStep === 0) {
        setActiveStep((prevStep) => prevStep + 1);
        // clearSignCanvas1()
      }
    } else {
      setToastConfig({ open: true, type: 'warning', message: 'Signature pad cannot be empty!' });
    }
  };

  return (
    <Dialog
      open={open}
      aria-labelledby="customized-dialog-title"
      // maxWidth="sm"
      onClose={() => {
        onClose();
      }}
      fullWidth
      fullScreen={isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
    >
      <CustomDialogHeader
        title={label}
        onClose={() => {
          onClose(false);
        }}
      />
      <CustomDialogContent>
        {forDelivery && (
          <>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Box textAlign="center" my={2}>
              <Typography>Sign Below</Typography>
              <Box mb={2} />
              <Divider />
            </Box>
          </>
        )}
        <div style={{ display: activeStep === 1 ? 'none' : 'block' }} className="bg-white">
          <SignaturePad ref={signCanvas1} canvasProps={{ minWidth: 500, width: 500, height: 400 }} />
        </div>
        <div style={{ display: activeStep === 0 ? 'none' : 'block' }} className="bg-white">
          <SignaturePad ref={signCanvas2} canvasProps={{ minWidth: 500, width: 500, height: 400 }} />
        </div>
        <ThemeButton
          buttonType="transparent"
          onClick={() => {
            activeStep === 0 ? clearSignCanvas1() : clearSignCanvas2();
          }}
          fullWidth
        >
          Clear
        </ThemeButton>
        {forDelivery && (
          <Box pt={2}>
            <TextField
              id="outlined-basic"
              label="Name"
              fullWidth
              margin="dense"
              size="small"
              value={activeStep === 0 ? name1 : name2}
              onChange={(e) => {
                activeStep === 0 ? setName1(e.target.value) : setName2(e.target.value);
              }}
              variant="outlined"
            />
          </Box>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType="transparent" disabled={submitting} onClick={onClose}>
          Close
        </ThemeButton>
        {forDelivery ? (
          <>
            <ThemeButton buttonType="theme" disabled={activeStep === 0 || submitting} onClick={() => setActiveStep((prevStep) => prevStep - 1)}>
              Back
            </ThemeButton>
            <ThemeButton
              buttonType="theme"
              disabled={submitting}
              onClick={() => {
                handleClickNext(activeStep === 0 ? signCanvas1 : signCanvas2);
              }}
            >
              {steps.length > 1 && activeStep === 0 ? 'Next' : 'Submit'}
            </ThemeButton>
          </>
        ) : (
          <ThemeButton
            disabled={loading || signCanvas1.current?.isEmpty()}
            onClick={() => {
              setLoading(true);
              onSigned(signCanvas1.current?.getTrimmedCanvas().toDataURL('image/png'));
            }}
            buttonType="theme"
          >
            {loading ? 'Sending...' : 'Send'}
          </ThemeButton>
        )}
      </CustomDialogFooter>
    </Dialog>
  );
}
