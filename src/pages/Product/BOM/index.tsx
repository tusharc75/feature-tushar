import React from 'react';
import MaterialTable from 'material-table';
import { Link } from 'react-router-dom'
import { materialTableIcons, product } from '../../../constants/helpers';
import { Box } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { Delete } from '@material-ui/icons';


function ProductHierarchy({ data, permissions, unassignProduct, fetchData = () => { } }) {

    const { setToastConfig } = React.useContext(CustomToastContext);
    const [showConfirmBox, setShowConfirmBox] = React.useState({ open: false, data: null })
    const [isDeleting, setIsDeleting] = React.useState(false)

    const actions: any = [{
        icon: () => <Delete fontSize='small' color='error' />,
        tooltip: "Delete product",
        onClick: (_, rowData) => setShowConfirmBox({ open: true, data: rowData })
    }]

    const options: any = {
        search: false,
        paging: false,
        sorting: false,
        draggable: false,
        padding: "dense",
        defaultExpanded: true,
        toolbar: false,
        actionsColumnIndex: -1
    };

    const columns = [
        {
            title: 'Product Description', field: 'productName',
            render: (rowData: any) => <div style={{ width: 250 }}>
                <Link
                    className="link"
                    to={`/product/detail/${rowData?._id}`} >
                    {rowData?.productName || ""}
                </Link>
            </div>
        },
        {
            title: 'Quantity', field: 'qty',
            render: (rowData: any) => <div style={{ width: 50 }}>
                {rowData?.qty || ""}
            </div>
        },
    ];


    const handleRemove = () => {
        setIsDeleting(true)
        const { data } = showConfirmBox
        axiosInstance().put(`${product.api}/${data.product}/bom/remove`, {
            ids: [data._id]
        })
            .then(({ data }) => {
                setIsDeleting(false)
                setShowConfirmBox({ open: false, data: null });
                setToastConfig({ open: true, message: "Successfully Deleted", type: "success" })
                fetchData()
            })
            .catch(err => {
                setToastConfig(err)
                setIsDeleting(false)
            })
    }

    return (
        <>
            {
                data.length === 1 ? <MaterialTable
                    icons={materialTableIcons}
                    data={data}
                    columns={columns}
                    options={options}
                    actions={actions}
                /> :
                    <Box margin={1}>
                        <MaterialTable
                            icons={materialTableIcons}
                            data={data}
                            columns={columns}
                            actions={actions}
                            // parentChildData={(row, rows) => {
                            //     return rows.find(a => (a._id === row.parent) || (a.treeId === row.parent) )
                            // }}
                            options={options}
                        />
                    </Box>
            }
            {showConfirmBox.open && <ConfirmationDialog
                open={true}
                message={`Are you sure you want to delete this product?`}
                okBtnLoading={isDeleting}
                onClose={() => {
                    setShowConfirmBox({ open: false, data: null });
                }}
                onOk={handleRemove}
            />}
        </>
    );
}

export default ProductHierarchy