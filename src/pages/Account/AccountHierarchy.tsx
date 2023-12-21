import React, { useEffect, useState } from 'react';
import Chip from '@material-ui/core/Chip';
import { Link } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import EditOutlined from '@material-ui/icons/EditOutlined';
import AddOutlined from '@material-ui/icons/AddOutlined';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from 'src/components/Helpers/NoDataCell';

export default function AccountHierarchy({
  data,
  currentAccountId,
  accountRoute,
  handleUpdate = null,
  canUpdate = false,
  canCreate = false,
  onCreateNewAccount = null,
  canDelete = false,
  handleDelete = null
}) {
  const commonFieldWidth = 150;
  const [columns, setColumns] = useState(null);
  const { state, dispatch } = useTableReducer();

  useEffect(() => {
    fetchGridColumns();
  }, [])
  

  useEffect(() => {
    if (data) {
      let rows = data.filter((e) => e.parentId === null);
      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.hideSelection = true;
        parent.subRows = generateNestedData(data, parent);
      });
      dispatch({ type: 'initialize', data: rows, count: rows?.length });
    }
  }, [data]);

  const generateNestedData = (data, parent) => {
    const subRows: any = data.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.hideSelection = true;
      _subRow.subRows = generateNestedData(data, _subRow);
    });
    return subRows;
  };
const fetchGridColumns = ()=>{
  let customColumns = [
    {
      accessor: 'accountName',
      Header: 'Account Name',
      width: 300,
      Cell: ({ row }) => {
        return row.original['accountName'] ? (
          <div className="text-truncate" style={{ display: 'flex', alignItems: 'center' }}>
            {row.original._id === currentAccountId ? (
              <span>{row.original.accountName}</span>
            ) : (
              <Link className="link" to={`/${accountRoute}/detail/${row.original._id}`}>
                {row.original.accountName}
              </Link>
            )}
            {row.original._id === currentAccountId ? (
              <Chip
                style={{ color: 'white', backgroundColor: '#298B88', padding: 4, fontWeight: 600 }}
                label="Current"
                size="small"
                className="ml-2"
              />
            ) : (
              ''
            )}
            {
              <span style={{ display: 'flex', marginLeft: '4px' }}>
                <Tooltip title={canUpdate && row.original?.canEdit ? 'Edit' : "You don't have permission to edit"}>
                  <IconButton
                    size="small"
                    aria-label="Edit"
                    disabled={!canUpdate || !row.original?.canEdit}
                    onClick={() => handleUpdate(row.original)}
                  >
                    <EditOutlined fontSize="small" color={canUpdate && row.original?.canEdit ? 'primary' : 'disabled'} />
                  </IconButton>
                </Tooltip>
                <Box mt={1} ml="2" />
                <Tooltip title={canCreate ? 'Add Account' : "You don't have permission to add"}>
                  <IconButton size="small" aria-label="Add Account" disabled={!canCreate} onClick={() => onCreateNewAccount(row.original._id)}>
                    <AddOutlined fontSize="small" color={canCreate ? 'primary' : 'disabled'} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={canDelete ? 'Delete' : "You don't have permission to delete"}>
                  <IconButton size="small" aria-label="Add Account" disabled={!canCreate} onClick={() => handleDelete(row.original)}>
                    <DeleteIcon fontSize="small" color={canCreate ? 'error' : 'disabled'} />
                  </IconButton>
                </Tooltip>
              </span>
            }
          </div>
        ) : (
          <NoDataCell />
        );
      }
    },
    {
      accessor: 'typeOfAccount',
      Header: 'Type',
      width: commonFieldWidth,
      Cell: ({ row }) => {
        return row.original['accountName'] ? (
          <div>
            <CustomRenderCell value={row.original.typeOfAccount} />
          </div>
        ) : (
          <NoDataCell />
        );
      }
    },
    {
      accessor: 'industry',
      Header: 'Industry',
      width: commonFieldWidth,
      Cell: ({ row }) => {
        return row.original['accountName'] ? (
          <div>
            <CustomRenderCell value={row.original.industry} />
          </div>
        ) : (
          <NoDataCell />
        );
      }
    },
    {
      accessor: 'typeOfBusiness',
      Header: 'Type Of Business',
      width: commonFieldWidth,
      Cell: ({ row }) => {
        return row.original['accountName'] ? (
          <div>
            <CustomRenderCell value={row.original.typeOfBusiness} />
          </div>
        ) : (
          <NoDataCell />
        );
      }
    },
    {
      accessor: 'parentAccountText',
      Header: 'Parent Account',
      width: commonFieldWidth,
      Cell: ({ row }) => {
        return row.original['accountName'] ? (
          <div style={{ width: 'auto' }}>
            {row.original.parentId === currentAccountId ? (
              <span className="text-truncate ">{row.original.parentAccountText}</span>
            ) : (
              <Link className="link text-truncate" to={`/${accountRoute}/detail/${row.original.parentId}`}>
                <CustomRenderCell value={row.original.parentAccountText} />
              </Link>
            )}
          </div>
        ) : (
          <NoDataCell />
        );
      }
    },
    {
      accessor: 'phone',
      Header: 'Phone',
      width: commonFieldWidth,
      Cell: ({ row }) => {
        return row.original['accountName'] ? (
          <div>
            <CustomRenderCell value={row.original.phone} isCopyToClipboard={true} />
          </div>
        ) : (
          <NoDataCell />
        );
      }
    }
  ];
  setColumns(customColumns);
}
  
  return (
    <Box style={{ display: 'flex' }}>
      {columns && (
        <Box p="6px" zIndex={5} width={'100%'}>
 <CustomReactTable
         height="max(calc(100vh - 350px), 500px)"
         columns={columns}
         state={state}
         dispatch={dispatch}
         refreshGrid={()=>{}}
         setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
         renderedFrom={'customer-account'}
         isClientSideGrid={true}
         expander={true}
         hideAction={true}
         hideSelection={true}
       />
        </Box>
      )}
    </Box>
  );
}
