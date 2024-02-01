import { Dialog } from '@material-ui/core';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import Diagram from '.';

const DiagramDialog = ({ handleClose, referenceId, currentVersion }) => {

    return (
        <Dialog
            open
            aria-labelledby="customized-dialog-title"
            maxWidth="md"
            onClose={(e, reason) => {
                handleClose()
            }}
            fullWidth
            fullScreen
            TransitionComponent={CustomDialogTransition}
        >
            <CustomDialogHeader
                onClose={() => {
                    handleClose()
                }}
                showRequiredLabel={false}
                title={`Drawings`}
            ></CustomDialogHeader>
            <CustomDialogContent>
                <Diagram
                    resource={'workOrder'}
                    referenceId={referenceId}
                    currentVersion={currentVersion || 1} />
            </CustomDialogContent>
        </Dialog>
    );
};

export default DiagramDialog;
