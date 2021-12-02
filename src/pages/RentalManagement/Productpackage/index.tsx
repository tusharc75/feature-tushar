import React, { useState, useEffect, useContext, Fragment, useReducer, useMemo } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, CircularProgress, Tab, Tabs, ButtonGroup, Container, InputAdornment, useMediaQuery } from "@material-ui/core";
import { Autocomplete, Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../../axios/axiosInstance";
import routes from "../../../components/Helpers/Routes";
import { useData } from "../../../StateProvider/Provider";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import EditIcon from "@material-ui/icons/Edit";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import GridDeleteIcon from "../../../components/Helpers/GridDeleteIcon";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import { FaCartArrowDown, FaCartPlus } from "react-icons/fa";
import { isMobile } from "react-device-detect";
import CustomSwipableList from "../../../components/SwipableListComponents/CustomSwipableList";
import HtmlTooltip from "../../../components/CustomTooltipTitle";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import { getColumnData, getStaticFields, getFrameworkComponents, getSortedColumns, genrateColoum } from "../../../constants/columns"
import { GrBusinessService } from "react-icons/all";
import AddExistingProductInventory from "./AddExistingProductInventory";
import CustomReactTable from "../../../components/CustomReactTable/CustomReactTable";
import { camelCase, startCase, orderBy, sum } from "lodash";
import NoDataCell from "../../../components/Helpers/NoDataCell";
import Add from "@material-ui/icons/Add";
import moment from "moment";
import {
    getUniqueCurrencies, gridLoadingTimeout, rentalManagement, defaultActivityShow,
    dateFormat, pricingCondition, generateUniqueId, treeToFlatArray, formatAmountWithCurrency
} from "../../../constants/helpers";
import ConfirmationDialog from "../../../components/Helpers/ConfirmationDialog";
import BulkEditInventoryDialog from './BulkEditInventoryDialog'
import RentalJobQtyDialog from './RentalJobQtyDialog'
import PackageProductsDialog from './PackageProductsDialog'
const { pricingConditionApi } = pricingCondition

const Productpackage = ({ rentalManagementData, setNextStep, currencySymbol }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { user, permissions } }: any = useData();

    const isSmallScreen = useMediaQuery('(max-width:1300px)');
    const isTabletScreen = useMediaQuery('(max-width:960px)');
    const [showActivity, setActivityShow] = useState(defaultActivityShow);
    const [isUpdating, setUpdating] = useState(false);

    const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: "" });
    const [selectedProducts, setSelectedProducts] = useState([])
    const [isProductEdit, setIsProductEdit] = useState({ open: false, editType: null });
    const [isAddingProducts, setAddingProducts] = useState(false);
    const [productInventory, setProductInventory] = useState<any[]>([]);
    const [dataForNewTabData, setDataForNewTabData] = useState(null);
    const [packageForProducts, setPackageForProducts] = useState(null)
    const [recordToUpdate, setRecordToUpdate] = useState(null)
    const [deleteData, setDeleteData] = useState(null);
    const [isDeleting, setDeleting] = useState(false);


    useEffect(() => {
        fetchProductInventory();
    }, []);


    const handleAddProductInventory = (productInventoryArray) => {
        // let tempProductArray = productInventoryArray.map(d => { return { "inventory": d._id, "costing": { "costPerDay": 0, "totalCost": 0, "startDate": rentalManagementData.rentalStartDate, "dueDate": rentalManagementData.rentalEndDate } } })
        setAddingProducts(true)
        let tempProductArray = productInventoryArray.map(d => ({
            "id": d.id,
            "qty": 1,
            "type": d.type.toLowerCase(),
            "detail": d.detail || "",
            "pricingMethod": d.pricingMethod || "",
            "UOM": d.UOM || "",
            "finalPrice": 0,
            "price": 0,
            "discount": 0,
            "startDate": rentalManagementData ? rentalManagementData?.rentalStartDate : new Date(),
            "endDate": rentalManagementData ? rentalManagementData?.rentalEndDate : new Date(),
        }))
        axiosInstance().post(`${rentalManagement.rentalManagementApi}/${rentalManagementData._id}/products-packages`, { "productsPackages": tempProductArray })
            .then(() => {
                setAddExistingProductDialog({ open: false, type: "" })
                fetchProductInventory()
                setAddingProducts(false)
            }).catch((error) => {
                setAddExistingProductDialog({ open: false, type: "" })
                toastConfig.setToastConfig(error)
                setAddingProducts(false)
            });
    }

    const restructureRowData = (rowData: any) => {
        let extractedProducts = []
        let newDataOfRow = [...rowData]

        let packageProducts = newDataOfRow.filter(rd => rd.type === "productInPackage")
        let packages = newDataOfRow.filter(rd => rd.type === "Package")
        let products = newDataOfRow.filter(rd => rd.type === "Product")
        let modifiedPkgProducts = [];

        packages.forEach((pkg: any) => {
            let currentPkgProducts = packageProducts.filter((p: any) => p.packageId === pkg.id);
            currentPkgProducts.forEach((p: any) => {
                let product = { ...p, pkgQty: pkg.qty, totalQty: pkg.qty * p.qty };
                modifiedPkgProducts.push(product)
            })
        })

        extractedProducts = [...products, ...packages, ...modifiedPkgProducts]

        return extractedProducts
    }

    const fetchProductInventory = () => {
        let tempInventory = []
        axiosInstance().get(`${rentalManagement.rentalManagementApi}/${rentalManagementData._id}/products-packages`).then(({ data }) => {
            data.data?.products.map((u: any, index) => (tempInventory.push({
                ...u,
                id: u._id,
                productCategory: u.productCategory?.optionLabel,
                isValid: true,
                qtyToDisplay: u.qty
                // package: u.hasOwnProperty("package") ? u.package.packageName : "",
                // packageId: u.hasOwnProperty("package") ? u.package._id : ""
            })));
            data.data?.packages.map((u) => (tempInventory.push({
                ...u,
                id: u._id,
                description: u.packageDescription,
            })));
            setProductInventory(tempInventory)
            //setSerializeAssets(data.data?.inventory || [])
            tempInventory = restructureRowData(tempInventory)
            let zeroPrice = tempInventory.filter(pkg => pkg.type !== "productInPackage" && pkg?.finalPrice === 0);
            if (zeroPrice.length > 0) {
                setNextStep(false)
            } else {
                setNextStep(true)
            }
            const newData = [];
            tempInventory.forEach(({ _id, ...rest }) => {
                newData.push(rest)
            })
            const newDataForReactTable = [...translateDataToTreeForProducts(newData ? [...newData] : [], "parent", "treeId", "subRows")];
            setDataForNewTabData([...orderBy(newDataForReactTable, ["order"], ["asc"])]);
            setSelectedProducts([])
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleClick = (rowData) => {
        setIsProductEdit({ open: true, editType: "single" })
        setRecordToUpdate(rowData)
    }

    const columns = [
        {
            accessor: 'detail',
            Header: 'Detail',
            minWidth: 300,
            width: 300,
            Cell: ({ row }) => (
                <div style={{ display: "flex", alignItems: 'center' }}>
                    <p
                        onClick={() => handleClick(row.original)}
                        className="link text-truncate"
                        title={row.original.detail}
                    >
                        {row.original.detail}
                    </p>
                    {row.original?.type === 'Package' && !row.original.hasOwnProperty("packageId") &&
                        <Box ml={1} className="d-flex align-items-center">
                            <span title={`There are ${row.original?.products?.length} product(s) in this package`}>({row.original?.products?.length})</span>
                            <HtmlTooltip title="Add Product">
                                <IconButton onClick={() => setPackageForProducts(row.original)} size="small" color="primary">
                                    <Add color='disabled' />
                                </IconButton>
                            </HtmlTooltip>
                        </Box>
                    }
                </div>
            )
        },
        // {
        //   accessor: 'type',
        //   Header: 'Type',
        //   cellStyle: { padding: "0px" },
        //   render: (rowData) => (
        //     <div style={{ width: 80 }}>
        //       <p>{rowData.type}</p>
        //     </div>
        //   )

        // },
        {
            accessor: 'startDate',
            Header: 'Start Date',
            Cell: ({ row }) => (
                row.original.startDate ? <h5 className="createBy text-truncate" title={`${moment(row.original.startDate.slice(0, 10)).format(dateFormat)}`}>
                    <span className="">{moment(row.original.startDate.slice(0, 10)).format(dateFormat)}</span>
                </h5> : <NoDataCell />
            )
        },
        {
            accessor: 'endDate',
            Header: 'End Date',
            Cell: ({ row }) => (
                row.original.endDate ? <h5 className="createBy text-truncate" title={`${moment(row.original.endDate.slice(0, 10)).format(dateFormat)}`}>
                    <span className="">{moment(row.original.endDate.slice(0, 10)).format(dateFormat)}</span>
                </h5> : <NoDataCell />
            )
        },
        {
            accessor: 'qtyToDisplay',
            Header: 'Quantity',
            Cell: ({ row }) => (
                row.original.qtyToDisplay ? <p>{row.original.qtyToDisplay}</p> : <NoDataCell />
            )
        },
        {
            accessor: 'UOM',
            Header: 'UOM',
            Cell: ({ row }) => (
                row.original.UOM ? <p>{startCase(row.original.UOM)}</p> : <NoDataCell />
            )
        },
        {
            accessor: 'pricingMethod',
            Header: 'Pricing Method',
            Cell: ({ row }) => (
                row.original.pricingMethod ? <p>{startCase(row.original.pricingMethod)}</p> : <NoDataCell />
            )
        },
        {
            accessor: 'price',
            Header: `Price Per UOM (${currencySymbol})`,
            Cell: ({ row }) => (
                row.original.price ? <p>{row.original.price}</p> : <NoDataCell />
            ),
            Footer: info => {
                const total = useMemo(
                    () =>
                        info.rows.filter(f => f.values.hasOwnProperty("price") && !isNaN(f.values.price)).reduce((sum, row) => row.values.price + sum, 0),
                    [info.rows]
                )

                return <>{currencySymbol} {formatAmountWithCurrency(currencySymbol, total)?.amountWithouCurrencyCode ?? total}</>
            }
        },
        {
            accessor: 'amount',
            Header: `Total Quantity Price (${currencySymbol})`,
            Cell: ({ row }) => (
                row.original.amount ? <p>{row.original.amount}</p> : <NoDataCell />
            ),
            Footer: info => {
                const total = useMemo(
                    () =>
                        info.rows.filter(f => f.values.hasOwnProperty("amount") && !isNaN(f.values.amount)).reduce((sum, row) => row.values.amount + sum, 0),
                    [info.rows]
                )

                return <>{currencySymbol} {formatAmountWithCurrency(currencySymbol, total)?.amountWithouCurrencyCode ?? total}</>
            }
        },
        {
            accessor: 'discount',
            Header: 'Discount (%)',
            Cell: ({ row }) => (
                row.original.discount ? <p>{row.original.discount}</p> : <NoDataCell />
            )
        },
        {
            accessor: 'finalPrice',
            Header: `Final Price (${currencySymbol})`,
            Cell: ({ row }) => (
                row.original.finalPrice ? <p>{row.original.finalPrice}</p> : <NoDataCell />
            ),
            Footer: info => {
                const total = useMemo(
                    () =>
                        info.rows.filter(f => f.values.hasOwnProperty("finalPrice") && !isNaN(f.values.finalPrice)).reduce((sum, row) => row.values.finalPrice + sum, 0),
                    [info.rows]
                )

                return <>{currencySymbol} {formatAmountWithCurrency(currencySymbol, total)?.amountWithouCurrencyCode ?? total}</>
            }
        }
    ]

    //  This is copied method from helpers.ts as wee need some modification for this screen only
    const translateDataToTreeForProducts = (data, parentProperty, childProperty, childrenPropertyToStore) => {
        let parents = data.filter(value => value[parentProperty] == 'undefined' || value[parentProperty] == null)
        let childrens = data.filter(value => value[parentProperty] !== 'undefined' && value[parentProperty] != null)

        parents.forEach((current) => {
            if (current.type === "Product" || current.type === "Package") {
                current["qtyToDisplay"] = current?.qty ?? 0;
                current["isValid"] = (!isNaN(current?.finalPrice) && current?.finalPrice !== 0)
            }
        })

        let translator = (parents, childrens) => {
            parents.forEach((parent) => {
                childrens.forEach((current, index) => {
                    if (current.parent === parent[childProperty]) {
                        let temp = JSON.parse(JSON.stringify(childrens))
                        temp.splice(index, 1)
                        translator([current], temp)

                        //  Check validation for products in package - Start
                        current["qtyToDisplay"] = `${parent.qty} x ${current.qty} = ${current.qty * parent.qty}`

                        if (current?.finalPrice !== null && current?.finalPrice !== undefined && typeof current?.finalPrice !== "string" && current?.finalPrice !== 0) {
                            current["isValid"] = true;
                        } else {
                            current["isValid"] = parent["isValid"];
                        }
                        //  Check validation for products in package - End

                        if (typeof parent[childrenPropertyToStore] !== 'undefined') {
                            parent[childrenPropertyToStore].push(current)
                        } else {
                            parent[childrenPropertyToStore] = [current]
                        }
                    }
                })
            })
        }
        translator(parents, childrens)

        return parents
    }

    const deleteInventories = (data) => {
        setDeleteData(data)
    }

    const calculatePricing = (arr: any[]) => {
        //materialType can be =["product","packages","productCategory"]
        //conditionType can be =["Price","Rent","Discount","Charge","Tax"]
        if (rentalManagementData) {
            const data: any = {}
            data.conditionType = ["Rent"]
            data.material = arr.map(ele => ({
                materialId: ele?.id,
                materialType: ele?.type.includes("roduct") ? "product" : "packages",
                qty: ele?.qty,
                pricingMethod: ele?.pricingMethod,
                unit: ele?.UOM,
                currency: rentalManagementData?.currency
            }))
            data.supplier = [];
            data.customer = [rentalManagementData?.customerAccount.optionValue];
            data.warehouse = [];
            return new Promise((resolve, reject) => {
                axiosInstance().post(pricingConditionApi + `/calculatePrice`, data)
                    .then(({ data: { data } }) => {
                        resolve(data)
                    }).catch(err => {
                        reject(err)
                    })
            })
        }
    };

    const handleRemoveProductInventory = (productInventoryId) => {
        setDeleting(true)
        axiosInstance().put(`${rentalManagement.rentalManagementApi}/${rentalManagementData?._id}/products-packages/remove`, {
            ids: productInventoryId
        })
            .then(() => {
                setDeleting(false)
                fetchProductInventory()
                setDeleteData(null)
            }).catch((error) => {
                setDeleting(false)
                toastConfig.setToastConfig(error)
                setDeleteData(null)
            });
    }

    // const updateProductData = (data) => {

    //     let updatedArr = dataRows.map(d => {
    //         if (d.id === data.id) {
    //             return data
    //         } else {
    //             return d
    //         }
    //     }).map(d => ({
    //         "id": d.id,
    //         "qty": parseInt(d.quantity || d.qty) || 0,
    //         "type": d?.type ? camelCase(d.type) : "",
    //         "detail": d.detail,
    //         "pricingMethod": d?.pricingMethod || "",
    //         "UOM": d?.UOM || "",
    //         "finalPrice": parseInt(d.finalPrice) || 0,
    //         "price": parseInt(d.price) || 0,
    //         "discount": parseInt(d.discount) || 0,
    //         "startDate": d?.startDate || "",
    //         "endDate": d?.endDate || "",
    //     }))


    //     axiosInstance().put(`${rentalManagement.rentalManagementApi}/${rentalManagementData._id}/products-packages`, { "productsPackages": updatedArr })
    //         .then(() => {
    //             fetchProductInventory()
    //         }).catch((error) => {
    //             toastConfig.setToastConfig(error)
    //         });
    // }

    const handleBulkEditData = (values: any) => {
        const dataToSend = [];

        const addData = (d) => {
            return {
                "id": d.id,
                "type": d?.type.toLowerCase(),
                "detail": d.detail,
                "package": d.packageId ? d.packageId : null,
                "pricingMethod": values.pricingMethod ? values.pricingMethod : d.pricingMethod,
                "UOM": values.UOM ? values.UOM : d.UOM,
                "finalPrice": (values.finalPrice ? values.finalPrice : d.finalPrice) ?? 0,
                "discount": (values.discount ? values.discount : d.discount) ?? 0,
                "startDate": values.startDate ? values.startDate : d.startDate,
                "endDate": values.endDate ? values.endDate : d.endDate,
                "qty": values.qty ? values.qty : d.qty,
                "price": (values.price ? values.price : d.price) ?? 0
            }
        }

        selectedProducts.filter(f => f.type !== "Package").forEach(d => {
            dataToSend.push(addData(d))
        });

        selectedProducts.filter(f => f.type === "Package").forEach(d => {
            if (!dataToSend.some(s => s.package === d.id)) {
                dataToSend.push({ ...addData(d), package: d.id })
            }
        })

        setUpdating(true)
        axiosInstance().put(`${rentalManagement.rentalManagementApi}/${rentalManagementData._id}/products-packages`, { "productsPackages": dataToSend })
            .then(() => {
                setUpdating(false)
                setIsProductEdit({ open: false, editType: null })
                fetchProductInventory()

            }).catch((error) => {
                setUpdating(false)
                toastConfig.setToastConfig(error)
            });
    }

    const handleSingleEdit = async (values: any) => {
        setUpdating(true)
        const { subRows, isValid, qtyToDisplay, ...rest } = values;

        rest.type = camelCase(rest.type)
        axiosInstance().put(`${rentalManagement.rentalManagementApi}/${rentalManagementData._id}/products-packages/updateOne`, rest)
            .then(() => {
                setUpdating(false)
                setIsProductEdit({ open: false, editType: null })
                fetchProductInventory()
            }).catch((error) => {
                setUpdating(false)
                toastConfig.setToastConfig(error)
            });
    }

    const handleSingleUpdate = async (values: any) => {
        setUpdating(true)
        const { subRows, isValid, qtyToDisplay, ...rest } = values;
        rest.type = camelCase(rest.type)
        console.log(rest)
        axiosInstance().put(`${rentalManagement.rentalManagementApi}/${rentalManagementData._id}/products-packages/updateOne`, rest)
            .then(() => {
                setUpdating(false)
                setIsProductEdit({ open: false, editType: null })
                fetchProductInventory()
            }).catch((error) => {
                setUpdating(false)
                toastConfig.setToastConfig(error)
            });
    }


    return (<Fragment>
        <Box display="flex" justifyContent="space-between" m={1}>
            <Box display="flex" alignItems="center">
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                        setAddExistingProductDialog({ open: true, type: "product" });
                    }}
                >
                    {`Add ${routes.product.title}`}
                </Button>
                <Box mx={1} />
                <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => {
                        setAddExistingProductDialog({ open: true, type: "package" });
                    }}
                >
                    {`Add ${routes.packages.title}`}
                </Button>
            </Box>
            <Box display="flex">
                <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? "Buld edit selected records" : "Select records to edit"}>
                    <span>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            disabled={!Boolean(selectedProducts && selectedProducts.length)}
                            onClick={() => setIsProductEdit({ open: true, editType: "bulk" })}
                        >
                            Bulk Edit
                        </Button>
                    </span>
                </HtmlTooltip>
                <Box mx={1} />
                <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? "Delete selected records" : "Select records to delete"}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled={!Boolean(selectedProducts && selectedProducts.length) || isDeleting}
                        onClick={() => {
                            const dataToDelete = selectedProducts && selectedProducts.map((rec: any) => {
                                const obj: any = {};

                                obj.id = rec._id ?? rec.id;
                                obj.type = rec?.type.toLowerCase();
                                if (rec?.type === "productInPackage") {
                                    obj.packageId = rec.packageId
                                }

                                return obj
                            })
                            setDeleteData(dataToDelete)
                        }}

                        endIcon={isDeleting && <CircularProgress size={20} color="primary" />}
                    >
                        Delete
                    </Button>
                </HtmlTooltip>
            </Box>
        </Box>
        {columns && dataForNewTabData ?
            <>
                <Box
                    p="6px"
                    zIndex={5}
                    // width={
                    //     isTabletScreen
                    //         ? "calc(100vw - 20px)"
                    //         : isSmallScreen
                    //             ? "calc(100vw - 78px)"
                    //             : showActivity ? "100%" : "calc(100vw - 100px)"
                    // }
                    height="calc(100vh - 330px)"
                >
                    <CustomReactTable
                        height="calc(100vh - 345px)"
                        columns={columns}
                        data={dataForNewTabData}
                        isInValidCheck={(rowData) => !rowData.isValid}
                        // rowStyle={(rowData) => ({
                        //   color: "black",
                        //   background: rowData.isValid ? "white" : "#EFCCCC"
                        // })}
                        onSelect={setSelectedProducts}
                        childrenProperty="subRows"
                        uniqueKey="id"
                    />
                    {/* <MaterialTableComponent
                                // calculatePricing={calculatePricing}
                                columns={columns}
                                rowData={dataRows}
                                title={""}
                                rowStyle={(rowData) => ({
                                  color: "black",
                                  backgroundColor: rowData?.type?.includes("roduct") && rowData?.finalPrice === 0 ? "#EFCCCC" : "white"
                                })}
                                loading={loading || isUpdating}
                                onSelection={(d) => setSelectedProducts(d)}
                                // parentChildData={(row, rows) => {
                                //   return rows.find((a) => a.id === row.packageId)
                                // }}
                                cellEditable={{
                                  onCellEditApproved: (newValue, oldValue, rowData, columnDef) => {
                                    return new Promise((resolve, reject) => {
                                      rowData[columnDef.field] = parseInt(newValue)
                                      handleSingleEdit(rowData)

                                      setTimeout(resolve, 100)
                                    });
                                  }
                                }}
                              // onRowClick={(rowData) => {
                              //   setIsProductEdit(true)
                              //   setRecordToUpdate(rowData)
                              // }}
                              /> */}
                </Box>
            </>
            : <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
        }
        {addExistingProductDialog.open &&
            <AddExistingProductInventory
                isAddingProducts={isAddingProducts}
                addProductInventory={handleAddProductInventory}
                handleProductInventoryClose={() => { setAddExistingProductDialog({ open: false, type: "" }) }}
                productInventory={productInventory}
                type={addExistingProductDialog.type}
            />
        }
        {deleteData && <ConfirmationDialog
            open={true}
            message={`Are you sure you want to delete the record(s)?`}
            onClose={() => setDeleteData(null)}
            onOk={() => handleRemoveProductInventory(deleteData)}
            okBtnLoading={isDeleting}
        />}
        {isProductEdit.open &&
            <BulkEditInventoryDialog
                calculatePrice={calculatePricing}
                startDate={rentalManagementData.rentalStartDate}
                endDate={rentalManagementData.rentalEndDate}
                isSaving={false}
                onClose={() => {
                    setIsProductEdit({ open: false, editType: null })
                    setRecordToUpdate(null)
                }}
                submitBulkEdit={isProductEdit.editType === "single" ? handleSingleEdit : handleBulkEditData}
                currencySymbol={currencySymbol}
                data={recordToUpdate}
                selectedProducts={selectedProducts}
            />
            //New Form through Form Builder 
            // <RentalJobQtyDialog
            //     calculatePrice={calculatePricing}
            //     startDate={rentalManagementData.rentalStartDate}
            //     endDate={rentalManagementData.rentalEndDate}
            //     isSaving={isUpdating}
            //     onClose={() => {
            //         setIsProductEdit({ open: false, editType: null })
            //         setRecordToUpdate(null)
            //     }}
            //     submitBulkEdit={selectedProducts.length === 0 ? handleSingleUpdate : handleBulkEditData}
            //     rentalManagementData={rentalManagementData}
            //     data={recordToUpdate}
            //     selectedProducts={selectedProducts}
            // />
        }
        {Boolean(packageForProducts)
            && <PackageProductsDialog
                rentalId={rentalManagementData._id}
                packageId={packageForProducts?.id}
                products={packageForProducts?.products.map(p => p.id)}
                onClose={() => setPackageForProducts(null)}
                rentalApi={rentalManagement.rentalManagementApi}
                onSuccess={() => {
                    setPackageForProducts(null)
                    fetchProductInventory()
                }}
            />
        }
    </Fragment>
    );
};

export default Productpackage;
