import React, { useEffect } from 'react';
import MaterialTable from 'material-table';
import Chip from '@material-ui/core/Chip';
import { Link } from 'react-router-dom';
import { materialTableIcons } from './../../constants/helpers';
import Box from '@material-ui/core/Box';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import EditOutlined from '@material-ui/icons/EditOutlined';
import AddOutlined from '@material-ui/icons/AddOutlined';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
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

  const [rowData, setRowData] = React.useState(null);

  useEffect(() => {
    if (data) {
      let rows = data.filter((e) => e.parentId === null);
      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.hideSelection = true;
        parent.subRows = generateNestedData(data, parent);
      });
      setRowData(rows);
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

  const customColumns = [
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
  const columns = [
    {
      title: 'Account Name',
      field: 'accountName',
      render: (rowData: any) => (
        <div style={{ width: 250, display: 'flex' }}>
          {rowData._id === currentAccountId ? (
            <span>{rowData.accountName}</span>
          ) : (
            <Link className="link" to={`/${accountRoute}/detail/${rowData._id}`}>
              {rowData.accountName}
            </Link>
          )}
          {rowData._id === currentAccountId ? <Chip label="Current" size="small" className="ml-2" /> : ''}
          {
            <span style={{ display: 'flex', marginLeft: '4px' }}>
              <Tooltip title={canUpdate && rowData?.canEdit ? 'Edit' : "You don't have permission to edit"}>
                <IconButton size="small" aria-label="Edit" disabled={!canUpdate || !rowData?.canEdit} onClick={() => handleUpdate(rowData)}>
                  <EditOutlined fontSize="small" color={canUpdate && rowData?.canEdit ? 'primary' : 'disabled'} />
                </IconButton>
              </Tooltip>
              <Box mt={1} ml="2" />
              <Tooltip title={canCreate ? 'Add Account' : "You don't have permission to add"}>
                <IconButton size="small" aria-label="Add Account" disabled={!canCreate} onClick={() => onCreateNewAccount(rowData._id)}>
                  <AddOutlined fontSize="small" color={canCreate ? 'primary' : 'disabled'} />
                </IconButton>
              </Tooltip>
              <Tooltip title={canDelete ? 'Delete' : "You don't have permission to delete"}>
                <IconButton size="small" aria-label="Add Account" disabled={!canCreate} onClick={() => handleDelete(rowData)}>
                  <DeleteIcon fontSize="small" color={canCreate ? 'error' : 'disabled'} />
                </IconButton>
              </Tooltip>
            </span>
          }
        </div>
      )
    },
    {
      title: 'Type',
      field: 'typeOfAccount',
      render: (rowData: any) => (
        <div style={{ width: commonFieldWidth }}>
          <CustomRenderCell value={rowData.typeOfAccount} />
        </div>
      )
    },
    {
      title: 'Industry',
      field: 'industry',
      render: (rowData: any) => (
        <div style={{ width: commonFieldWidth }}>
          <CustomRenderCell value={rowData.industry} />
        </div>
      )
    },
    {
      title: 'Type Of Business',
      field: 'typeOfBusiness',
      render: (rowData: any) => (
        <div style={{ width: commonFieldWidth }}>
          <CustomRenderCell value={rowData.typeOfBusiness} />
        </div>
      )
    },
    {
      title: 'Parent Account',
      field: 'parentAccountText',
      render: (rowData) => (
        <div style={{ width: 'auto' }}>
          {rowData.parentAccountId === currentAccountId ? (
            <span className="text-truncate ">{rowData.parentAccountText}</span>
          ) : (
            <Link className="link text-truncate" to={`/${accountRoute}/detail/${rowData.parentAccountId}`}>
              <CustomRenderCell value={rowData.parentAccountText} />
            </Link>
          )}
        </div>
      )
    },
    {
      title: 'Phone',
      field: 'phone',
      render: (rowData: any) => (
        <div style={{ width: commonFieldWidth }}>
          <CustomRenderCell value={rowData.phone} isCopyToClipboard={true} />
        </div>
      )
    }
  ];

  return (
    <Box style={{ display: 'flex' }}>
      {rowData && customColumns && (
        <Box p="6px" zIndex={5} width={'100%'}>
          <CustomReactTable
            columns={customColumns}
            data={rowData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
            onSelect={() => {}}
            childrenProperty="subRows"
            uniqueKey="_id"
            renderedFrom={'customer-account'}
            isClientSideGrid={true}
            hideSelection={true}
            hideAction={true}
          />
        </Box>
      )}
    </Box>
  );
}
