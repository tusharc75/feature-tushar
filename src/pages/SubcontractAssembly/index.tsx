import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import axios, { CancelTokenSource } from 'axios';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import { createAddItemStepdata, useSetWalkmeData } from 'src/components/CustomIntro';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { checkIsAllowedToDelete, getDefaultMyRecordType, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import ManageSubcontractAssembly from 'src/pages/SubcontractAssembly/ManageSubcontractAssembly';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';

const SubcontractAssembly = () => {
  const { setWalkmeData } = useSetWalkmeData();

  const {
    state: { permissions, selectedEntity, user, resources }
  }: any = useData();

  const types = [
    {
      key: `My ${resources?.subcontractAssembly?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources?.subcontractAssembly?.titlePlural}`,
      value: 2
    }
  ];

  const renderedFrom = camelCase(sidebarResource?.subcontractAssembly);
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [columns, setColumns] = useState(null);
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.subcontractAssembly));
  const [open, setOpen] = useState({ open: false, isClone: false, id: null });
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedType]);

  const fetchGridColumns = async () => {
    let data;

    const response = await axiosInstance().get(`/field?resource=${sidebarResource?.subcontractAssembly}`);
    data = response?.data?.data;

    const newColumns = generateColumns(renderedFrom, data, routes.subcontractAssemblyDetail.path, true);
    setWalkmeData([createAddItemStepdata({ title: resources?.subcontractAssembly?.titleSingular, path: routes.subcontractAssembly.path }, data)]);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
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
        <HtmlTooltip title={permissions?.subcontractAssembly?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.subcontractAssembly?.isCreate ? false : true}
              onClick={() => {
                setOpen({ open: true, isClone: true, id: row?.original.id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.subcontractAssembly?.isCreate ? 'primary' : 'disabled'} />
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

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes?.subcontractAssembly.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(
        ({
          data: {
            data: { data, count }
          }
        }) => {
          let rows = data?.map((u: any) => {
            let finalObject: any = prepareDataForGrid(u);
            finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
            finalObject['canDelete'] =
              permissions?.subcontractAssembly?.isDelete &&
              checkIsAllowedToDelete(user, sidebarResource.subcontractAssembly, finalObject?.ownerId) &&
              u?.canDelete;
            return {
              ...finalObject
            };
          });
          dispatch({ type: 'initialize', data: rows, count: count });
        }
      )
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

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
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || [])?.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
          onClick={() => {
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords.length})`}
        </MenuItem>
      </>
    );
  };

  const handleDelete = async () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }

    axiosInstance()
      .put(`${routes?.subcontractAssembly?.path}/remove`, { ids: ids })
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: resources?.subcontractAssembly?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions.subcontractAssembly}
          module={resources?.subcontractAssembly?.titlePlural}
          api={routes.subcontractAssembly.path}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          toggleButtonList={types}
          onToggle={onTypeChange}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          addButtonProps={{ id: 'add-button' }}
          actionButtonProps={{ disabled: selectedRecords.length ? false : true, id: 'action-button' }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => {
            setOpen({ open: true, isClone: false, id: null });
          }}
          isAddButtonVisible={permissions?.subcontractAssembly.isCreate}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            resource={sidebarResource.subcontractAssembly}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${resources?.subcontractAssembly?.titleSingular?.toLowerCase()} ${deleteRecord?.subcontractAssemblyNumber || ''
              } ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
        {open?.open && (
          <ManageSubcontractAssembly
            id={open.id}
            isClone={open?.isClone}
            onClose={() => setOpen({ open: false, isClone: false, id: null })}
            onSuccess={() => {
              setOpen({ open: false, isClone: false, id: null });
              fetchData();
            }}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default SubcontractAssembly;
