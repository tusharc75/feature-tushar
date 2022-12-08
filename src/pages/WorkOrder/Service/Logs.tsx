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
import { FaUser as UserIcon } from 'react-icons/fa';
import { MdBolt } from 'react-icons/md';

const Logs = ({ handleClose, workOrderId = null, serviceID, serviceName }) => {
  const {
    state: { selectedEntity }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [data, setData] = useState(null);
  const [rows, setRows] = useState(null);
  const [keys, setKeys] = useState(null);

  // console.log(rows);

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
    axiosInstance()
      .get(`${routes.workOrder.path}/${workOrderId}/log`)
      .then(({ data: { data } }) => {
        setData(data.filter((item) => item.service?.optionValue === serviceID || item.operation === 'consumed'));
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

  const operations = {
    start: 'Start',
    completed: 'Completed',
    passed: 'Passed',
    failed: 'Failed',
    valueAdded: 'valueAdded',
    valueUpdated: 'valueUpdated',
    consumed: 'consumed'
  };

  const getIcon = (type: string = 'Fail') => {
    let icon;
    switch (type) {
      default:
        icon = <BsExclamationLg />;
        break;
      case operations.completed:
        icon = <BsCheckLg />;
        break;
      case operations.start:
        icon = <BsFillSkipEndFill />;
        break;
      case operations.passed:
        icon = <BsCheckLg />;
        break;
      case operations.failed:
        icon = <BsExclamationLg />;
        break;
      case operations.valueAdded:
        icon = <BsPlusLg />;
        break;
      case operations.valueUpdated:
        icon = <BiRefresh />;
        break;
      case operations.consumed:
        icon = <MdBolt />;
        break;
    }
    return icon;
  };

  const getIconColor = (type: string = 'Fail') => {
    let color = { '--icon-color': '#D15241', '--icon-bg-color': '#FEE4E0' } as React.CSSProperties;
    switch (type) {
      default:
        color = { '--icon-color': '#D15241', '--icon-bg-color': '#FEE4E0' } as React.CSSProperties;
        break;
      case operations.completed:
        color = { '--icon-color': '#138A86', '--icon-bg-color': '#E2FBEC' } as React.CSSProperties;
        break;
      case operations.start:
        color = { '--icon-color': '#138A86', '--icon-bg-color': '#E2FBEC' } as React.CSSProperties;
        break;
      case operations.passed:
        color = { '--icon-color': '#138A86', '--icon-bg-color': '#E2FBEC' } as React.CSSProperties;
        break;
      case operations.failed:
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
    const serviceName = row?.service?.optionLabel ? row?.service?.optionLabel : '';
    const stepName = row?.step?.optionLabel ? row?.step?.optionLabel + ' from' : '';
    const consumedProd = row?.data?.products?.map((item) => item.productName);

    switch (row?.operation) {
      default:
        message = `<span>Updated value</span> ${stepName} ${serviceName}`;
        break;
      case operations.completed:
        message = `<span>Completed</span> ${stepName} ${serviceName}`;
        break;
      case operations.start:
        message = `<span>Started</span> ${stepName} ${serviceName}`;
        break;
      case operations.passed:
        message = `<span>Passed</span> ${stepName} ${serviceName}`;
        break;
      case operations.failed:
        message = `<span>Failed</span> ${stepName} ${serviceName}`;
        break;
      case operations.valueAdded:
        message = `<span>Added value</span> ${stepName} ${serviceName}`;
        break;
      case operations.consumed:
        message = `<span>Consumed</span> <br><strong>Products: </strong>${consumedProd.join(', ')}`;
        break;
      case operations.valueUpdated:
        message = `<span>Updated value</span> ${stepName} ${serviceName}`;
        break;
    }
    return message;
  };

  return (
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={handleClose} aria-labelledby="logs-dialog">
      <CustomDialogHeader
        title={`${serviceName ? serviceName : ''} Logs`}
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
                        const colors = getIconColor(row.operation);
                        return (
                          <div className={styles.singleLog} key={row._id}>
                            <div className={styles.iconContainer} style={colors}>
                              {getIcon(row.operation)}
                            </div>
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
            <h5>No log found.</h5>
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

export default Logs;
