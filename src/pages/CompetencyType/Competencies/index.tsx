import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import ManageCompetencies from 'src/pages/Competencies/ManageCompetencies';

const Competencies = ({ competencyType }) => {
  let renderedFrom = camelCase(sidebarResource.competencies);

  const toastConfig = useContext(CustomToastContext);
  const [openDialog, setOpenDialog] = useState({ open: false, id: null });
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.competencies}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes.competenciesDetail.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${routes.competencies.path}${queryString}`)
      .then(({ data: { data } }) => {
        let count = data?.count;
        let rows = data?.data?.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.competencies?.isUpdate;
          finalObject['canDelete'] = permissions?.competencies?.isDelete;
          let res = {
            ...finalObject
          };
          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (isExport) {
      deepFilter = `?`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    filterByIds.push({ field: 'competencyType', term: competencyType });

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${routes.competencies.path}/remove`, { ids: ids })
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setDeleteRecord(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
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
        {permissions?.competencies?.isCreate && (
          <HtmlTooltip title="Edit">
            <IconButton
              size="small"
              aria-label="Edit"
              onClick={() => {
                setOpenDialog({ open: true, id: row?.original._id });
              }}
            >
              <EditIcon color="primary" fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        )}
        {permissions?.competencies?.isDelete && (
          <HtmlTooltip title="Delete">
            <IconButton
              size="small"
              aria-label="Delete"
              onClick={() => {
                setDeleteRecord(row?.original);
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

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            if (selectedRecords.length === 1) {
              setDeleteRecord(selectedRecords[0]);
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
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={permissions?.competencies?.isCreate}
        addButtonProps={{
          onClick: () => {
            setOpenDialog({ open: true, id: null });
          }
        }}
        isActionButtonVisible={permissions?.competencies?.isDelete}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: selectedRecords.length === 0 }}
        hasXpadding={false}
      />

      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          resource={sidebarResource.competencies}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {openDialog.open && (
        <ManageCompetencies
          id={openDialog.id}
          isClone={false}
          onClose={() => setOpenDialog({ open: false, id: null })}
          onSuccess={() => {
            setOpenDialog({ open: false, id: null });
            fetchData();
          }}
          referenceData={{ competencyType: competencyType }}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${resources?.competencies?.titleSingular?.toLowerCase()} ${deleteRecord?.competencyName || ''} ? `}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </Fragment>
  );
};

export default Competencies;
