import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Theme,
  Typography
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Image } from '@mui/icons-material';
import { cloneDeep } from 'lodash';
import { useContext, useState } from 'react';
import { HiOutlinePencilAlt, HiPencil } from 'react-icons/hi';
import { IoMdTrash } from 'react-icons/io';
import { useHistory } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import { SET_USER } from '../../../StateProvider/actionTypes';
import axiosInstance from '../../../axios/axiosInstance';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../../components/Shared/DetailsPage';
import UpdateDetailsDialog from '../../../components/Shared/UpdateDetailsDialog';
import { imageUploadMaxSize } from '../../../constants/helpers';
import styles from '../profilePage.module.scss';
import ManageUpdateEmailPasswordDialog from '../components/ManageUpdateEmailAndPassword';


export const useStyles = makeStyles((theme: Theme) => ({
  profileEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    background: theme.palette.primary.main,
    padding: '1px',
    color: 'var(--dark-primary, white)',
    border: '3px solid white',
    borderRadius: '50%'
  },
  profileDelete: {
    position: 'absolute',
    right: '-16px',
    top: '42px',
    background: theme.palette.error.main,
    color: 'white',
    border: '3px solid white',
    borderRadius: '50%'
  },
  dataValue: {
    fontWeight: 500,
    color: theme.palette.primary.main
  },
  detailLabel: {
    fontSize: '0.8rem',
    fontWeight: 'normal',
    color: '#656464'
  }
}));

