import { useState, useEffect, useContext, useReducer } from 'react';
import { Box, Dialog, Typography } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { CheckboxRenderer, CommonRenderer, DateRenderer, DateTimeRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import styles from './logs.module.scss';
import { BiRefresh, BiMinus } from 'react-icons/bi';
import { BsCheckLg, BsExclamationLg, BsPlusLg, BsFillSkipEndFill } from 'react-icons/bs';
import moment from 'moment';

const Logs = ({ handleClose, workOrderId = null }) => {
  // const renderedFrom = `workorder_service_log`;
  const {
    state: { selectedEntity }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;

  useEffect(() => {
    fetchData();
  }, []);

  console.log(dataRows);

  const frameWorkComponent = {
    commonRenderer: CommonRenderer,
    dateTimeRenderer: DateTimeRenderer
  };
  //   const columns = [
  //     { field: 'date', headerName: 'Date', show: true, cellRenderer: 'dateTimeRenderer' },
  //     { field: 'service', headerName: 'Service', show: true, cellRenderer: 'commonRenderer' },
  //     { field: 'operation', headerName: 'Operation', show: true, cellRenderer: 'commonRenderer' }
  //   ];

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes.workOrder.path}/${workOrderId}/log`)
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let res: any = {
            ...prepareDataForGrid(u)
          };
          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: rows.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
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
        message = `<strong>${row.user}</strong> updated <strong>${row?.service}</strong> `;
        break;
      case operations.Complete:
        message = `<strong>${row.user}</strong> <span>Completed</span> <strong>${row?.service}</strong> <span class=${styles.badgeComplete}>COMPLETE</span>`;
        break;
      case operations.Start:
        message = `<strong>${row.user}</strong> <span>started</span> <strong>${row?.service}</strong> `;
        break;
      case operations.Pass:
        message = `<strong>${row.user}</strong> <span>Passed</span> <strong>${row?.service}</strong> <span class=${styles.badgePass}>PASS</span>`;
        break;
      case operations.Fail:
        message = `<strong>${row.user}</strong> <span>Failed</span> <strong>${row?.service}</strong> <span class=${styles.badgeFail}>FAIL</span>`;
        break;
      case operations.valueAdded:
        message = `<strong>${row.user}</strong> added new <strong>${row?.service}</strong> `;
        break;
      case operations.valueUpdated:
        message = `<strong>${row.user}</strong> updated <strong>${row?.service}</strong> `;
    }
    return message;
  };

  return (
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={handleClose} aria-labelledby="logs-dialog">
      <CustomDialogHeader title={`Logs`} showManimizeMaximize={false} showRequiredLabel={false} onClose={handleClose} />
      <CustomDialogContent>
        {frameWorkComponent && Object.keys(frameWorkComponent).length > 0 ? (
          // <CustomAgGrid
          //     columns={columns}
          //     dataRows={dataRows}
          //     frameworkComponents={frameWorkComponent}
          //     setGridApi={setGridApi}
          //     dispatch={dispatch}
          //     rowCount={rowCount}
          //     limit={limit}
          //     pageSizes={pageSizes}
          //     page={page}
          //     allowAction={false}
          //     loading={loading}
          //     allowSelection={true}
          //     showOnlyShowFilteredRecordSwitch={true}
          //     refreshGrid={fetchData}
          //     renderedFrom={renderedFrom}
          //     isClientSideGrid={true}
          // />
          <Box className={styles.main}>
            <Box className={styles.headContainer}>
              <h5 className={styles.sectionHeading}>Work Logs</h5>
            </Box>
            <Box>
              <p className={styles.date}>October 10, 2022</p>
            </Box>
            <div className={styles.logContainer}>
              {dataRows?.map((row: any) => {
                const colors = getIconColor(row.operation);
                return (
                  <div className={styles.singleLog}>
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
