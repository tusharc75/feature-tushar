import MaterialTable from 'material-table';
import { Link } from 'react-router-dom'
import { materialTableIcons } from '../../constants/helpers';
import { Box } from '@material-ui/core';

export default function ProductHierarchy({ data, permissions, unassignProduct }) {
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
            title: 'Product Name', field: 'productName',
            render: (rowData: any) => <div style={{ width: 250 }}>
                <Link
                    className="link"
                    to={`/product/detail/${rowData?._id}`} >
                    {rowData?.productName || ""}
                </Link>
            </div>
        },
        // {
        //     title: 'Actions',
        //     field: 'actions',
        //     render: (rowData: any) => (
        //         <> {
        //             permissions?.isUpdate &&
        //             <div style={{ width: 250 }}>
        //                 <Tooltip title="Delete">
        //                     <IconButton size="small" aria-label="Delete"
        //                         onClick={() => unassignProduct(rowData)} >
        //                         <DeleteIcon color="error" />
        //                     </IconButton>
        //                 </Tooltip >
        //             </div >
        //         }
        //         </>)
        // }
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
                            parentChildData={(row, rows) => {
                                return rows.find(a => a._id === row.parent)
                            }}
                            options={options}
                        />
                    </Box>
            }
        </>
    );
}