import { useState } from 'react'

import { Box, Button } from '@material-ui/core';
import FaceAttendance from './faceAttendanceDialog';
import TOtpAttendanceDialog from './TOtpAttendanceDialog';
function UserAttendance() {
    const [verificationDialog, setVerificationDialog] = useState({ open: false, type: "" });


    return (
        <section className="main-container-v1">
            <Box width={"100%"} display={"flex"} justifyContent={"center"}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        setVerificationDialog({ open: true, type: "face" })
                    }}>Face Verification</Button>
                <Box ml={2} />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        setVerificationDialog({ open: true, type: "totp" })
                    }}>TOTP Verification</Button>
            </Box>
            {
                verificationDialog.open && verificationDialog.type === "face" && (
                    <FaceAttendance
                        open={verificationDialog.open}
                        onClose={() => {
                            setVerificationDialog({ open: false, type: "" })
                        }}
                    />
                )
            }
            {
                verificationDialog.open && verificationDialog.type === "totp" && (
                    <TOtpAttendanceDialog
                        open={verificationDialog.open}
                        onClose={() => {
                            setVerificationDialog({ open: false, type: "" })
                        }}
                    />
                )
            }
        </section>
    )
}

export default UserAttendance