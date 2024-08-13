import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { deleteDisable, editDisable } from 'src/constants/messageHelpers';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import { camelCase, isArray, kebabCase } from 'lodash';
import { useData } from 'src/StateProvider/Provider';
import ConfirmationDialog from '../../../../components/Helpers/ConfirmationDialog';
import ManageDynamicForm from '../../ManageDynamicForm';
import { DetailsPageHeader } from 'src/components/PageHeaders';

const ResourceField = ({ step, renderedFrom, data, stepFullScreen = false, referenceData }) => {

  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [open, setOpen] = useState({ open: false, id: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { state, dispatch } = useTableReducer();
  const { page, limit, filters, sorting, selectedRecords } = state;
  const { generateColumns } = useColumns();

  const [allowedToEdit, setAllowedToEdit] = useState(permissions?.[camelCase(step?.linkResourceName)]?.isUpdate);
  const [allowedToDelete, setAllowedToDelete] = useState(permissions?.[camelCase(step?.linkResourceName)]?.isDelete);
  const [linkResourceFieldType, setLinkResourceFieldType] = useState(null);

  useEffect(() => {
    fetchColumn();
  }, [step]);

  const fetchColumn = async () => {
    setColumns(null)
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/field?resource=${step?.linkResourceName}`);
      setLinkResourceFieldType(data?.find((d) => d?.fieldData?.fieldName === step?.linkResourceField)?.fieldData?.type)
      const newColumns = generateColumns(camelCase(step?.linkResourceName),
        data?.filter((d) => d?.fieldData?.fieldName !== step?.linkResourceField), `/${kebabCase(step?.linkResourceName)}/detail`, false);
      setColumns([
        ...newColumns,
        ...(step?.readOnly
          ? []
          : [
            {
              accessor: 'action',
              Header: 'Actions',
              minWidth: 100,
              width: 110,
              sticky: 'right',
              disableFilters: true,
              disableSortBy: true,
              canDrag: false,
              Cell: ({ row }) => (
                <>
                  <HtmlTooltip title={allowedToEdit ? 'Edit' : editDisable}>
                    <span>
                      <IconButton
                        size="small"
                        aria-label="Edit"
                        disabled={allowedToEdit ? false : true}
                        onClick={() => {
                          setOpen({ open: true, id: row?.original?._id });
                        }}
                      >
                        <EditIcon fontSize="small" color={allowedToEdit ? 'primary' : 'disabled'} />
                      </IconButton>
                    </span>
                  </HtmlTooltip>

                  <HtmlTooltip title={allowedToDelete ? 'Delete' : deleteDisable}>
                    <span>
                      <IconButton
                        size="small"
                        aria-label="Delete"
                        disabled={allowedToDelete ? false : true}
                        onClick={() => {
                          setDeleteRecord(row?.original);
                          setShowDeleteConfirmBox(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" color={allowedToDelete ? 'error' : 'disabled'} />
                      </IconButton>
                    </span>
                  </HtmlTooltip>
                </>
              )
            }
          ])
      ]);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, step]);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`dynamic-form/${queryString}`, {
        headers: {
          Resource: step?.linkResourceName
        }
      })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u, i) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.[camelCase(step?.linkResourceName)]?.isUpdate;
          finalObject['canDelete'] = permissions?.[camelCase(step?.linkResourceName)]?.isDelete;
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

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (step?.linkResourceField) {
      filterByIds.push({ field: step?.linkResourceField, term: { $in: [data?._id] } });
    }

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

    return deepFilter;
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
      .put(
        `dynamic-form/remove`,
        { ids: ids },
        {
          headers: {
            Resource: step?.linkResourceName
          }
        }
      )
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

  const actionButtonMenuItems = () => {
    return (
      <MenuItem disabled={selectedRecords.length ? false : true} onClick={() => setShowDeleteConfirmBox(true)}>
        Delete
      </MenuItem>
    );
  };


  return (
    <>
      {allowedToEdit && !step?.readOnly && (
        <DetailsPageHeader
          isAddButtonVisible={false}
          isActionButtonVisible={true}
          actionButtonMenuItems={actionButtonMenuItems()}
          actionButtonProps={{ disabled: !Boolean(selectedRecords?.length) }}
          hasXpadding
          leftSideContents={
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {
                setOpen({ open: true, id: null });
              }}
            >
              Add
            </Button>
          }
        />
      )}
      <Box mt={1}>
        {columns ? (
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            resource={step?.linkResourceName}
            hideSelection={step?.readOnly}
            hideAction={step?.readOnly}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>

      {open.open && (
        <ManageDynamicForm
          resource={step?.linkResourceName}
          redirected={false}
          isClone={false}
          id={open.id}
          onClose={() => setOpen({ open: false, id: null })}
          onSuccess={() => {
            fetchData();
            setOpen({ open: false, id: null });
          }}
          referenceData={{
            [step?.linkResourceField]: linkResourceFieldType === 'multiSelect' && !isArray(data?._id)
              ? [data?._id] : data?._id, ...(referenceData || {})
          }}
        />
      )}

      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={handleDelete}
        />
      )}
    </>
  );
};

export default ResourceField;
