import React from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';
import { Grid, useTheme, useMediaQuery, Button, Box } from '@material-ui/core';
import { camelCase, startCase } from 'lodash';
import axios from 'axios';
import moment from 'moment';
import { MdDescription, MdChevronLeft } from 'react-icons/md';
import styles from 'src/pages/Leads/Header.module.scss';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';

import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import CustomContainer from 'src/components/CustomContainer';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import useColumns, { getStaticFields, getFrameworkComponents } from 'src/constants/useColumns';
import { prepareDataForGrid, gridLoadingTimeout, downloadExcel, primaryFields, sidebarResource, isObjectEmpty } from 'src/constants/helpers';
import Loader from 'src/components/Loader';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { DateRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import ManageScheduleReport from './ManageScheduleReport';

const ScheduleReport = () => {
  const theme = useTheme();
  const [isExporting, setIsExporting] = React.useState(false);
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const initialRender = React.useRef(true);
  const toastConfig = React.useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity }
  } = useData();
  let { resource } = useParams();
  let history = useHistory();
  const renderedFrom = 'schedule-report';

  const [openManageDialog, setOpenManageDialog] = React.useState(false);

  // Grid Configs
  const [frameWorkComponent, setFrameWorkComponent] = React.useState({});
  const { getColumnData } = useColumns();
  const [columns, setColumns] = React.useState([
    {
      field: 'scheduleName',
      headerName: 'Schedule Name',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      primaryField: true
    },
    {
      field: 'resource',
      headerName: 'Resource',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      primaryField: false
    },
    {
      field: 'reportName',
      headerName: 'Report Name',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      primaryField: false
    },
    {
      field: 'filters',
      headerName: 'Filters',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      primaryField: false
    },
    {
      field: 'columns',
      headerName: 'Columns',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      primaryField: false
    },
    {
      field: 'subscribeUsers',
      headerName: 'Subscribe Users',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      primaryField: false
    },
    {
      field: 'frequency',
      headerName: 'Frequency',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      primaryField: false
    },
    {
      field: 'day',
      headerName: 'Day',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      primaryField: false
    },
    {
      field: 'time',
      headerName: 'Time',
      show: true,
      disabled: false,
      cellRenderer: 'commonRenderer',
      primaryField: false
    },
    {
      field: 'createdBy',
      headerName: 'Created By',
      show: true,
      disabled: false,
      cellRenderer: 'dateRenderer',
      primaryField: false
    },
    {
      field: 'updatedBy',
      headerName: 'Updated By',
      show: true,
      disabled: false,
      cellRenderer: 'dateRenderer',
      primaryField: false
    }
  ]);
  const [gridApi, setGridApi] = React.useState(null);
  const [state, dispatch] = React.useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, sorting, search, limit, filters, pageSizes } = state;

  React.useEffect(() => {
    fetchResourceData();
  }, []);

  //Export Data
  const exportData = () => {};

  const fetchResourceData = async () => {
    const {
      data: { data }
    } = await axiosInstance().get(`schedule-report`);

    console.log(data);
  };
  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <div>
        <Grid container className="headerbox">
          <Grid item xs={10}>
            <CustomBreadCrumbs
              routes={[
                { title: 'Reports', path: '/reports' },
                { title: 'Schedule Report', path: '' }
              ]}
            />
          </Grid>

          <Grid item xs={2}>
            <Grid container direction="row">
              <Grid item xs={12} sm={12}>
                <Grid container justifyContent="flex-end">
                  <div id="importExportLinks" style={{ minWidth: 80 }}>
                    <span
                      aria-disabled={isExporting}
                      onClick={exportData}
                      className={`${isExporting ? 'cursor-stop' : 'cursor-pointer'} mr-2 setLink`}
                      style={{ color: theme.palette.info.light }}
                    >
                      Export All
                    </span>
                  </div>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <CustomContainer>
          <div className="header-panel">
            <Grid container className={styles.filter_side_container}>
              <Grid item xs={4} className="d-flex align-items-center gap-1 layout-for-tablet">
                <Box display="flex" justifyContent="center" alignItems="center">
                  <MdDescription size={22} className="headerLogo" />
                  <span className="listingHeader">Schedule Report</span>
                </Box>
              </Grid>
              <Grid item xs={8}>
                <Box display="flex" alignItems="center" justifyContent="flex-end">
                  <Box mr={1}>
                    <Button onClick={() => setOpenManageDialog(true)} variant="contained" size="small" color="primary">
                      Add
                    </Button>
                  </Box>
                  <Box>
                    <Button variant="outlined" size="small" color="primary">
                      Actions
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <div>
              {columns ? (
                isSmall ? (
                  <CustomSwipableList
                    allowSelection={false}
                    allowSwipe={false}
                    permissions={permissions?.reports}
                    primaryField={columns?.find((d) => d.primaryField)}
                    onClick={(data) => {
                      //   history.push(`${routes[resourceCamelCase].path}/detail/${data._id}`);
                    }}
                    selectedRecords={[]}
                    dataRows={dataRows}
                    dispatch={dispatch}
                    onEdit={() => {}}
                    extraParamsToCheckDelete={false}
                    rowCount={rowCount}
                    page={page}
                    loading={loading}
                    chips={columns
                      .filter((col) => col.hasOwnProperty('cellRendererParams'))
                      .map((col) => ({
                        field: col.field,
                        label: col.headerName
                      }))}
                    additionalDetails={[]}
                    owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
                    onCreate={false}
                    showClone={false}
                    onDelete={(data) => {}}
                    onClone={(data) => {}}
                    renderedFrom={routes.transferAsset?.title}
                  />
                ) : (
                  <CustomAgGrid
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameWorkComponent}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    actionWidth={100}
                    loading={loading}
                    renderedFrom={renderedFrom}
                    allowSelection={false}
                    allowAction={false}
                    refreshGrid={fetchResourceData}
                    showOnlyShowFilteredRecordSwitch={false}
                  />
                )
              ) : (
                <Loader text={'Loading Data...'} style={{ marginTop: '15vh' }} />
              )}
            </div>
          </div>
        </CustomContainer>
      </div>

      <React.Fragment>{openManageDialog && <ManageScheduleReport handleClose={() => setOpenManageDialog(false)} />}</React.Fragment>
    </MuiPickersUtilsProvider>
  );
};

export default ScheduleReport;
