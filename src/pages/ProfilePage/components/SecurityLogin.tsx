
import { Box, Typography, Stack } from '@mui/material';
import { useState } from 'react';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import ManageUpdateEmailPasswordDialog from './ManageUpdateEmailAndPassword';
import { useHistory } from 'react-router-dom';
import { SET_USER } from '../../../StateProvider/actionTypes';
import SetUpMfaDialog from 'src/pages/ProfilePage/components/SetUpMfaDialog';
import axiosInstance from 'src/axios/axiosInstance';
import ViewQRCodeDialog from 'src/pages/ProfilePage/components/ViewQRCodeDialog';
import SetUpQRDialog from 'src/pages/ProfilePage/components/SetUpQRDialog';
import FaceLiveNess from 'src/components/FacialLogin/FaceLiveNess';
import { RiDeleteBin6Line } from 'react-icons/ri';

const SecurityLogin = ({ userData, dispatch, onFetchUserData, toastConfig, permissions }) => {
  const history = useHistory();
  const [isPasswordUpdate, setPasswordUpdate] = useState(false);
  const [removeFaceConfirmBox, setRemoveFaceConfirmBox] = useState(false);
  const [addFaceDialog, setAddFaceDialog] = useState(false);
  const [removeMFAConfirmBox, setRemoveMFAConfirmBox] = useState(false);
  const [removingFace, setRemovingFace] = useState(false);
  const [setUpMfaDialog, setSetUpMfaDialog] = useState(false);

  const [setUpQRCodeDialog, setSetUpQRCodeDialog] = useState(false);
  const [viewQRCodeDialog, setViewQRCodeDialog] = useState(false);
  const [changeQRCodeDialog, setChangeQRCodeDialog] = useState(false);
  const [removeQRConfirmBox, setRemoveQRConfirmBox] = useState(false);

  const logoutUser = async () => {
    history.push('/');
    dispatch({ type: SET_USER, payload: null });
    localStorage.removeItem('token');
    history.push('/login');
  };

  const handleRemoveMFA = () => {
    setRemovingFace(true);
    axiosInstance()
      .delete('/user/mfa-setup/remove')
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setRemoveMFAConfirmBox(false);
        onFetchUserData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setRemovingFace(false);
      });
  };

  const handleRemoveQR = () => {
    axiosInstance()
      .delete(`/user/qr-setup/${userData?.qrLoginId}`)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: "QR login removed successfully."
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      }).finally(() => {
        setRemoveQRConfirmBox(false);
        onFetchUserData();
      });
  };

  const handleAddFace = async (sessionId: string) => {
    await axiosInstance()
      .post('/user/face/add', { sessionId })
      .then(({ data }) => {
        setAddFaceDialog(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onFetchUserData();
      })
      .catch((err) => {
        setAddFaceDialog(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleRemoveFace = () => {
    setRemovingFace(true);
    axiosInstance()
      .delete('/user/face/remove')
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setRemoveFaceConfirmBox(false);
        setRemovingFace(false);
        onFetchUserData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setRemovingFace(false);
      });
  };

  return (
    <Box >
      <Box mb={4} border={1} borderColor="grey.300" borderRadius={2} >
        <div className={'form-head-v1'}>
          <h3 className="form-label-style-v1" title="Password Security">
            Password Security
          </h3>
        </div>
        <div className='px-7 py-3'>

          <Typography color="textSecondary" mb={1}>Password</Typography>
          <Box my={2}>
            <ThemeButton onClick={() => setPasswordUpdate(true)}>
              Change Password
            </ThemeButton>
          </Box>
        </div>
      </Box>

      {/* Multi-Factor Authentication */}
      <Box mb={4} border={1} borderColor="grey.300" borderRadius={2}>
        <div className={'form-head-v1'}>
          <h3 className="form-label-style-v1" title="Multi-Factor Authentication">
            Multi-Factor Authentication
          </h3>
        </div>
        <div className='px-7 py-3'>
          <Typography color="textSecondary" mb={1}>Authenticator Apps</Typography>
          <Box my={2}>
            <Stack direction="row" spacing={2}>
              {userData?.isMFASetup ? (
                <ThemeButton buttonType='red' startIcon={<RiDeleteBin6Line />} onClick={() => setRemoveMFAConfirmBox(true)}>
                  Remove MFA
                </ThemeButton>
              ) : (
                <ThemeButton onClick={() => setSetUpMfaDialog(true)}>
                  Setup MFA
                </ThemeButton>
              )}
            </Stack>
          </Box>
        </div>
      </Box>

      {/* QR Code Login */}
      {userData?.brandPolicy?.qRCodeLogin && (
        <Box mb={4} border={1} borderColor="grey.300" borderRadius={2}>
          <div className={'form-head-v1'}>
            <h3 className="form-label-style-v1" title="QR Code Login">
              QR Code Login
            </h3>
          </div>
          <div className='px-7 py-3'>
            <Typography color="textSecondary" mb={1}>QR code login is enabled. Use your mobile device to scan and authenticate.</Typography>
            <Box my={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {userData?.brandPolicy?.qRCodeLogin && (
                  <>
                    {userData?.qrLoginId ? (
                      <>
                        <ThemeButton onClick={() => setViewQRCodeDialog(true)}>
                          View QR Code
                        </ThemeButton>
                        <ThemeButton onClick={() => setChangeQRCodeDialog(true)}>
                          Change QR Pin
                        </ThemeButton>
                        <ThemeButton buttonType='red' startIcon={<RiDeleteBin6Line />} onClick={() => setRemoveQRConfirmBox(true)}>
                          Remove QR Login
                        </ThemeButton>
                      </>
                    ) : (<ThemeButton onClick={() => setSetUpQRCodeDialog(true)}>
                      Setup QR Login
                    </ThemeButton>)}
                  </>
                )}
              </Stack>
            </Box>
          </div>
        </Box >
      )}

      {/* Face ID Authentication */}
      {
        permissions?.payrollPolicy && (
          <Box mb={2} border={1} borderColor="grey.300" borderRadius={2}>
            <div className={'form-head-v1'}>
              <h3 className="form-label-style-v1" title="Face ID Authentication">
                Face ID Authentication
              </h3>
            </div>
            <div className='px-7 py-3'>
              <Typography color="textSecondary" mb={1}>Face ID is configured for quick and secure authentication.</Typography>
              <Box my={2}>
                <Stack direction="row" spacing={2}>
                  {userData?.faceId || userData?.faceData ? (
                    <ThemeButton buttonType='red' startIcon={<RiDeleteBin6Line />} onClick={() => setRemoveFaceConfirmBox(true)}>
                      Remove Face
                    </ThemeButton>
                  ) : (
                    <ThemeButton onClick={() => setAddFaceDialog(true)}>
                      Add Face
                    </ThemeButton>
                  )}
                </Stack>
              </Box>
            </div>
          </Box>
        )
      }

      {
        isPasswordUpdate ? (
          <ManageUpdateEmailPasswordDialog
            isUpdatePassword={true}
            open={isPasswordUpdate}
            onFetchUserData={onFetchUserData}
            onClose={() => setPasswordUpdate(false)}
            logoutUser={logoutUser}
          />
        ) : null
      }

      {/* Multi-Factor Authentication */}
      {
        setUpMfaDialog && (
          <SetUpMfaDialog
            onClose={() => {
              setSetUpMfaDialog(false);
              onFetchUserData();
            }}
          />
        )
      }
      {
        removeMFAConfirmBox ? (
          <ConfirmationDialog
            open={removeMFAConfirmBox}
            message={`Are you sure you want to remove MFA ?`}
            onClose={() => setRemoveMFAConfirmBox(false)}
            onOk={handleRemoveMFA}
            okBtnLoading={removingFace}
          />
        ) : null
      }

      {/* QR Code Login */}
      {
        setUpQRCodeDialog && (
          <SetUpQRDialog
            onClose={() => {
              setSetUpQRCodeDialog(false);
            }}
            onSubmit={() => {
              onFetchUserData();
              setViewQRCodeDialog(true);
            }}
          />
        )
      }
      {
        changeQRCodeDialog && (
          <SetUpQRDialog
            onClose={() => {
              setChangeQRCodeDialog(false);
            }}
            onSubmit={() => {
              onFetchUserData();
            }}
            mode="change"
            qrLoginId={userData?.qrLoginId}
          />
        )
      }
      {
        viewQRCodeDialog && (
          <ViewQRCodeDialog
            onClose={() => setViewQRCodeDialog(false)}
          />
        )
      }
      {
        removeQRConfirmBox && (
          <ConfirmationDialog
            open={removeQRConfirmBox}
            message={`Are you sure you want to remove QR code ?`}
            onClose={() => setRemoveQRConfirmBox(false)}
            onOk={handleRemoveQR}
          />
        )
      }

      {/* Face ID Authentication */}
      {addFaceDialog && <FaceLiveNess onClose={() => setAddFaceDialog(false)} onComplete={handleAddFace} />}
      {
        removeFaceConfirmBox ? (
          <ConfirmationDialog
            open={removeFaceConfirmBox}
            message={`Are you sure you want to remove Face ?`}
            onClose={() => setRemoveFaceConfirmBox(false)}
            onOk={handleRemoveFace}
            okBtnLoading={removingFace}
          />
        ) : null
      }

    </Box >
  );
};

export default SecurityLogin;
