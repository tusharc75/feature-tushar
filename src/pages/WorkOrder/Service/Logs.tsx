import { useState, useEffect, useContext } from 'react';
import { Box, Dialog } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import styles from './logs.module.scss';
import { BiRefresh, BiMinus } from 'react-icons/bi';
import { BsCheckLg, BsExclamationLg, BsPlusLg, BsFillSkipEndFill } from 'react-icons/bs';
import moment from 'moment';

const Logs = ({ handleClose, workOrderId = null }) => {
  const {
    state: { selectedEntity }
  }: any = useData();
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

  const fetchData = () => {
    axiosInstance()
      .get(`${routes.workOrder.path}/${workOrderId}/log`)
      .then(({ data: { data } }) => {
        setData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const operations = {
    Start: 'Start',
    Complete: 'Complete',
    Pass: 'Pass',
    Fail: 'Fail',
    valueAdded: 'valueAdded',
    valueUpdated: 'valueUpdated'
  };

  const getIcon = (type: string = 'Fail') => {
    let icon;
    switch (type) {
      default:
        icon = <BsExclamationLg />;
        break;
      case operations.Complete:
        icon = <BsCheckLg />;
        break;
      case operations.Start:
        icon = <BsFillSkipEndFill />;
        break;
      case operations.Pass:
        icon = <BsCheckLg />;
        break;
      case operations.Fail:
        icon = <BsExclamationLg />;
        break;
      case operations.valueAdded:
        icon = <BsPlusLg />;
        break;
      case operations.valueUpdated:
        icon = <BiRefresh />;
    }
    return icon;
  };

  const getIconColor = (type: string = 'Fail') => {
    let color = { '--icon-color': '#D15241', '--icon-bg-color': '#FEE4E0' } as React.CSSProperties;
    switch (type) {
      default:
        color = { '--icon-color': '#D15241', '--icon-bg-color': '#FEE4E0' } as React.CSSProperties;
        break;
      case operations.Complete:
        color = { '--icon-color': '#138A86', '--icon-bg-color': '#E2FBEC' } as React.CSSProperties;
        break;
      case operations.Start:
        color = { '--icon-color': '#138A86', '--icon-bg-color': '#E2FBEC' } as React.CSSProperties;
        break;
      case operations.Pass:
        color = { '--icon-color': '#138A86', '--icon-bg-color': '#E2FBEC' } as React.CSSProperties;
        break;
      case operations.Fail:
        color = { '--icon-color': '#D15241', '--icon-bg-color': '#FEE4E0' } as React.CSSProperties;
        break;
      case operations.valueAdded:
        color = { '--icon-color': '#138A86', '--icon-bg-color': '#E2FBEC' } as React.CSSProperties;
        break;
      case operations.valueUpdated:
        color = { '--icon-color': '#138A86', '--icon-bg-color': '#E2FBEC' } as React.CSSProperties;
    }
    return color;
  };

  const getHeadMessage = (row: any = 'Fail') => {
    let message;
    switch (row?.operation) {
      default:
        message = `<strong>${row.user?.optionLabel}</strong> updated <strong>${row?.service?.optionLabel}</strong> `;
        break;
      case operations.Complete:
        message = `<strong>${row.user?.optionLabel}</strong> <span>Completed</span> <strong>${row?.service?.optionLabel}</strong> <span class=${styles.badgeComplete}>COMPLETE</span>`;
        break;
      case operations.Start:
        message = `<strong>${row.user?.optionLabel}</strong> <span>started</span> <strong>${row?.service?.optionLabel}</strong> `;
        break;
      case operations.Pass:
        message = `<strong>${row.user?.optionLabel}</strong> <span>Passed</span> <strong>${row?.service?.optionLabel}</strong> <span class=${styles.badgePass}>PASS</span>`;
        break;
      case operations.Fail:
        message = `<strong>${row.user?.optionLabel}</strong> <span>Failed</span> <strong>${row?.service?.optionLabel}</strong> <span class=${styles.badgeFail}>FAIL</span>`;
        break;
      case operations.valueAdded:
        message = `<strong>${row.user?.optionLabel}</strong> added new <strong>${row?.service?.optionLabel}</strong> `;
        break;
      case operations.valueUpdated:
        message = `<strong>${row.user?.optionLabel}</strong> updated <strong>${row?.service?.optionLabel}</strong> `;
    }
    return message;
  };

  return (
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={handleClose} aria-labelledby="logs-dialog">
      <CustomDialogHeader title={`Logs`} showManimizeMaximize={false} showRequiredLabel={false} onClose={handleClose} />
      <CustomDialogContent>
        {keys?.length > 0 ? (
          <Box className={styles.main}>
            {keys?.map((key: string) => {
              return (
                <div className={styles.singleGroup}>
                  <Box key={key}>
                    <p className={styles.date}>{moment(key).format('MMM Do YYYY')}</p>
                  </Box>
                  <div className={styles.logContainer}>
                    {rows[key]?.map((row: any) => {
                      const colors = getIconColor(row.operation);
                      return (
                        <div className={styles.singleLog} key={row._id}>
                          <div className={styles.iconContainer} style={colors}>
                            {getIcon(row.operation)}
                          </div>
                          <div className={styles.textContainer}>
                            <h4 className={styles.logHead} dangerouslySetInnerHTML={{ __html: getHeadMessage(row) }} />
                            <p className={styles.logDetails}>
                              {moment(row?.date).format('LT')} <span className={styles.timePassedBadge}>{moment(row?.date).fromNow()}</span>
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
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default Logs;
