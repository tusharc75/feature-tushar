import React, { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, Button, Paper, CircularProgress, useMediaQuery, Typography, Tab, Tabs } from "@material-ui/core";
import { Skeleton, Alert } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import {
  getUniqueCurrencies, gridLoadingTimeout, rentalManagement, defaultActivityShow,
  dateFormat, pricingCondition, generateUniqueId, treeToFlatArray
} from "../../constants/helpers";
import Steps from "./Steps";
import AddExistingProductInventory from "./AddExistingProductInventory";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import IconButton from "@material-ui/core/IconButton/IconButton";
import Add from "@material-ui/icons/Add";
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import { MdEdit, MdDelete } from 'react-icons/md';
import DeliveryTicket from "./DeliveryTicket";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import ManageRentalManagementDialog from "./ManageRental/ManageRentalManagementDialog";
import ManageDeliveryTicket from "../DeliveryTicket/ManageDeliveryTicket";
import Activity from "../../components/Activity";
import styles from "./Retal.module.scss";
import ReceivingTicket from "./ReceivingTicket";
import ManageReceivingTicket from "../ReceivingTicket/ManageReceivingTicket";
import { CustomOfflineContext } from "../../StateProvider/OfflineContext/OfflineContext";
import HideWhenOffline from "../../components/HideWhenOffline";
import DeleteButton from "../../components/Helpers/DeleteButton";
import { CommonRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import HtmlTooltip from '../../components/CustomTooltipTitle'
import BulkEditInventoryDialog from './BulkEditInventoryDialog'
import RentalJobQtyDialog from './RentalJobQtyDialog'
import SerializedAssetStep from "./SerializedAssetStep";
import moment from "moment";
import { camelCase, startCase, orderBy } from "lodash";
import queryString from "query-string";
import PackageProductsDialog from './PackageProductsDialog'
import { FaWpforms } from "react-icons/fa";
import { BiFoodMenu } from "react-icons/bi";
import TabPanel from "../../components/TabPanel";
import { AddOutlined } from '@material-ui/icons';
import ManageAdditionalCostDialog from "./ManageAdditionalCostDialog";
import CustomReactTable from "../../components/CustomReactTable/CustomReactTable";
import NoDataCell from "../../components/Helpers/NoDataCell";

const rentalProcessSteps = ["New", "Additional Cost", "Serialized Asset", "Loading Ticket", "Receiving Ticket", "Ready To Ship"]

const RentalManagementDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { isOffline, offlineFieldsData, offlineGridData, updateOfflineGridData } = useContext(CustomOfflineContext);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit } = parsed;

  const {
    state: { user, permissions }
  }: any = useData();
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const isTabletScreen = useMediaQuery('(max-width:960px)');
  const [headingLbl, setHeadingLbl] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [isUpdating, setUpdating] = useState(false);
  const [isProductEdit, setIsProductEdit] = useState(false);
  const [recordToUpdate, setRecordToUpdate] = useState(null)
  const [rentalManagementData, setRentalManagementData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [isAddingProducts, setAddingProducts] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: "" });
  const [rentalManagementFields, setRentalManagementFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [warehouseList, setWarehouseList] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [additionalCost, setAdditionalCost] = useState<any[]>([]);
  const [productInventory, setProductInventory] = useState<any[]>([]);
  const [serializeAssets, setSerializeAssets] = useState<any[]>([]);
  const [productInventoryForDeliveryTicket, setProductInventoryForDeliveryTicket] = useState<any[]>([]);
  const [warehouseForDeliveryTicket, setWarehouseForDeliveryTicket] = useState(null);
  const [showDeliveryTicketDialog, setShowDeliveryTicketDialog] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState(null);
  const [currency, setCurrency] = useState("USD");
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [allowedToEdit, setAllowedToEdit] = useState(false)
  const [productInventoryForReceivingTicket, setProductInventoryForReceivingTicket] = useState<any[]>([]);
  const [showReceivingTicketDialog, setShowReceivingTicketDialog] = useState(false);
  const [isInOfflineSaveQueue, setIsInOfflineSaveQueue] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [packageForProducts, setPackageForProducts] = useState(null)
  const [nextStep, setNextStep] = useState(true)
  const [tabValue, setTabValue] = useState(0);
  const [showManageAdditionalCostDialog, setShowManageAdditionalCostDialog] = useState({
    open: false,
    isNew: false,
    record: null,
  })

  const [dataForNewTabData, setDataForNewTabData] = useState([]);

  const { pricingConditionApi } = pricingCondition

  const [additionalCostDeleteConfirmation, setAdditionalCostDeleteConfirmation] = useState({ open: false, id: null })
  const costTypeList = ["Repair", "Delivery", "Assembly"]
  const uomTypeList = ["Pcs"]
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity)
  }

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };


  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  useEffect(() => {
    if (id) {
      getRentalManagementFields();
      fetchRentalManagementData();
      fetchProductInventory();
    }
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (currentStep === 0) {
      fetchProductInventory()
    }

    if (currentStep === 2 && additionalCost.length > 0) {
      handleSaveAdditionalCost(additionalCost)
    }

    if (currentStep >= 0 && currentStep <= 4) {
      axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/process-status`, { "processStatus": rentalProcessSteps[currentStep] }).then(({ data }) => {
      }).catch((error) => {
        toastConfig.setToastConfig(error);
      });
    }
    // eslint-disable-next-line
  }, [currentStep]);

  useEffect(() => {
    if (isSmallScreen) {
      setActivityShow(true)
    }
  }, [isSmallScreen])

  const calculatePricing = (arr: any[]) => {
    //materialType can be =["product","packages","productCategory"]
    //conditionType can be =["Price","Rent","Discount","Charge","Tax"]
    if (rentalManagementData) {
      const data: any = {}
      data.conditionType = ["Rent"]
      data.material = arr.map(ele => ({
        materialId: ele?._id,
        materialType: ele?.type.includes("roduct") ? "product" : "packages",
        qty: ele?.qty,
        rentType: ele?.pricingMethod,
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

  const handleMainPoints = (data) => {
    let mainPoint = {};
    setMainPoints(mainPoint);
  };

  const handleSaveAdditionalCost = (values) => {
    axiosInstance()
      .post(`${rentalManagement.rentalManagementApi}/${id}/additional-cost`, {
        "additionalCost": values.map(d => ({
          "type": d.type,
          "value": d.amount ? Number(d.amount) : 0,
          "description": d?.description,
          "uom": d.uom,
          "qty": d.qty ? Number(d.qty) : 0
        }))
      })
      .then(() => {
        setAddExistingProductDialog({ open: false, type: "" })
      }).catch((error) => {
        toastConfig.setToastConfig(error)
      });
  }

  const fetchRentalManagementData = async () => {
    try {
      let data;

      if (!isOffline) {
        const response: any = await axiosInstance().get(`${rentalManagement.rentalManagementApi}/${id}`);
        data = response?.data?.data;
      } else {
        data = offlineGridData?.rentalManagement?.find(d => d._id === id)
      }

      if (localStorage.getItem("offlineDataToSave")) {
        const offlineDataToSave = JSON.parse(localStorage.getItem("offlineDataToSave"))
        if (offlineDataToSave["rentalManagement"]) {
          setIsInOfflineSaveQueue(offlineDataToSave["rentalManagement"].some(d => d.values._id === id));
        }
      }

      try {
        updateOfflineGridData("rentalManagement", [data], []);
      } catch (ex) {
        console.error(`Rental Management: Error while adding/updating data for Offline context. Error: ${ex.message}`)
      }

      handleMainPoints(data);
      setHeadingLbl(data.rentalJobName);
      setCustomizedRoutes([routes.rentalManagement, { title: `${data.rentalJobName}` }]);
      setRentalManagementData(data);
      setAdditionalCost(data?.additionalCost?.map((d, index) => { return { "id": d?._id, rowIndex: index + 1, "type": d.type, "amount": d?.value, "description": d?.description, "uom": d.uom, "qty": d.qty } }) ?? [])
      setCurrentStep(rentalProcessSteps.indexOf(data?.processStatus) !== -1 ? rentalProcessSteps.indexOf(data?.processStatus) : 0)
      setLoadingDetails(false);
      setCurrencySymbol(
        getUniqueCurrencies().find(
          (d) => d.currencyCode === data["currency"]
        )?.symbolNative
      );
      setCurrency(data?.currency);

      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);

      setAllowedToEdit(isAllowedToEdit);

      if (isAllowedToEdit && openEdit === "true") {
        setOpenUpdateDialog(true)
        const params = new URLSearchParams()
        params.delete("openEdit")
        history.push({ search: params.toString() })
      }

    } catch (error) {
      setLoadingDetails(false)
      toastConfig.setToastConfig(error);
    }
  };

  const getRentalManagementFields = async () => {
    try {
      if (!isOffline) {
        const response: any = await axiosInstance().get("/field?resource=Rental Management")
        setRentalManagementFields(response?.data?.data)
      } else {
        setRentalManagementFields(offlineFieldsData?.rentalManagement);
      }

    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance().put(`${rentalManagement.rentalManagementApi}/remove`, { "ids": [rentalManagementData._id] }).then(() => {
      try {
        updateOfflineGridData("rentalManagement", [], [rentalManagementData._id]);
      } catch (ex) {
        console.error(`Rental Management: Error while removing data for Offline context. Error: ${ex.message}`)
      }

      setShowConfirmBox(false);
      history.goBack();
    }).catch((error) => {
      toastConfig.setToastConfig(error)
      setShowConfirmBox(false);
    });
  }

  const handleDeliveryTicketDialog = (selectedProductInventory, warehouse) => {
    setProductInventoryForDeliveryTicket(selectedProductInventory)
    // setWarehouseForDeliveryTicket(warehouse)
    setShowDeliveryTicketDialog(true)
  }

  const handleReceivingTicketDialog = (selectedProductInventory) => {
    setProductInventoryForReceivingTicket(selectedProductInventory)
    // setWarehouseForReceivingTicket(warehouse)
    setShowReceivingTicketDialog(true)
  }

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
            current["qtyToDisplay"] = `${current.qty} x ${parent.qty} = ${current.qty * parent.qty}`

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


  const fetchProductInventory = () => {

    let tempInventory = []
    // dispatch({ type: "loading", loading: true });
    // if (gridApi) {
    //   gridApi.setRowData([]);
    // }

    axiosInstance().get(`${rentalManagement.rentalManagementApi}/${id}/products-packages`).then(({ data }) => {
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
      setSerializeAssets(data.data?.inventory || [])
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

      // dispatch({ type: "initialize", data: [], count: 0 })
      // dispatch({ type: "initialize", data: [...orderBy(newDataForReactTable, ["order"], ["asc"])], count: newDataForReactTable.length });

      // setTimeout(() => {
      //   dispatch({ type: "loading", loading: false });
      // }, gridLoadingTimeout);

      setSelectedProducts([])

    }).catch((error) => {
      toastConfig.setToastConfig(error);
      // dispatch({ type: "loading", loading: false });
    });
  };

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






  // const NameRenderer = (params) => (
  //   <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data.id}`}>
  //     {params.value}
  //   </Link>
  // );

  // const ProductRenderer = (params) => (
  //   <Link className="link" title={params.value} to={params.data.type === "Product" ? `${routes.productDetail.path}/${params.data.id}` : `${routes.packagesDetail.path}/${params.data.id}`}>
  //     {params.value}
  //   </Link>
  // );

  // // const PackageNameRenderer = (params) => (
  // //   params.value ? <Link className="link" title={params.value} to={`${routes.packagesDetail.path}/${params.data.packageId}`}>
  // //     {params.value}
  // //   </Link> : <NoDataCell />
  // // );

  // const ActionsRenderer = (params) => (
  //   <>
  //     <GridDeleteIcon
  //       hasDeletePermission={permissions?.rentalManagement?.isDelete}
  //       ownerId={user?.user?._id}
  //       userId={user?.user?._id}
  //       onDelete={() => {
  //         deleteInventories([{
  //           id: params.data.id,
  //           type: params.data?.type.toLowerCase()
  //         }])
  //       }
  //       }
  //       entity="rentalManagement"
  //     />
  //     {params.data.type === "Package" &&
  //       <HtmlTooltip title="Explode package">
  //         <IconButton
  //           onClick={() => explodePackage(params.data.id)}
  //           size="small"
  //           color='primary'
  //         >
  //           <GiMineExplosion />
  //         </IconButton>
  //       </HtmlTooltip>
  //     }
  //   </>
  // );

  // const frameworkComponents = {
  //   nameRenderer: NameRenderer,
  //   productRenderer: ProductRenderer,
  //   // packageNameRenderer: PackageNameRenderer,
  //   commonRenderer: CommonRenderer,
  //   actionsRenderer: ActionsRenderer,
  //   dateRenderer: DateRenderer,
  // };
  // const columns = [
  //   { field: "detail", headerName: "Detail", show: true, disabled: true, cellRenderer: "productRenderer" },
  //   { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
  //   // { field: "package", headerName: "Package", show: true, disabled: true, cellRenderer: "packageNameRenderer" },
  //   { field: "startDate", headerName: "Start Date", show: true, disabled: true, cellRenderer: "dateRenderer", cellEditor: "dateEditor", editable: true },
  //   { field: "endDate", headerName: "End Date", show: true, disabled: true, cellRenderer: "dateRenderer", cellEditor: "dateEditor", editable: true },
  //   { field: "qty", headerName: "Quantity", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
  //   { field: "UOM", headerName: "UOM", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "agSelectCellEditor", cellEditorParams: { cellRenderer: "commonRenderer", values: ["Pcs"] }, editable: true },
  //   { field: "pricingMethod", headerName: "Pricing Method", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "agSelectCellEditor", cellEditorParams: { cellRenderer: "commonRenderer", values: ["Per Day", "Per Week", "Per Month"] }, editable: true },
  //   { field: "price", headerName: "Price", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
  //   { field: "discount", headerName: "Discount (%)", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
  //   { field: "finalPrice", headerName: "Final Price", show: true, disabled: true, cellRenderer: "commonRenderer", cellEditor: "numericCellEditor", editable: true },
  // ];

  // const columnState = JSON.parse(localStorage.getItem("rentalManagementDetailsPageInventory"));
  // if (columnState) {
  //   columns.forEach((item) => {
  //     columnState.forEach((d) => {
  //       if (d.colId === item.field) {
  //         item.show = !d.hide;
  //       }
  //     });
  //   });
  // }


  const RentalJobTypeRenderer = (params) => (
    <span className="link" onClick={() => {
      setShowManageAdditionalCostDialog({
        open: true,
        isNew: false,
        record: params.data
      })
    }}>
      {params.value}
    </span>
    // <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data.id}`}>
    //   {params.value}
    // </Link>
  );

  const RentalJobActionsRenderer = (params) => (
    <GridDeleteIcon
      hasDeletePermission={true}
      ownerId={user?.user?._id}
      userId={user?.user?._id}
      onDelete={() => {
        setAdditionalCostDeleteConfirmation({ open: true, id: params.data.id })
      }}
      entity=""
    />
  );

  const rentalJobFrameworkComponents = {
    typeRenderer: RentalJobTypeRenderer,
    commonRenderer: CommonRenderer,
    actionsRenderer: RentalJobActionsRenderer
  };


  const handleClick = (rowData) => {
    setIsProductEdit(true)
    setRecordToUpdate(rowData)
  }


  const columns = [
    {
      accessor: 'detail',
      Header: 'Detail',
      Cell: ({ row }) => (
        <div style={{ width: 250, display: "flex", alignItems: 'center' }}>
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
      Header: `Price (${currencySymbol})`,
      Cell: ({ row }) => (
        row.original.price ? <p>{row.original.price}</p> : <NoDataCell />
      ),
      Footer: info => {
        const total = React.useMemo(
          () =>
            info.rows.filter(f => f.values.hasOwnProperty("price") && !isNaN(f.values.price)).reduce((sum, row) => row.values.price + sum, 0),
          [info.rows]
        )

        return <>{total}</>
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
        const total = React.useMemo(
          () =>
            info.rows.filter(f => f.values.hasOwnProperty("finalPrice") && !isNaN(f.values.finalPrice)).reduce((sum, row) => row.values.finalPrice + sum, 0),
          [info.rows]
        )

        return <>{currencySymbol} {total}</>
      }
    }
  ]



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
    axiosInstance().post(`${rentalManagement.rentalManagementApi}/${id}/products-packages`, { "productsPackages": tempProductArray })
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


  const deleteInventories = (data) => {
    setDeleteData(data)
  }

  const handleRemoveProductInventory = (productInventoryId) => {
    setDeleting(true)
    axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/products-packages/remove`, {
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

  // const explodePackage = (packageId) => {
  //   axiosInstance().get(`${rentalManagement.rentalManagementApi}/${id}/products-packages/explode/${packageId}`)
  //     .then(() => {
  //       fetchProductInventory()
  //     }).catch((error) => {
  //       toastConfig.setToastConfig(error)
  //     });
  // }

  const updateProductData = (data) => {

    let updatedArr = dataRows.map(d => {
      if (d.id === data.id) {
        return data
      } else {
        return d
      }
    }).map(d => ({
      "id": d.id,
      "qty": parseInt(d.quantity || d.qty) || 0,
      "type": d?.type ? camelCase(d.type) : "",
      "detail": d.detail,
      "pricingMethod": d?.pricingMethod || "",
      "UOM": d?.UOM || "",
      "finalPrice": parseInt(d.finalPrice) || 0,
      "price": parseInt(d.price) || 0,
      "discount": parseInt(d.discount) || 0,
      "startDate": d?.startDate || "",
      "endDate": d?.endDate || "",
    }))


    axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/products-packages`, { "productsPackages": updatedArr })
      .then(() => {
        fetchProductInventory()
      }).catch((error) => {
        toastConfig.setToastConfig(error)
      });
  }

  const handleBulkEditData = (values: any) => {
    let updatedArr = selectedProducts.filter(d => d.type !== "productInPackage")

    updatedArr = updatedArr.map(d => ({
      "id": d.id,
      "type": d?.type.toLowerCase(),
      "detail": d.detail,
      "pricingMethod": values.pricingMethod ? values.pricingMethod : d.pricingMethod,
      "UOM": values.UOM ? values.UOM : d.UOM,
      "finalPrice": values.finalPrice ? values.finalPrice : d.finalPrice,
      "discount": values.discount ? values.discount : d.discount,
      "startDate": values.startDate ? values.startDate : d.startDate,
      "endDate": values.endDate ? values.endDate : d.endDate,
      "qty": values.qty ? values.qty : d.qty,
      "price": values.price ? values.price : d.price
    })

    )

    setUpdating(true)
    axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/products-packages`, { "productsPackages": updatedArr })
      .then(() => {
        setUpdating(false)
        setIsProductEdit(false)
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
    axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/products-packages/updateOne`, rest)
      .then(() => {
        setUpdating(false)
        setIsProductEdit(false)
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
    axiosInstance().put(`${rentalManagement.rentalManagementApi}/${id}/products-packages/updateOne`, rest)
      .then(() => {
        setUpdating(false)
        setIsProductEdit(false)
        fetchProductInventory()
      }).catch((error) => {
        setUpdating(false)
        toastConfig.setToastConfig(error)
      });
  }


  // const checkIsValidRecord = (rowData) => {
  //   if (rowData?.type === "Product") {
  //     return (!isNaN(rowData?.finalPrice) && rowData?.finalPrice !== 0)
  //   }
  //   else if (rowData?.type === "Package") {
  //     return true;
  //   }
  //   else {
  //     const parentRecord = dataRows.find(f => f.treeId === rowData?.parent)
  //     if (parentRecord) {
  //       return (!isNaN(parentRecord?.finalPrice) && parentRecord?.finalPrice !== 0)
  //     }
  //   }
  // }

  // const restrictToGoNextStep = () => {
  //   let isValid = false;

  //   dataRows.forEach(rowData => {
  //     if (rowData?.type === "Product") {
  //       if (isNaN(rowData?.finalPrice) || rowData?.finalPrice === 0) {
  //         isValid = false;
  //         return;
  //       }
  //     }
  //     else if (rowData?.type === "Package") {
  //       return true;
  //     }
  //     else {
  //       const parentRecord = dataRows.find(f => f.treeId === rowData?.parent)
  //       if (parentRecord) {
  //         return (!isNaN(parentRecord?.finalPrice) && parentRecord?.finalPrice !== 0)
  //       }
  //     }
  //   });

  //   return isValid;

  //   if (productInventory.length > 0) {
  //     console.log(productInventory);
  //     // !(productInventory.length > 0 ? (productInventory.filter(f => f.type !== "productInPackage").some(f => !f?.hasOwnProperty("finalPrice") || isNaN(f?.finalPrice) || f?.finalPrice === 0) ? false : true) : false)
  //   }
  //   return true;
  // }

  return (
    <>

      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </Grid>
      <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`} >
        <div>
          <div>
            <Paper>
              {!rentalManagementData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                    <Box marginX={1} />
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                  </Box>
                </div>
              ) : (
                <DetailsPageHeader
                  heading={headingLbl}
                  mainPoints={mainPoints}
                  showHeading={true}
                >

                  {permissions?.rentalManagement?.isUpdate && allowedToEdit && (
                    <Button
                      className="buttonStyleBigScreen"
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleOpenUpdateDialog}
                    >
                      Edit
                    </Button>
                  )}
                  {permissions?.rentalManagement?.isUpdate && allowedToEdit && (
                    <Button
                      className="buttonStyleSmallScreen"
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleOpenUpdateDialog}
                    >
                      <MdEdit size={24} />
                    </Button>
                  )}

                  <HideWhenOffline>
                    {permissions?.rentalManagement?.isDelete &&
                      rentalManagementData?.owner?.optionValue &&
                      user?.user?._id &&
                      rentalManagementData.owner.optionValue === user.user._id ? (
                      <DeleteButton
                        text="Delete"
                        className="buttonDeleteBigScreen"
                        onClick={() => setShowConfirmBox(true)}
                      />
                    ) : null}
                  </HideWhenOffline>
                  <HideWhenOffline>
                    {permissions?.rentalManagement?.isDelete &&
                      rentalManagementData?.owner?.optionValue &&
                      user?.user?._id &&
                      rentalManagementData.owner.optionValue === user.user._id ? (
                      <Button
                        className="buttonDeleteSmallScreen"
                        onClick={() => setShowConfirmBox(true)}
                      >
                        <MdDelete size={24} />
                      </Button>
                    ) : null}
                  </HideWhenOffline>
                </DetailsPageHeader>
              )}





              <Tabs
                className="quote-tab"
                value={tabValue}
                onChange={handleMainTabChange}
                textColor="primary"
                TabIndicatorProps={{
                  style: {
                    display: 'none'
                  }
                }}
              >
                {/* <Tab
                        className={"tabLayout"}
                      style={{
                        background: tabValue === 0 ? "white" : "",
                        color: tabValue === 0 ? "blue" : "#163340",
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font ">
                          <InfoIcon className="mr-1" fontSize="inherit" /> All
                          Version Status
                        </div>
                      }
                      {...a11yProps(0)}
                    /> */}
                <Tab
                  className={'tabLayout'}
                  style={{
                    background: tabValue === 1 ? 'white' : '',
                    color: tabValue === 1 ? '#163340' : '#163340'
                  }}
                  label={
                    <div className="d-flex align-items-center tab-font">
                      <FaWpforms className="mr-1" fontSize="inherit" /> Header
                    </div>
                  }
                  {...a11yProps(0)}
                />
                <Tab
                  className={'tabLayout'}
                  style={{
                    background: tabValue === 2 ? 'white' : '',
                    color: tabValue === 2 ? 'blue' : '#163340'
                  }}
                  label={
                    <div className="d-flex align-items-center tab-font">
                      <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                    </div>
                  }
                  {...a11yProps(1)}
                />
                <div className={'uio'}> </div>
              </Tabs>


              <TabPanel value={tabValue} index={0}>
                <Box>
                  {loadingDetails || !rentalManagementFields.length ? (
                    <Grid container spacing={2} style={{ padding: "8px" }}>
                      <CommonSkeleton lenArray={[...Array(7).keys()]} />
                    </Grid>
                  ) : (
                    <>
                      {
                        isInOfflineSaveQueue && <div className="px-3">
                          <Alert variant="filled" severity="info">Updates are in offline state, it will be affected once you will be in network</Alert>
                        </div>
                      }

                      <DetailsPage data={rentalManagementData} fields={rentalManagementFields} />
                    </>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Paper>
                  <Steps
                    className={styles.steps_box}
                    isNextStep={treeToFlatArray(dataForNewTabData, "subRows").some(f => f.isValid === false)}
                    nextStep={nextStep}
                    steps={rentalProcessSteps.slice(0, 5)}
                    currentStep={currentStep}
                    setCurrentStep={setCurrentStep}
                  />
                  {(currentStep === 0) && (
                    <>
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
                                onClick={() => setIsProductEdit(true)}
                              >
                                Bulk Edit
                              </Button>
                            </span>
                          </HtmlTooltip>
                          <Box mx={1} />
                          <HtmlTooltip title={Boolean(selectedProducts && selectedProducts.length) ? "Delete selected records" : "Select records to delete"}>
                            <span>

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
                            </span>
                          </HtmlTooltip>
                        </Box>
                      </Box>
                      {columns ?
                        <>
                          {/* <CustomAgGridEditable
                        columns={columns}
                        dataRows={dataRows}
                        frameworkComponents={frameworkComponents}
                        setGridApi={setGridApi}
                        dispatch={dispatch}
                        rowCount={rowCount}
                        limit={limit}
                        pageSizes={pageSizes}
                        page={page}
                        actionWidth={150}
                        allowAction={true}
                        loading={loading}
                        onCellValueChanged={(row) => { updateProductData(row.data) }}
                        renderedFrom="rentalManagementDetailsPageInventory"
                        refreshGrid={fetchProductInventory}
                      /> */}
                          <Box
                            p="6px"
                            zIndex={5}
                            width={
                              isTabletScreen
                                ? "calc(100vw - 20px)"
                                : isSmallScreen
                                  ? "calc(100vw - 78px)"
                                  : showActivity ? "100%" : "calc(100vw - 100px)"
                            }
                            height="calc(100vh - 330px)"
                          >
                            <CustomReactTable
                              height="calc(100vh - 345px)"
                              columns={columns}
                              data={dataForNewTabData}
                              rowStyle={(rowData) => ({
                                color: "black",
                                backgroundColor: rowData.isValid ? "white" : "#EFCCCC"
                              })}
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
                        : <Box
                          p={2}
                          height={500}
                          bgcolor="white">
                          <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                      }
                    </>
                  )}
                  {(currentStep === 1) && (
                    <div className="mx-2">
                      <div className="d-flex justify-content-end mb-2">
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          className={styles.add_submit_btn}
                          onClick={() => {
                            setShowManageAdditionalCostDialog({
                              open: true,
                              isNew: true,
                              record: null,
                            })
                          }}
                          startIcon={<AddOutlined />}
                        >
                          Add
                        </Button>
                      </div>
                      <CustomAgGrid
                        columns={[
                          { field: "rowIndex", headerName: "#" },
                          // { field: "sequence", headerName: "#", show: true, disabled: true },
                          { field: "type", headerName: "Cost Type", show: true, disabled: true, cellRenderer: "typeRenderer" },
                          { field: "description", headerName: "Description", show: true, disabled: true },
                          { field: "qty", headerName: "Quantity", show: true, disabled: true },
                          { field: "uom", headerName: "Unit of Measure", show: true, disabled: true },
                          { field: "amount", headerName: `Amount (${currencySymbol})`, show: true, disabled: true },
                        ]}
                        dataRows={additionalCost}
                        frameworkComponents={rentalJobFrameworkComponents}
                        setGridApi={setGridApi}
                        dispatch={dispatch}
                        rowCount={rowCount}
                        limit={limit}
                        pageSizes={pageSizes}
                        page={page}
                        actionWidth={150}
                        allowSelection={false}
                        allowAction={true}
                        loading={loading}
                        isClientSideGrid={true}
                        // onCellValueChanged={(row) => { updateProductData(row.data) }}
                        renderedFrom="rental_job_additional_cost"
                        refreshGrid={() => { }}
                        idProperty="id"
                      />
                    </div>

                  )}
                  {(currentStep === 2) && (
                    <SerializedAssetStep
                      rentalManagementId={id}
                      productInventory={[
                        ...productInventory,
                        ...serializeAssets
                      ]}
                      fetchProductsData={fetchProductInventory}
                      isSmallScreen={isSmallScreen}
                      isTabletScreen={isTabletScreen}
                      showActivity={showActivity}
                      currentStep={currentStep}
                      currencySymbol={currencySymbol}
                      loading={loading}
                      serializeAssets={serializeAssets}
                      setNextStep={setNextStep}
                    />
                  )}
                  {(currentStep === 3) && (
                    <DeliveryTicket
                      fetchRentalData={fetchRentalManagementData}
                      rentalManagementData={rentalManagementData}
                      rentalManagementId={id}
                      warehouselist={warehouseList}
                      productInventory={serializeAssets}
                      currentStep={currentStep}
                      handleDeliveryTicketDialog={handleDeliveryTicketDialog}
                    />
                  )}
                  {(currentStep === 4 || currentStep === 5) && (
                    <ReceivingTicket
                      rentalManagementId={id}
                      productInventory={productInventory}
                      currentStep={currentStep}
                      handleReceivingTicketDialog={handleReceivingTicketDialog}
                    />
                  )}
                </Paper>
              </TabPanel>



            </Paper>
          </div>
          <Box my={1} />

        </div>
        <div className="position-relative">
          <HideWhenOffline>
            {/* {showActivity ?
                <Paper>
                  {!isMobile && !isTablet && <span className="activityHide cursor-pointer" onClick={handleActivityHideShow}>
                    <IoIosArrowDropright className="icon" />
                  </span>}
                  <Grid container>
                    <Grid item xs={12}>
                      {rentalManagementData && (
                        <div>
                          <Activity
                            resourceId={rentalManagementData._id}
                            resource={rentalManagement.resource}
                            restrictedAddActivities={
                              permissions &&
                                permissions["rentalManagement"] &&
                                permissions["rentalManagement"].isUpdate
                                ? []
                                : ["Attachment", "Case"]
                            }
                            relatedTo={[
                              {
                                type: rentalManagement,
                                referenceId: rentalManagementData._id,
                                access: true,
                              },
                            ]}
                            handleActivityRefresh={() => { }}
                            emails={[]}
                          />
                        </div>
                      )}
                    </Grid>
                  </Grid>
                </Paper> :
                !isMobile && !isTablet && <span className="activityShow cursor-pointer" onClick={handleActivityHideShow}>
                  <IoIosArrowDropleft className="icon" />
                </span>} */}

            <Paper>
              {!isSmallScreen && <span className={`${showActivity ? "activityHide" : "activityShow"} cursor-pointer`} onClick={handleActivityHideShow}>
                {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
              </span>}
              <div style={{ display: showActivity ? "block" : "none" }}>

                <Grid container>
                  <Grid item xs={12}>
                    {rentalManagementData && (
                      <div>
                        <Activity
                          resourceId={rentalManagementData._id}
                          resource={rentalManagement.resource}
                          restrictedAddActivities={
                            permissions &&
                              permissions["rentalManagement"] &&
                              permissions["rentalManagement"].isUpdate
                              ? []
                              : ["Attachment", "Case"]
                          }
                          relatedTo={[
                            {
                              type: rentalManagement,
                              referenceId: rentalManagementData._id,
                              access: true,
                            },
                          ]}
                          handleActivityRefresh={() => { }}
                          emails={[]}
                        />
                      </div>
                    )}
                  </Grid>
                </Grid>
              </div>
            </Paper>
          </HideWhenOffline>
        </div>
      </div>

      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.rentalManagement.title.toLowerCase()} ?`
          }
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {addExistingProductDialog.open &&
        <AddExistingProductInventory
          isAddingProducts={isAddingProducts}
          addProductInventory={handleAddProductInventory}
          handleProductInventoryClose={() => { setAddExistingProductDialog({ open: false, type: "" }) }}
          productInventory={productInventory}
          type={addExistingProductDialog.type}
        />
      }
      {
        openUpdateDialog && (
          <ManageRentalManagementDialog
            isClone={false}
            open={openUpdateDialog}
            rentalManagementId={id}
            rentalManagementData={rentalManagementData}
            onClose={() => setOpenUpdateDialog(false)}
            onSuccess={() => {
              setOpenUpdateDialog(false);
              fetchRentalManagementData();
            }}
          />)
      }
      {
        showDeliveryTicketDialog &&
        <ManageDeliveryTicket
          onClose={() => setShowDeliveryTicketDialog(false)}
          productInventoryForDeliveryTicket={productInventoryForDeliveryTicket}
          warehouseId={warehouseForDeliveryTicket}
          rentalData={rentalManagementData}
          onSuccess={() => {
            setShowDeliveryTicketDialog(false)
            fetchProductInventory()
          }}
        />
      }
      {
        showReceivingTicketDialog && <ManageReceivingTicket
          open={showReceivingTicketDialog}
          isClone={false}
          receivingTicketId={null}
          productInventoryForReceivingTicket={productInventoryForReceivingTicket}
          rentalData={rentalManagementData}
          onClose={() => setShowReceivingTicketDialog(false)}
          onSuccess={() => {
            setShowReceivingTicketDialog(false)
            fetchProductInventory()
          }}
          isRedirectToDetailPage={false}
        />
      }
      {deleteData && <ConfirmationDialog
        open={true}
        message={`Are you sure you want to delete the record(s)?`}
        onClose={() => setDeleteData(null)}
        onOk={() => handleRemoveProductInventory(deleteData)}
        okBtnLoading={isDeleting}
      />}
      {Boolean(packageForProducts)
        && <PackageProductsDialog
          rentalId={id}
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
      {isProductEdit &&
        <BulkEditInventoryDialog
          calculatePrice={calculatePricing}
          startDate={rentalManagementData.rentalStartDate}
          endDate={rentalManagementData.rentalEndDate}
          isSaving={isUpdating}
          onClose={() => {
            setIsProductEdit(false)
            setRecordToUpdate(null)
          }}
          submitBulkEdit={recordToUpdate ? handleSingleEdit : handleBulkEditData}
          currencySymbol={currencySymbol}
          data={recordToUpdate}
          selectedProducts={selectedProducts}
        />
        //New Form through Form Builder 
        // <RentalJobQtyDialog
        //   calculatePrice={calculatePricing}
        //   startDate={rentalManagementData.rentalStartDate}
        //   endDate={rentalManagementData.rentalEndDate}
        //   isSaving={isUpdating}
        //   onClose={() => {
        //     setIsProductEdit(false)
        //     setRecordToUpdate(null)
        //   }}
        //   submitBulkEdit={selectedProducts.length === 0 ? handleSingleUpdate : handleBulkEditData}
        //   currency={currency}
        //   data={recordToUpdate}
        //   selectedProducts={selectedProducts}
        // />
      }
      {
        showManageAdditionalCostDialog.open && <ManageAdditionalCostDialog
          open={showManageAdditionalCostDialog.open}
          isNew={showManageAdditionalCostDialog.isNew}
          record={showManageAdditionalCostDialog.record}
          onClose={() => {
            setShowManageAdditionalCostDialog({
              open: false,
              isNew: false,
              record: null
            })
          }}
          onSubmit={(values) => {
            if (showManageAdditionalCostDialog.isNew) {
              if (additionalCost) {
                setAdditionalCost(prevState => [...prevState, { ...values, rowIndex: prevState.length + 1 }])
              } else {
                setAdditionalCost([{ ...values, rowIndex: 1 }]);
              }
            }
            else {
              setAdditionalCost(prevState => prevState.map(item => item.id === values.id ? { ...item, ...values } : item))
            }

            setShowManageAdditionalCostDialog({
              open: false,
              isNew: false,
              record: null
            })
          }}
          currencySymbol={currencySymbol}
          costTypeList={costTypeList}
          uomTypeList={uomTypeList}
        />
      }
      {
        additionalCostDeleteConfirmation.open && <ConfirmationDialog
          open={additionalCostDeleteConfirmation.open}
          message="Are you sure you want to delete additional cost ?"
          onClose={() => setAdditionalCostDeleteConfirmation({ open: false, id: null })}
          onOk={() => {
            setAdditionalCostDeleteConfirmation({ open: false, id: null });

            const recordsExpectDeleted = additionalCost.filter(f => f.id !== additionalCostDeleteConfirmation.id);
            setAdditionalCost([...recordsExpectDeleted.map((m, index) => ({ ...m, rowIndex: index + 1 }))]);
          }}
        />
      }
    </>
  );
};

export default RentalManagementDetailsPage;