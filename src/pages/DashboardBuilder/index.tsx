import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useContext, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { gridLoadingTimeout, prepareDataForGrid } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { baseURL } from './builderHelpers';
import axios, { CancelTokenSource } from 'axios';

const DashBoards = () => {
  const renderedFrom = 'dashboard-builder';
  const toastConfig = useContext(CustomToastContext);

  const history = useHistory();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [search, page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    const columns = [
      {
        accessor: 'name',
        Header: 'Dashboard Name',
        width: 200,
        primaryField: true,
        Cell: ({ row }) => (
          <div>
            <Link className="link" to={`dashboard-master/${row?.original?._id}`}>
              {row.original.name}
            </Link>
          </div>
        )
      },
      ...getStaticFields(),
      ActionsRenderer
    ];
    setColumns(columns);
  };
  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    disableSortBy: true,
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        {permissions?.dashboardMaster?.isCreate ? (
          <HtmlTooltip title="Clone">
            <IconButton size="small" aria-label="Clone" onClick={() => history.push(`dashboard-master/${row?.original._id}?type=clone`)}>
              <FileCopyIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
        ) : (
          <HtmlTooltip className="cursor-stop" title="You do not have permission to clone/create">
            <IconButton aria-label="Clone" size="small">
              <FileCopyIcon fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        )}
        {permissions?.dashboardMaster?.isDelete && (
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
        )}
      </>
    )
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .get(`${baseURL}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['isChecked'] = false;
          finalObject['allowedToEdit'] = permissions?.dashboardMaster?.isUpdate;
          finalObject['canDelete'] = permissions?.dashboardMaster?.isDelete;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
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
      .put(`${baseURL}/remove`, { ids: ids })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={!((selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) === selectedRecords?.length)}
          onClick={() => {
            if (selectedRecords.length === 1) {
              setDeleteRecord(selectedRecords[0]);
            } else {
              setDeleteRecord(null);
            }
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords?.length})`}
        </MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: resources?.dashboardMaster?.titlePlural }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          isActionButtonVisible={permissions?.dashboardMaster?.isDelete}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => history.push(`dashboard-master/new`)}
          isAddButtonVisible={permissions?.dashboardMaster?.isCreate}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchData}
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
          message={`Are you sure you want to delete ${
            deleteRecord
              ? `${resources?.dashboardMaster?.titleSingular?.toLowerCase()} :
            ${deleteRecord?.name}`
              : `selected ${resources?.dashboardMaster?.titlePlural?.toLowerCase()}`
          } ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={handleDelete}
        />
      )}
    </section>
  );
};

export default DashBoards;
