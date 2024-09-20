import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import IconButton from '@material-ui/core/IconButton';
import AddOutlined from '@material-ui/icons/AddOutlined';
import DeleteIcon from '@material-ui/icons/Delete';
import { useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useData } from 'src/StateProvider/Provider';
import { SET_SELECTED_ENTITY } from 'src/StateProvider/actionTypes';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import EditIcon from '@material-ui/icons/Edit';

const renderedFrom = 'customer-account-hierarchy';

export default function AccountHierarchy({
  data,
  currentAccountId,
  accountRoute,
  handleUpdate = null,
  canUpdate = false,
  canCreate = false,
  onCreateNewAccount = null,
  canDelete = false,
  handleDelete = null,
  accountResource
}) {
  const [columns, setColumns] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const {
    state: { user, selectedEntity },
    dispatch: entityDispatch
  }: any = useData();
  const history = useHistory();

  const { generateColumns } = useColumns();

  const handleEntityChange = (entityId) => {
    entityDispatch({ type: SET_SELECTED_ENTITY, payload: entityId });
  };

  const hasAccessToEntity = (id) => {
    const entityList = user.entity?.map((entity) => entity._id);
    return entityList.includes(id);
  };

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (data) {
      let rows = data.filter((e) => !e?.parentAccount?.optionValue);
      rows = rows?.map((parent, i) => {
        let finalObject = prepareDataForGrid(parent, user);
        let res = {
          ...finalObject,
          index: `${i + 1}`,
          subRows: generateNestedData(data, parent)
        };
        return res;
      });
      dispatch({ type: 'initialize', data: rows, count: rows?.length });
    }
  }, [data]);

  const generateNestedData = (data, parent) => {
    let subRows: any = data.filter((e) => e?.parentAccount?.optionValue === parent._id);
    subRows = subRows?.map((subRow, i) => {
      let finalObject = prepareDataForGrid(subRow, user);
      let res = {
        ...finalObject,
        index: parent.index + '.' + `${i + 1}`,
        subRows: generateNestedData(data, subRow)
      };
      return res;
    });
    return subRows;
  };

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource[accountResource]}`);
    data = response?.data?.data;
    let newColumns: any = generateColumns(accountResource, data, `/${accountRoute}/detail`, true);

    newColumns?.forEach((o) => {
      if (o?.accessor === 'accountName') {
        o.cell = ({ row }) => {
          return row.original['accountName'] ? (
            <div className="flex items-center gap-2">
              {row.original._id === currentAccountId ? (
                <span className="text-truncate" title={row.original.accountName}>
                  {row.original.accountName}
                </span>
              ) : (
                <Link
                  title={row.original.accountName}
                  target="_blank"
                  className="link text-truncate"
                  to={`/${accountRoute}/detail/${row.original._id}`}
                >
                  {row.original.accountName}
                </Link>
              )}
              {row.original._id === currentAccountId && (
                <Chip
                  style={{ color: 'white', backgroundColor: '#298B88', padding: 4, fontWeight: 600 }}
                  label="Current"
                  size="small"
                  data-hide-in-export={true}
                />
              )}
              <HtmlTooltip title={canUpdate && row.original?.canEdit ? 'Edit' : "You don't have permission to edit"}>
                <IconButton size="small" aria-label="Edit" disabled={!canUpdate || !row.original?.canEdit} onClick={() => handleUpdate(row.original)}>
                  <EditIcon fontSize="small" color={canUpdate && row.original?.canEdit ? 'primary' : 'disabled'} />
                </IconButton>
              </HtmlTooltip>
              <HtmlTooltip title={canCreate ? 'Add Account' : "You don't have permission to add"}>
                <IconButton size="small" aria-label="Add Account" disabled={!canCreate} onClick={() => onCreateNewAccount(row.original._id)}>
                  <AddOutlined fontSize="small" color={canCreate ? 'primary' : 'disabled'} />
                </IconButton>
              </HtmlTooltip>
              <HtmlTooltip title={canDelete ? 'Delete' : "You don't have permission to delete"}>
                <IconButton size="small" aria-label="Add Account" disabled={!canCreate} onClick={() => handleDelete(row.original)}>
                  <DeleteIcon fontSize="small" color={canCreate ? 'error' : 'disabled'} />
                </IconButton>
              </HtmlTooltip>
            </div>
          ) : (
            <NoDataCell />
          );
        };
        o.width = 300;
        o.minWidth = 300;
      }
    });

    if (accountResource.includes('customer')) {
      newColumns = [
        ...newColumns,
        {
          accessor: 'relatedLead',
          Header: 'Related Lead',
          minWidth: 150,
          width: 150,
          Cell: ({ row }) =>
            row?.original?.lead ? (
              row?.original?.leadEntity === selectedEntity ? (
                <Link className="link" to={`${routes.leadDetail.path}/${row?.original?.leadId}`} title={row?.original?.lead}>
                  {row?.original?.lead}
                </Link>
              ) : hasAccessToEntity(row?.original?.leadEntity) ? (
                <span
                  className="link"
                  onClick={() => {
                    handleEntityChange(row?.original?.leadEntity);
                    history.replace(`${routes.leadDetail.path}/${row?.original?.leadId}`);
                  }}
                  title={row?.original?.lead}
                >
                  {row?.original?.lead}
                </span>
              ) : (
                <span title={row?.original?.lead}>
                  <CustomRenderCell value={row?.original?.lead} />
                </span>
              )
            ) : (
              <NoDataCell />
            )
        }
      ];
    }
    setColumns([...newColumns, ...getStaticFields()]);
  };

  return (
    <Box style={{ display: 'flex' }}>
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height="max(calc(100vh - 350px), 500px)"
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            expander={true}
            hideAction={true}
            hideSelection={true}
          />
        </Box>
      ) : (
        <Box height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Box>
  );
}
