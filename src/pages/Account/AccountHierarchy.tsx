import React, { forwardRef } from 'react'
import MaterialTable from 'material-table';
import AddBox from '@material-ui/icons/AddBox';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';
import Chip from '@material-ui/core/Chip';
import routes from './../../components/Helpers/Routes';
import { Link } from 'react-router-dom'

const tableIcons: any = {
    Add: forwardRef((props: any, ref: any) => <AddBox {...props} ref={ref} />),
    Check: forwardRef((props: any, ref: any) => <Check {...props} ref={ref} />),
    Clear: forwardRef((props: any, ref: any) => <Clear {...props} ref={ref} />),
    Delete: forwardRef((props: any, ref: any) => <DeleteOutline {...props} ref={ref} />),
    DetailPanel: forwardRef((props: any, ref: any) => <ChevronRight {...props} ref={ref} />),
    Edit: forwardRef((props: any, ref: any) => <Edit {...props} ref={ref} />),
    Export: forwardRef((props: any, ref: any) => <SaveAlt {...props} ref={ref} />),
    Filter: forwardRef((props: any, ref: any) => <FilterList {...props} ref={ref} />),
    FirstPage: forwardRef((props: any, ref: any) => <FirstPage {...props} ref={ref} />),
    LastPage: forwardRef((props: any, ref: any) => <LastPage {...props} ref={ref} />),
    NextPage: forwardRef((props: any, ref: any) => <ChevronRight {...props} ref={ref} />),
    PreviousPage: forwardRef((props: any, ref: any) => <ChevronLeft {...props} ref={ref} />),
    ResetSearch: forwardRef((props: any, ref: any) => <Clear {...props} ref={ref} />),
    Search: forwardRef((props: any, ref: any) => <Search {...props} ref={ref} />),
    SortArrow: forwardRef((props: any, ref: any) => <ArrowDownward {...props} ref={ref} />),
    ThirdStateCheck: forwardRef((props: any, ref: any) => <Remove {...props} ref={ref} />),
    ViewColumn: forwardRef((props: any, ref: any) => <ViewColumn {...props} ref={ref} />)
};

export default function AccountHierarchy({ data, currentAccountId }) {

    return (
        <div className="account_hierarchy_style">
            <MaterialTable
                icons={tableIcons}
                data={data}
                columns={[
                    {
                        title: 'Account Name', field: 'accountName',
                        width: 200,
                        render: (rowData: any) => <>
                            <Link className="account_name_link" to={`${routes.accountDetails.path}/${rowData._id}`}>
                                {rowData.accountName}
                            </Link>
                            {
                                rowData._id === currentAccountId ? <Chip label="Current" size="small" className="ml-2" /> : ""
                            }
                        </>
                    },
                    { title: 'Type', field: 'typeOfAccount' },
                    { title: 'Industry', field: 'industry' },
                    { title: 'Type Of Business', field: 'typeOfBusiness' },
                    {
                        title: 'Parent Account', field: 'parentAccountText',
                        render: rowData =>
                            <Link className="account_name_link" to={`${routes.accountDetails.path}/${rowData.parentAccountId}`}>
                                {rowData.parentAccountText}
                            </Link>
                    },
                    { title: 'Phone', field: 'phone' },
                ]}
                // columnResizable={true}
                parentChildData={(row, rows) => rows.find(a => a._id === row.parentAccountId)}
                options={{
                    search: false,
                    paging: false,
                    sorting: false,
                    draggable: false,
                    padding: "dense",
                    defaultExpanded: true
                }}
            />
        </div>
    );
}