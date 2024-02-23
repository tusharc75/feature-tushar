import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { Link } from 'react-router-dom';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { Edit } from "@material-ui/icons";
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { editDisable, deleteDisable } from 'src/constants/messageHelpers';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { ListingPageHeader } from 'src/components/PageHeaders';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import ManageData from './ManageData';

let searchTimeout;

const DataList = () => {
  const renderedFrom = camelCase(routes?.dataList.title);
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isEdit: false, idToEdit: null });
  const [renderCount, setRenderCount] = useState(0);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    const columns = [
      {
        accessor: 'Title',
        Header: 'Title',
        width: 120,
        Cell: ({ row }) => (
          <div>
            <Link className="link" to={`${routes.dataListitems.path}/${row?.original?._id}`}>
              {row?.original?.Title}
            </Link>
          </div>
        )
        // Cell: ({ row }) => (row?.original?.Title ? <p className="text-truncate">{row?.original?.Title}</p> : <NoDataCell />)
      }
    ];
    setColumns([...columns, ActionsRenderer]);
  };


  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 130,
    width: 130,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.payrollPolicy?.isCreate ? 'Edit' : editDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Edit"
              disabled={permissions?.dataLists?.isCreate ? false : true}
              onClick={() => {
                setShowManageDialog({ open: true, isEdit: true, idToEdit: row.original._id });
              }}
            >
              <Edit style={{ width: 18, height: 18, marginLeft: 14 }} />
            </IconButton>
          </span>
        </HtmlTooltip>

        <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    if (renderCount > 0) {
      let millisec = Object.keys(search).length > 0 ? 600 : 5;
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      searchTimeout = setTimeout(() => {
        fetchData();
      }, millisec);
    }
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchData();
    } else {
      setRenderCount(renderCount + 1);
    }
  }, [page, limit, filters, sorting, showFilteredRecordsOnly]);



  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${routes?.dataList?.path}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.dataLists?.isUpdate;
          finalObject['canDelete'] = permissions?.dataLists?.isDelete;
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${routes?.dataList?.path}/remove`, { _id: ids })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={!((selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) === selectedRecords?.length)}
          onClick={() => {
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
        <CustomBreadCrumbs routes={[routes.dataList]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          isActionButtonVisible={permissions?.dataLists?.isDelete}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonProps={{ disabled: !permissions?.dataLists.isCreate }}
          addButtonOnclick={() => {
            setShowManageDialog({ open: true, isEdit: false, idToEdit: null });
          }}
          isAddButtonVisible={true}
        />

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            isClientSideGrid={true}
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
          message={`Are you sure you want to delete ${routes?.dataList?.title} ${deleteRecord?.title || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}

      {showManageDialog.open && (
        <ManageData
          isEdit={showManageDialog.isEdit}
          id={showManageDialog.idToEdit}
          onClose={() => setShowManageDialog({ open: false, isEdit: false, idToEdit: null })}
          onSuccess={() => {
            fetchData();
            setShowManageDialog({ open: false, isEdit: false, idToEdit: null });
          }}
        />
      )}
    </section>
  );
};

export default DataList;
