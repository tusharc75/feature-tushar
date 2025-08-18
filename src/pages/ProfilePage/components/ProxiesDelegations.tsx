import { FaUserAltSlash, FaUserCheck } from 'react-icons/fa';
import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { useStyles } from 'src/pages/ProfilePage/components/ManageProfile';
import { Link } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import { displayDate } from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import { useContext, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import AddProxyDialog from 'src/pages/ProfilePage/components/AddProxyDialog';
import { PersonAdd } from '@mui/icons-material';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ProxiesDelegations = ({ userData, userProxy, onFetchUserData }) => {
  const classes = useStyles();
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const [showAddProxyDialog, setShowAddProxyDialog] = useState(false);

  const isActiveProxy = (startDate, endDate) => {
    let result = false;
    let parsedCurrentDate = new Date();
    let parsedStartDate = new Date(startDate);
    let parsedEndDate = new Date(endDate);

    if (parsedCurrentDate >= parsedStartDate && parsedCurrentDate <= parsedEndDate) {
      result = true;
    } else {
      result = false;
    }
    return result;
  };

  const handleDeleteProxy = () => {
    axiosInstance()
      .delete('/user/doa/proxy')
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowDeleteConfirmBox(false);
        onFetchUserData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <>
      <Box mb={4} border={1} borderColor="grey.300" borderRadius={2}>
        <div className={'form-head-v1'}>
          <h3 className="form-label-style-v1" title="DOA Proxy">
            DOA Proxy
          </h3>
          <ThemeButton
            startIcon={<PersonAdd fontSize="small" />}
            onClick={() => setShowAddProxyDialog(true)}
            sx={{ fontSize: '0.75rem', minHeight: '28px' }}
          >
            Add DOA Proxy
          </ThemeButton>
        </div>

        {userData?.proxyDOA ? (
          <TableContainer>
            <Table aria-label="DOA Proxy Table" size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <h4 title="assignedTo" className={classes.detailLabel}>
                      Assigned To
                    </h4>
                  </TableCell>

                  <TableCell align="center">
                    <h4 title="startDate" className={classes.detailLabel}>
                      Start Date
                    </h4>
                  </TableCell>

                  <TableCell align="center">
                    <h4 title="endDate" className={classes.detailLabel}>
                      End Date
                    </h4>
                  </TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow key={userData.proxyDOA.user}>
                  <TableCell>
                    <Link className="link" to={`${routes.userDetail.path}/${userData.proxyDOA.optionValue}`}>
                      {userData.proxyDOA.optionLabel}
                    </Link>
                  </TableCell>
                  <TableCell align="center">
                    <span className={classes.dataValue}>{displayDate(userData.proxyDOA.startDate)}</span>
                  </TableCell>
                  <TableCell align="center">
                    <span className={classes.dataValue}>{displayDate(userData.proxyDOA.endDate)}</span>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      edge="end"
                      aria-label="delete"
                      onClick={() => {
                        setShowDeleteConfirmBox(true);
                      }}
                    >
                      <DeleteIcon color="error" fontSize='small' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box textAlign="center" padding={2}>
            <Typography>No proxy is assigned </Typography>
          </Box>
        )}
      </Box>

      <Box mb={4} border={1} borderColor="grey.300" borderRadius={2}>
        <div className={'form-head-v1'}>
          <h3 className="form-label-style-v1" title="DOA Proxy">
            DOA Proxy
          </h3>
        </div>
        {userProxy.length > 0 ? (
          <TableContainer>
            <Table aria-label="Me as a Proxy Table" size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <h4 title="assignedBy" className={classes.detailLabel}>
                      Assigned By
                    </h4>
                  </TableCell>

                  <TableCell align="center">
                    <h4 title="startDate" className={classes.detailLabel}>
                      Start Date
                    </h4>
                  </TableCell>

                  <TableCell align="center">
                    <h4 title="endDate" className={classes.detailLabel}>
                      End Date
                    </h4>
                  </TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userProxy?.map((obj) => (
                  <TableRow key={obj._id}>
                    <TableCell>
                      <Link className="link" to={`${routes.userDetail.path}/${obj._id}`}>{`${obj.firstName} ${obj.lastName}`}</Link>
                    </TableCell>
                    <TableCell align="center">
                      <span className={classes.dataValue}>{displayDate(obj.startDate)}</span>
                    </TableCell>
                    <TableCell align="center">
                      <span className={classes.dataValue}>{displayDate(obj.endDate)}</span>
                    </TableCell>
                    <TableCell align="center">
                      {isActiveProxy(obj.startDate, obj.endDate) ? (
                        <HtmlTooltip title="Active">
                          <IconButton>
                            <FaUserCheck className="text-success" />
                          </IconButton>
                        </HtmlTooltip>
                      ) : (
                        <HtmlTooltip title="Inactive">
                          <IconButton>
                            <FaUserAltSlash className="text-error" />
                          </IconButton>
                        </HtmlTooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box textAlign="center" padding={2}>
            <Typography>No assigned proxy</Typography>
          </Box>
        )}
      </Box>
      {showDeleteConfirmBox ? (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete DOA proxy ?`}
          onClose={() => setShowDeleteConfirmBox(false)}
          onOk={() => {
            handleDeleteProxy()
          }}
        />
      ) : null}
      {showAddProxyDialog && (
        <AddProxyDialog
          open={showAddProxyDialog}
          onClose={() => {
            setShowAddProxyDialog(false);
          }}
          onSuccess={(data) => {
            axiosInstance()
              .post('/user/doa/proxy', data)
              .then(({ data }) => {
                toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
                setShowAddProxyDialog(false);
                onFetchUserData();
              })
              .catch((error) => {
                setShowAddProxyDialog(false);
                toastConfig.setToastConfig(error);
              });
          }}
          userId={userData?._id}
        />
      )}
    </>
  )
}

export default ProxiesDelegations
