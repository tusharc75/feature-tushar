import MaterialTable from 'material-table';
import { Chip, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { materialTableIcons } from './../../constants/helpers';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';

export default function AccountHierarchy({ data, currentAccountId, accountRoute }) {
  const commonFieldWidth = 150;
  const options: any = {
    search: false,
    paging: false,
    sorting: false,
    draggable: false,
    padding: 'dense',
    defaultExpanded: true,
    toolbar: false
  };

  const columns = [
    {
      title: 'Account Name',
      field: 'accountName',
      render: (rowData: any) => (
        <div style={{ width: 250 }}>
          {rowData._id === currentAccountId ? (
            <span>{rowData.accountName}</span>
          ) : (
            <Link className="link" to={`/${accountRoute}/detail/${rowData._id}`}>
              {rowData.accountName}
            </Link>
          )}
          {rowData._id === currentAccountId ? <Chip label="Current" size="small" className="ml-2" /> : ''}
        </div>
      )
    },
    {
      title: 'Type',
      field: 'typeOfAccount',
      render: (rowData: any) => <div style={{ width: commonFieldWidth }}>{rowData.typeOfAccount}</div>
    },
    {
      title: 'Industry',
      field: 'industry',
      render: (rowData: any) => <div style={{ width: commonFieldWidth }}>{rowData.industry}</div>
    },
    {
      title: 'Type Of Business',
      field: 'typeOfBusiness',
      render: (rowData: any) => <div style={{ width: commonFieldWidth }}>{rowData.typeOfBusiness}</div>
    },
    {
      title: 'Parent Account',
      field: 'parentAccountText',
      render: (rowData) => (
        <div style={{ width: commonFieldWidth }}>
          {rowData.parentAccountId === currentAccountId ? (
            <span>{rowData.parentAccountText}</span>
          ) : (
            <Link className="link" to={`/${accountRoute}/detail/${rowData.parentAccountId}`}>
              {rowData.parentAccountText}
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
    <>
      {data.length === 1 ? (
        <MaterialTable icons={materialTableIcons} data={data} columns={columns} options={options} />
      ) : (
        <Box margin={10}>
          <MaterialTable
            icons={materialTableIcons}
            data={data}
            columns={columns}
            parentChildData={(row, rows) => rows.find((a) => a._id === row.parentAccountId)}
            options={options}
          />
        </Box>
      )}
    </>
  );
}