export default function ManageProfile(props) {
  const classes = useStyles();
  const { displayUserDetails, displayUserProfileImage, userFields, userData, loading, userLoading, onFetchUserData, otherDetails } = props;
  const {
    state: { user },
    dispatch
  }: any = useData();
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [isEmailUpdate, setEmailUpdate] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };

  const handleUpdateUser = (values) => {
    if (userData?._id) {
      setUpdating(true);
      let clonedValues = cloneDeep(values);
      axiosInstance()
        .put(`/user/me`, clonedValues)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          onFetchUserData();
          let updatedUserDetails = { ...user, user: { ...user.user, ...values } };
          dispatch({ type: SET_USER, payload: updatedUserDetails });
          setUpdating(false);
          closeUpdateDialog();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setUpdating(false);
        });
    }
  };

  const getImageUrl = (file) => {
    let formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    axiosInstance()
      .post('/user/upload-public', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then(({ data }) => {
        let values = {
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatar: data.fileUrl
        };
        handleUpdateUser({ ...values });
        setUploading(false);
      })
      .catch((err) => {
        setUploading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const logoutUser = async () => {
    history.push('/');
    dispatch({ type: SET_USER, payload: null });
    localStorage.removeItem('token');
    history.push('/login');
  };

  const handleUploadImage = (event) => {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[0];
      if (file.size > imageUploadMaxSize.size) {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: `Image must be less than ${imageUploadMaxSize.text} size`
        });
      } else {
        getImageUrl(file);
      }
    }
  };


  const handleDeleteProfilePic = () => {
    let values = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      avatar: ''
    };
    handleUpdateUser({ ...values });
    setShowDeleteConfirmBox(false);
  };

  let filteredUserFields =
    userFields && userFields.length
      ? userFields.filter((field) => field?.fieldData?.sectionName !== 'Profile Image' && field?.fieldData?.fieldName !== 'reportsTo')
      : [];


  return (
    <>
      {displayUserProfileImage ? (
        <div className={styles.userDetail}>
          <div className={styles.profileAvatarContainer}>
            <>
              <Box display="flex" flexDirection="row">
                <Box position="relative">
                  <Avatar src={userData?.avatar} style={{ width: 100, height: 100 }} alt={userData?.firstName ?? ''}>
                    <Image style={{ fontSize: 60 }} />
                  </Avatar>
                  <Box title={userData?.avatar ?? 'No picture selected'} display="flex" justifyContent="center" alignItems="center">
                    {isUploading && <CircularProgress size={22} />}
                  </Box>
                  {userData?.avatar ? (
                    <div className={classes.profileDelete}>
                      <IconButton
                        disabled={Boolean(!userData?.avatar)}
                        title="Remove picture"
                        size="small"
                        aria-label="delete picture"
                        component="span"
                        onClick={() => setShowDeleteConfirmBox(true)}
                      >
                        <IoMdTrash color="white" size={15} />
                      </IconButton>
                    </div>
                  ) : null}
                  <div className={classes.profileEdit}>
                    <label htmlFor="avatar">
                      <IconButton title="Add picture" size="small" aria-label="upload picture" component="span">
                        <HiPencil color="var(--dark-primary, white)" size={15} />
                        <input
                          disabled={isUploading}
                          id="avatar"
                          name="avatar"
                          onChange={handleUploadImage}
                          accept="image/x-png,image/gif,image/jpeg"
                          style={{
                            opacity: '0',
                            position: 'absolute',
                            zIndex: -1
                          }}
                          onClick={(e: any) => (e.target.value = null)}
                          type="file"
                        />
                      </IconButton>
                    </label>
                  </div>
                </Box>
              </Box>
            </>
          </div>
          <Typography variant="h5" className="text-capitalize">
            <strong>{`${userData?.firstName ?? ''} ${userData?.lastName ?? ''}`}</strong>
          </Typography>
          <Divider />
          <div>
            {otherDetails &&
              Object.keys(otherDetails).map((k, i) => (
                <span key={i} className="d-flex align-items-center gap-1">
                  {k === 'EmployeeNumber' && otherDetails[k] ? <span>Employee No : {otherDetails[k]}</span> : null}
                  {k === 'Email' && otherDetails[k] ? (
                    <>
                      {' '}
                      <span
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={`Email : ${otherDetails[k]}`}
                      >
                        {' '}
                        Email : {otherDetails[k]}
                      </span>{' '}
                      <IconButton
                        size={'small'}
                        style={{ minWidth: 18, padding: 2, cursor: 'pointer', display: 'block' }}
                        onClick={() => setEmailUpdate(true)}
                      >
                        <HiPencil />
                      </IconButton>
                    </>
                  ) : null}
                </span>
              ))}
          </div>
        </div>
      ) : null}
      <div style={{ borderRadius: 8, minWidth: '300px' }}>
        {displayUserDetails ? (
          <Box style={{ position: 'relative' }}>
            <IconButton
              onClick={handleOpenUpdateDialog}
              style={{ position: 'absolute', zIndex: 2, right: '0', padding: '4px', margin: '8px', marginRight: '22px' }}
            >
              <HtmlTooltip title="Edit">
                <HiOutlinePencilAlt color="primary" />
              </HtmlTooltip>
            </IconButton>
            <Box mb={2}>
              {loading || userLoading ? (
                <div className="p-2">
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </div>
              ) : !userFields.length ? (
                <Typography>No Data Found</Typography>
              ) : (
                <DetailsPage data={userData} fields={filteredUserFields} />
              )}
            </Box>
          </Box>
        ) : null}
        {isEmailUpdate ? (
          <ManageUpdateEmailPasswordDialog
            isUpdateEmail={true}
            userData={userData}
            open={isEmailUpdate}
            onFetchUserData={onFetchUserData}
            onClose={() => setEmailUpdate(false)}
            logoutUser={logoutUser}
          />
        ) : null}
        {showDeleteConfirmBox ? (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to remove profile picture ?`}
            onClose={() => setShowDeleteConfirmBox(false)}
            onOk={() => {
              handleDeleteProfilePic();
            }}
          />
        ) : null}
      </div>
      {openUpdateDialog && (
        <UpdateDetailsDialog
          title="Update"
          openDialog={openUpdateDialog}
          onClose={closeUpdateDialog}
          data={userData}
          fields={filteredUserFields}
          isUpdating={isUpdating}
          handleUpdate={handleUpdateUser}
        />
      )}
    </>
  );
}
