import MaterialTable from 'material-table';
import Chip from '@material-ui/core/Chip';
import { Link } from 'react-router-dom'
import { materialTableIcons } from './../../constants/helpers';
import Box from '@material-ui/core/Box';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import EditOutlined from "@material-ui/icons/EditOutlined"
import AddOutlined from "@material-ui/icons/AddOutlined"
import IconButton from "@material-ui/core/IconButton"
import Tooltip from "@material-ui/core/Tooltip"

export default function AccountHierarchy({ data, currentAccountId, accountRoute,
    handleUpdate = null, canUpdate = false, canCreate = false, onCreateNewAccount = null }) {

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
            render: (rowData: any) => <div style={{ width: 250, display: 'flex' }}>
                {
                    rowData._id === currentAccountId ? <span>{rowData.accountName}</span> :
                        <Link className="link" to={`/${accountRoute}/detail/${rowData._id}`}>
                            {rowData.accountName}
                        </Link>
                }
                {
                    rowData._id === currentAccountId ? <Chip label="Current" size="small" className="ml-2" /> : ""
                }
                {
                    <span style={{ display: 'flex', marginLeft: "4px" }}>
                        <Tooltip title={canUpdate && rowData?.canEdit ? "Edit" : "You don't have permission to edit"} >
                            <IconButton
                                size="small"
                                aria-label="Edit"
                                disabled={(!canUpdate) || (!rowData?.canEdit)}
                                onClick={() => handleUpdate(rowData)}
                            >
                                <EditOutlined fontSize="small" color={canUpdate && rowData?.canEdit ? "primary" : "disabled"} />
                            </IconButton>
                        </Tooltip>
                        <Box mt={1} ml="2" />
                        <Tooltip title={canCreate ? "Add Account" : "You don't have permission to add"}>
                            <IconButton
                                size="small"
                                aria-label="Add Account"
                                disabled={!canCreate}
                                onClick={() => onCreateNewAccount(rowData._id)}
                            >
                                <AddOutlined fontSize="small" color={canCreate ? "primary" : "disabled"} />
                            </IconButton>
                        </Tooltip>
                    </span>
                }
            </div >
        },
        {
            title: 'Type', field: 'typeOfAccount',
            render: (rowData: any) => <div style={{ width: commonFieldWidth }}>
                <CustomRenderCell value={rowData.typeOfAccount} />
            </div>
        },
        {
            title: 'Industry', field: 'industry',
            render: (rowData: any) => <div style={{ width: commonFieldWidth }}>
                <CustomRenderCell value={rowData.industry} />
            </div>
        },
        {
            title: 'Type Of Business', field: 'typeOfBusiness',
            render: (rowData: any) => <div style={{ width: commonFieldWidth }}>
                <CustomRenderCell value={rowData.typeOfBusiness} />
            </div>
        },
        {
            title: 'Parent Account', field: 'parentAccountText',
            render: rowData => <div style={{ width: commonFieldWidth }}>
                {
                    rowData.parentAccountId === currentAccountId ? <span>{rowData.parentAccountText}</span> :
                        <Link className="link" to={`/${accountRoute}/detail/${rowData.parentAccountId}`}>
                            <CustomRenderCell value={rowData.parentAccountText} />
                        </Link>
                }
            </div>
        },
        {
            title: 'Phone', field: 'phone',
            render: (rowData: any) => <div style={{ width: commonFieldWidth }}>
                <CustomRenderCell value={rowData.phone} isCopyToClipboard={true} />
            </div>
        },
    ];

    return (
        <>
            {
                data.length === 1 ? <MaterialTable
                    icons={materialTableIcons}
                    data={data}
                    columns={columns}
                    options={options}
                /> :
                    <Box margin={1}>
                        <MaterialTable
                            icons={materialTableIcons}
                            data={data}
                            columns={columns}
                            parentChildData={(row, rows) => rows.find(a => a._id === row.parentAccountId)}
                            options={options}
                        />
                    </Box>
            }
        </>
    );
}