import MaterialTable from 'material-table';
import Chip from '@material-ui/core/Chip';
import routes from './../../components/Helpers/Routes';
import { Link } from 'react-router-dom'
import { materialTableIcons } from './../../constants/helpers';

export default function AccountHierarchy({ data, currentAccountId }) {

    const commonFieldWidth = 150;
    const options: any = {
        search: false,
        paging: false,
        sorting: false,
        draggable: false,
        padding: "dense",
        defaultExpanded: true,
        toolbar: false
    };

    const columns = [
        {
            title: 'Account Name', field: 'accountName',
            render: (rowData: any) => <div style={{ width: 250 }}>
                <Link className="link" to={`${routes.accountDetails.path}/${rowData._id}`}>
                    {rowData.accountName}
                </Link>
                {
                    rowData._id === currentAccountId ? <Chip label="Current" size="small" className="ml-2" /> : ""
                }
            </div>
        },
        {
            title: 'Type', field: 'typeOfAccount',
            render: (rowData: any) => <div style={{ width: commonFieldWidth }}>
                {rowData.typeOfAccount}
            </div>
        },
        {
            title: 'Industry', field: 'industry',
            render: (rowData: any) => <div style={{ width: commonFieldWidth }}>
                {rowData.industry}
            </div>
        },
        {
            title: 'Type Of Business', field: 'typeOfBusiness',
            render: (rowData: any) => <div style={{ width: commonFieldWidth }}>
                {rowData.typeOfBusiness}
            </div>
        },
        {
            title: 'Parent Account', field: 'parentAccountText',
            render: rowData => <div style={{ width: commonFieldWidth }}>
                <Link className="link" to={`${routes.accountDetails.path}/${rowData.parentAccountId}`}>
                    {rowData.parentAccountText}
                </Link>
            </div>
        },
        {
            title: 'Phone', field: 'phone',
            render: (rowData: any) => <div style={{ width: commonFieldWidth }}>
                {rowData.phone}
            </div>
        },
    ];

    return (
        <>
            {
                data.length == 1 ? <MaterialTable
                    icons={materialTableIcons}
                    data={data}
                    columns={columns}
                    options={options}
                /> :
                    <MaterialTable
                        icons={materialTableIcons}
                        data={data}
                        columns={columns}
                        parentChildData={(row, rows) => rows.find(a => a._id === row.parentAccountId)}
                        options={options}
                    />
            }
        </>
    );
}