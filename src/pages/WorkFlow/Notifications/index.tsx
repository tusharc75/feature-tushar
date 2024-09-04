import { Box, Button, Divider, Typography } from '@material-ui/core';
import { Fragment, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import AddNotificationDialog from 'src/pages/WorkFlow/Notifications/AddNotificationDialog';

const NOTIF_TYPE = {
  activationNotification: 'Activation Notification',
  stoppedNotification: 'Stopped Notification',
  completedNotification: 'Completed Notification'
};

const Notifications = ({ resource, id }) => {
  const toastConfig = useContext(CustomToastContext);
  const [open, setOpen] = useState({ open: false, type: '', data: null });
  const [notificationData, setNotificationData] = useState(null);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setNotifLoading(true);
    axiosInstance()
      .get(`${routes.workflow.path}/${id}/notifications`)
      .then(({ data: { data } }) => {
        setNotificationData(data);
        setNotifLoading(false);
      })
      .catch((error) => {
        setNotifLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      {!notifLoading ? (
        <Box className="conditions-container flex flex-col gap-1 sm:mb-3 sm:p-3 md:mb-2 md:p-2">
          <Box p={1} px={1} display={'flex'} flexDirection={'column'} mt={1} borderRadius={'5px'}>
            <Box className="mb-5">
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => {
                  setOpen({ open: true, type: NOTIF_TYPE.activationNotification, data: notificationData.activationNotification });
                }}
              >
                Activation Notification
              </Button>
            </Box>
            <Typography variant="body2">{getNotiUser(notificationData?.activationNotification, NOTIF_TYPE.activationNotification)}</Typography>
          </Box>
          <Divider />
          <Box p={1} px={1} display={'flex'} flexDirection={'column'} mt={1} borderRadius={'5px'}>
            <Box className="mb-5">
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => {
                  setOpen({ open: true, type: NOTIF_TYPE.stoppedNotification, data: notificationData.stoppedNotification });
                }}
              >
                Stopped Notification
              </Button>
            </Box>
            <Typography variant="body2">{getNotiUser(notificationData?.stoppedNotification, NOTIF_TYPE.stoppedNotification)}</Typography>
          </Box>
          <Divider />
          <Box p={1} px={1} display={'flex'} flexDirection={'column'} mt={1} borderRadius={'5px'}>
            <Box className="mb-5">
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => {
                  setOpen({ open: true, type: NOTIF_TYPE.completedNotification, data: notificationData.completedNotification });
                }}
              >
                Completed Notification
              </Button>
            </Box>
            <Typography variant="body2">{getNotiUser(notificationData?.completedNotification, NOTIF_TYPE.completedNotification)}</Typography>
          </Box>
        </Box>
      ) : (
        <Box p={2}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

      {open.open && (
        <AddNotificationDialog
          data={open.data}
          type={open.type}
          onClose={() => {
            setOpen({ open: false, type: '', data: null });
          }}
          onSuccess={() => {
            fetchData();
            setOpen({ open: false, type: '', data: null });
          }}
          id={id}
        />
      )}
    </Fragment>
  );
};

export default Notifications;

const getNotiUser = (data, key) => {
  let str1 = '';
  let str2 = '';
  if (!data || !data?.ids?.length) return <span></span>;
  const { ids, type } = data;
  if (type) {
    str1 += type === 'Users' ? `${key} will be sent to users - ` : `${key} will be sent to users associated with these roles - `;
  }
  if (ids && ids.length > 0) {
    str2 = ids.map((v, i) => (
      <span key={v.optionValue}>
        <a
          className="link text-truncate"
          href={`${routes[`${type === 'Roles' ? 'roleDetail' : 'userDetail'}`].path}/${v.optionValue}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {v.optionLabel}
        </a>
        {i < ids.length - 1 && ', '}
      </span>
    ));
  }
  return (
    <span>
      {str1}
      {str2}
    </span>
  );
};
