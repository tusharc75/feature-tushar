import { useState, useEffect, useContext } from 'react';
import { Box, Dialog } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import styles from './logs.module.scss';
import moment from 'moment';
import { FaUser as UserIcon } from 'react-icons/fa';

const Comments = ({ handleClose, workOrderId, serviceId, uniqueId, serviceName,stepId }) => {

  const toastConfig = useContext(CustomToastContext);
  const [data, setData] = useState(null);
  const [rows, setRows] = useState(null);
  const [keys, setKeys] = useState(null);


  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const groupedData = group(data);
    if (groupedData) {
      const allKeys = Object.keys(groupedData);
      setKeys(allKeys);
    }
    setRows(groupedData);
  }, [data]);

  const fetchData = () => {
    let url = `${routes.workOrder.path}/${workOrderId}/comment?uniqueId=${uniqueId}`;
    if (stepId) {
      url += `&stepId=${stepId}`;
    }
    
    axiosInstance()
      .get(url)
      .then(({ data: { data } }) => {
        if (data && data?.length) {
          setData(data);
        }
        else {
          setData([])
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const group = (data: any) => {
    const groups = data?.reduce((data1, data2) => {
      const date = data2.date.split('T')[0];
      if (!data1[date]) {
        data1[date] = [];
      }
      data1[date].push(data2);
      return data1;
    }, {});
    return groups;
  };

  const getHeadMessage = (row: any) => {
    let message = `<span>${row.comment}</span>`;
    return message;
  };

  return (
    
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={handleClose} aria-labelledby="comments-dialog">
      <CustomDialogHeader
        title={`${serviceName ? serviceName : ''} Comments`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={handleClose}
        style={{ textTransform: 'capitalize' }}
      />
      <CustomDialogContent>
        {keys ? (
          keys?.length > 0 ? (
            <Box className={styles.main}>
              {keys?.map((key: string) => {
                return (
                  <div className={styles.singleGroup}>
                    <Box key={key}>
                      <p className={styles.date}>{moment(key).format('MMM Do YYYY')}</p>
                    </Box>
                    <div className={styles.logContainer}>
                      {rows[key]?.map((row: any) => {
                        return (
                          <div className={styles.singleLog} key={row._id}>
                            
                            <div className={styles.textContainer}>
                              <h4 className={styles.logHead} dangerouslySetInnerHTML={{ __html: getHeadMessage(row) }} />
                              <p className={styles.logDetails}>
                                {moment(row?.date).format('LT')}
                                <span> {moment(row?.date).fromNow()}</span>
                                <span className={styles.timePassedBadge}>
                                  <UserIcon style={{ marginRight: '5px' }} />
                                  {row?.user?.optionLabel}
                                </span>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </Box>
          ) : (
            <h5>No Comments found.</h5>
          )
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default Comments;