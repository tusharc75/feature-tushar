import { AddOutlined, ExpandMore } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, IconButton, Menu, MenuItem } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import { camelCase, startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import CustomReactTable, { getStaticFields, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { gridLoadingTimeout, prepareDataForGrid } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import ManageCustomReport from './ManageCustomReport';

const CustomReport = () => {
  const renderedFrom = 'custom-report';

  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  const {
    state: { selectedEntity, resources }
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
          <div>
            <p
              className="text-truncate link"
              onClick={() => {
                setShowManageDialog({ open: true, id: row?.original?._id });
              }}
            >
              {row.original.customReportName}
            </p>
          </div>
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
            <DeleteIcon color="error" fontSize="small" />
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
          finalObject.resource = resources[camelCase(finalObject.resource)]?.titleSingular
            ? resources[camelCase(finalObject.resource)]?.titleSingular
            : finalObject.resource;
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
    axiosInstance().put(`custom-report/remove`, { ids: ids }).then(({ data }) => {
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
    }).catch((error) => {
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
                <ThemeButton
                  mobileTooltip="Add"
                  iconForMobile={<AddOutlined />}
                  onClick={() => {
                    setShowManageDialog({ open: true, id: null });
                  }}
                  startIcon={<AddOutlined />}
                >
                  Add
                </ThemeButton>
                <ThemeButton
                  mobileTooltip="Actions"
                  buttonType="yellow"
                  iconForMobile={<ExpandMore />}
                  onClick={openActions}
                  endIcon={<ExpandMore />}
                  disabled={selectedRecords?.length ? false : true}
                >
                  Actions
                </ThemeButton>
                <Menu
                  anchorEl={anchorEl}
                  keepMounted
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
                      if (selectedRecords.length === 1) {
                        setDeleteRecord(selectedRecords[0]);
                      } else {
                        setDeleteRecord(null);
                      }
                      closeActions();
                      setShowDeleteConfirmBox(true);
                    }}
                  >
                    {`Delete (${selectedRecords?.length})`}
                  </MenuItem>
                </Menu>
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
          message={`Are you sure you want to delete ${deleteRecord ? `${deleteRecord?.customReportName || ''}` : `selected records`} ?`}
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
  );
};

export default CustomReport;
