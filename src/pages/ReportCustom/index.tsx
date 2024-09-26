import { Button, IconButton } from '@material-ui/core';
import { isMobile } from 'react-device-detect';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { camelCase, startCase } from 'lodash';
import CustomReactTable, { getStaticFields, useTableReducer } from 'src/components/CustomReactTable';
import ManageCustomReport from './ManageCustomReport';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { Menu, MenuItem, Box } from '@material-ui/core';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import axios, { CancelTokenSource } from 'axios';

const renderedFrom = 'custom-report';

const CustomReport = () => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, id: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const [columns, setColumns] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [selectedEntity]);

  const fetchGridColumns = () => {
    let columns = [
      {
        accessor: 'customReportName',
        Header: 'Custom Report Name',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <p
            className="text-truncate link"
            onClick={() => {
              setShowManageDialog({ open: true, id: row?.original?._id });
            }}
          >
            {row.original.customReportName}
          </p>
        )
      },
      {
        accessor: 'resource',
        Header: 'Report',
        width: 120,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.resource}</p>
      },
      ...getStaticFields(),
      ActionsRenderer
    ];
    setColumns(columns);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(row.original);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon color="error" />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`custom-report`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        let count = data?.length;
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject.resource = routes[camelCase(finalObject.resource)] ? routes[camelCase(finalObject.resource)]?.title : finalObject.resource;
          finalObject.column = finalObject.column
            ?.split(',')
            ?.map((s: string) => startCase(s))
            ?.join(', ');
          finalObject.filters = finalObject.filters.length > 0 ? finalObject?.filters?.map((item) => startCase(item.term)) : [];
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const handleDelete = () => {
    setIsSubmitting(true);
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    axiosInstance()
      .put(`custom-report/remove`, { ids: ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          type: 'success',
          message: data.message,
          open: true
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <section className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs
            routes={[
              { title: 'Reports', path: '/reports' },
              { title: 'Custom Report', path: '' }
            ]}
          />
        </div>
        <CustomContainer>
          <div className="header-panel">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className={'align-items-center flex w-full justify-between gap-1'}></div>
              <div className="flex flex-wrap justify-end gap-[8px]">
                <div className="flex flex-wrap items-center gap-[8px]">
                  <Button
                    variant={'contained'}
                    color="primary"
                    size="small"
                    className={`no-shadow`}
                    onClick={() => {
                      setShowManageDialog({ open: true, id: null });
                    }}
                    startIcon={<AddOutlined />}
                  >
                    Add
                  </Button>

                  <>
                    <Button
                      variant={'outlined'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      className={`new-dropdown-v1`}
                      aria-controls="action-menu"
                      endIcon={<ExpandMore />}
                      disabled={selectedRecords?.length ? false : true}
                    >
                      Actions
                    </Button>
                    <Menu
                      anchorEl={anchorEl}
                      keepMounted
                      getContentAnchorEl={null}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                      }}
                      id="action-menu"
                      open={Boolean(anchorEl)}
                      onClose={closeActions}
                    >
                      <MenuItem
                        onClick={() => {
                          closeActions();
                          setShowDeleteConfirmBox(true);
                        }}
                      >
                        {`Delete (${selectedRecords?.length})`}
                      </MenuItem>
                    </Menu>
                  </>
                </div>
              </div>
            </div>
          </div>
          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              isClientSideGrid={true}
              showOnlyShowFilteredRecordSwitch={false}
              showFilters={false}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </CustomContainer>
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete custom report ${deleteRecord?.customReportName || ''} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            okBtnLoading={isSubmitting}
            onOk={handleDelete}
          />
        )}
        {showManageDialog.open && (
          <ManageCustomReport
            id={showManageDialog.id}
            handleClose={() => setShowManageDialog({ open: false, id: null })}
            onSuccess={() => {
              fetchData();
              setShowManageDialog({ open: false, id: null });
            }}
          />
        )}
      </section>
    </MuiPickersUtilsProvider>
  );
};

export default CustomReport;
