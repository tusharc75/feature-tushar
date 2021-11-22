import React, { useState, useEffect, useContext, Fragment, useReducer } from "react";
import { Grid, Box, Button, Paper, Typography, IconButton, Tab, Tabs } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
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
import { productInventory, getObjKeysWithValues, gridLoadingTimeout, product, RESOURCE_LABEL, sidebarResource } from "../../constants/helpers";
import ManageProductInventory from "./ManageProductInventory";
import ExpandMore from '@material-ui/icons/ExpandMore';
import MenuItem from "@material-ui/core/MenuItem"
import Menu from "@material-ui/core/Menu"
import ReasonDialog from "./ReasonDialog"
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import ManageRepairJob from '../RepairJob/ManageRepairJob'
import { Link } from 'react-router-dom'
import NoDataCell from "../../components/Helpers/NoDataCell";
import BoxWithBorder from "../../components/BoxWithBorder";
import ProductHierarchy from "../Product/ProductHierarchy";
import { FaDiceOne, FaWpforms } from "react-icons/fa";
import { isMobile } from "react-device-detect";
import { BiFoodMenu } from "react-icons/bi";
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import CustomTimeline from "../../components/CustomTimeline";
import {GiAutoRepair, GrStatusInfo} from "react-icons/all";
import {MdEdit} from "react-icons/md";




const storedRoutes = localStorage.getItem("routes") ? JSON.parse(localStorage.getItem("routes")) : null;

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`main-tabpanel-${index}`} aria-labelledby={`main-tab-${index}`} {...other}>
      {children}
    </div>
  );
}



const ProductInventoryDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [loadingProductInventory, setLoadingProductInventory] = useState(false);
  const [showRepairJobDialog, setShowRepairJobDialog] = useState(false);
  const [productInventoryData, setProductInventoryData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [productInventoryFields, setProductInventoryFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [productId, setProductId] = useState(null);
  const [statusOptions, setStatusOptions] = useState([])
  const [showReasonDialog, setShowReasonDialog] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [loadingBOMData, setLoadingBOMData] = useState(false)
  const [customField, setCustomField] = useState({
    fieldData: {
      fieldLabel: "Scraping Reason",
      fieldName: "scrapingReason",
      type: "singleLine",
      sectionName: "Product Inventory"
    }
  })
  const [BOMData, setBOMData] = useState([])
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;





  const [tabValue, setTabValue] = useState(0);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };


  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }



  const NameRenderer = (params) => (
    <>{
      params.value ? (
        params.data.type === "Receiving Ticket" ?
          <Link className="link" title={params.value} to={`${routes.receivingTicketDetail.path}/${params.data.referenceId}`}>
            {params.value}
          </Link> : params.data.type.toLowerCase() === "repair" ?
            <Link className="link" title={params.value} to={`${routes.repairJobDetail.path}/${params.data.referenceId}`}>
              {params.value}
            </Link>
            : params.data.type.toLowerCase() === "rental" ?
              <Link className="link" title={params.value} to={`${routes.rentalManagementDetail.path}/${params.data.referenceId}`}>
                {params.value}
              </Link> : params.data.type === sidebarResource.deliveryTicket ?
                <Link className="link" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.referenceId}`}>
                  {params.value}
                </Link> : params.value
      ) : (
        <NoDataCell />
      )
    }

    </>
  );
  const frameworkComponents = {
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer,
  };
  const columns = [
    { field: "reference", headerName: "Reference", show: true, cellRenderer: "nameRenderer" },
    { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "date", headerName: "Date & Time", show: true, disabled: true, cellRenderer: "dateRenderer" },
    { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
    { field: "comments", headerName: "Comments", show: true, cellRenderer: "commonRenderer" },
  ];

  useEffect(() => {
    if (id) {
      fetchAllData()
    }

  }, [id]);

  useEffect(() => {
    getProductTree()
  }, [productId])

  const fetchAllData = () => {
    getProductInventoryFields();
    fetchProductInventoryData();
    fetchProductInventoryHistory();
  }


  const handleMainPoints = (data) => {
    let mainPoint = {};
    // mainPoint['Account Name'] = data?.accountName?.optionLabel || '';
    setMainPoints(mainPoint);
  };

  const fetchProductInventoryHistory = () => {
    dispatch({ type: "loading", loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance().get(`/history/inventory/${id}`).then(({ data: { data } }) => {
      data = data?.map((u) => ({
        ...u,
        id: u.inventory?._id,
        reference: u.reference?.optionLabel,
        referenceId: u.reference?.optionValue
      }));
      dispatch({ type: "initialize", data: data, count: data.length });
      dispatch({ type: "loading", loading: false });
    }).catch((error) => {
      toastConfig.setToastConfig(error);
      dispatch({ type: "loading", loading: false });
    });
  };

  const fetchProductInventoryData = async () => {
    setLoadingProductInventory(true);
    try {
      const {
        data: { data },
      } = await axiosInstance().get(`${productInventory.api}/${id}`);

      handleMainPoints(data);
      setHeadingLbl(`${data?.serialNumber ?? ''} ${data?.product?.optionLabel ? '-' + data?.product?.optionLabel : ""}`);
      setCustomizedRoutes([routes.productInventory,
      { title: `${data?.serialNumber ?? ''} ${data?.product?.optionLabel ? '-' + data?.product?.optionLabel : ""}` }]);
      setProductId(data?.product?.optionValue)
      setProductInventoryData(data);
      setLoadingProductInventory(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getProductInventoryFields = () => {
    axiosInstance()
      .get("/field?resource=Product Inventory")
      .then(({ data }) => {
        if (data.data && data.data.length) {
          data.data.some(o => {
            if (o?.fieldData?.fieldName === "status") {
              setStatusOptions([...o.fieldData.option])
              return true
            }
          })
        }
        setProductInventoryFields(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const getProductTree = () => {
    if (productId) {
      setLoadingBOMData(true)
      axiosInstance()
        .get(`/product/bom/${productId}`)
        .then(({ data: { data } }) => {
          data = data.map(o => {
            if (o?.parent) {
              o.type = "child"
            }
            return o
          })
          setBOMData([...data])
          setLoadingBOMData(false)
        }).catch(err => {
          setLoadingBOMData(false)
        })
    }
  }

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {

    axiosInstance().put(`${productInventory.api}/remove`, { "ids": [] }).then(() => {
      setShowConfirmBox(false);
      history.goBack();
    }).catch((error) => {
      toastConfig.setToastConfig(error)
      setShowConfirmBox(false);
    });
  }

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };
  const handleStatusChange = o => {
    if (o.optionValue === "Scrap") {
      setShowReasonDialog(true)
    }
    else {
      handleUpdateData({ status: o.optionValue })
    }
  }

  const handleUpdateData = (obj) => {
    setUpdateLoading(true)
    if (obj.status) {
      const fieldsDataForUpdate = productInventoryFields.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      let values = getObjKeysWithValues(productInventoryData, fieldsDataForUpdate)
      values["status"] = obj.status
      if (obj.reason) values["scrapingReason"] = obj.reason
      values["_id"] = productInventoryData._id
      axiosInstance().put(`${productInventory.api}`, values).then(({ data: { data } }) => {
        setUpdateLoading(false)
        fetchProductInventoryData()
      }).catch((error) => {
        setUpdateLoading(false)
        toastConfig.setToastConfig(error);
      });
    }
  }

  return (
    <>
      <Fragment>

        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
            <Paper>
              {!productInventoryData ? (
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
                  {permissions?.productInventory?.isUpdate && (
                    <>
                      <Button
                        variant="outlined"
                        color="default"
                        size="small"
                        onClick={() => setShowRepairJobDialog(true)}
                      >
                        {isMobile ? <GiAutoRepair size={20}/> : "Create Repair Job"}

                      </Button>
                      <Button
                        variant="outlined"
                        color="default"
                        size="small"
                        onClick={openActions}
                        disabled={updateLoading}
                        aria-controls="action-menu"
                        endIcon={isMobile ? <ExpandMore style={{width: "12px" , height:"12px"}}/> : <ExpandMore />}
                      >
                        {isMobile ? <GrStatusInfo size={20}/> : "Change Status"}
                      </Button>
                      <Menu
                        anchorEl={anchorEl}
                        keepMounted
                        getContentAnchorEl={null}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'left'
                        }}
                        id="action-menu"
                        open={Boolean(anchorEl)}
                        onClose={closeActions}>
                        {
                          statusOptions.map(o => {
                            return <MenuItem
                              onClick={() => {
                                closeActions()
                                handleStatusChange(o)
                              }}
                              value={o}>{o?.optionLabel}</MenuItem>
                          })
                        }
                      </Menu>
                      <Button
                        variant= {isMobile ? "text" : "outlined"}
                        color="primary"
                        size="small"
                        onClick={handleOpenUpdateDialog}
                      >
                        {isMobile ? <MdEdit size={22}/> : "Edit"}
                      </Button>
                    </>
                  )}

                </DetailsPageHeader>
              )}

              {/*For Desktop*/}
              <Box display={isMobile ? "none" : ""}>
                {loadingProductInventory || !productInventoryFields.length ? (
                  <Grid container spacing={2} style={{ padding: "8px" }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <>
                    <DetailsPage data={productInventoryData}
                      fields={productInventoryData?.status &&
                        productInventoryData?.status === "Scrap" ?
                        [...productInventoryFields, customField] :
                        productInventoryFields} />
                  </>
                )}
              </Box>
              <Grid container spacing={2} style={isMobile ? { display: "none" } : { display: "" }}>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                  <div className="detail-box">
                    <div className="detail-box-content">
                      <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                      <h3 className="form-label-style" title="Asset History">
                        Asset History
                      </h3>
                    </div>

                    <Grid item xs={12} sm={12} md={12} lg={12} className="mt-1">
                      {columns ?
                        <CustomAgGrid
                          columns={columns}
                          dataRows={dataRows}
                          frameworkComponents={frameworkComponents}
                          setGridApi={setGridApi}
                          dispatch={dispatch}
                          rowCount={rowCount}
                          limit={limit}
                          pageSizes={pageSizes}
                          page={page}
                          allowAction={false}
                          allowSelection={false}
                          isClientSideGrid={true}
                          loading={loading}
                          renderedFrom="rentalManagementDetailsPageInventory"
                          refreshGrid={fetchProductInventoryHistory}
                        />
                        : <Box
                          p={2}
                          height={500}
                          bgcolor="white">
                          <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                      }
                    </Grid>

                  </div>
                </Grid>

              </Grid>


              {/*For Mobile*/}



              <Tabs
                className="quote-tab"
                value={tabValue}
                style={isMobile ? { display: "" } : { display: "none" }}
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
                    color: tabValue === 2 ? 'blue' : '#163340',
                    display: "flex !important"
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

                <Box display={isMobile ? "flex" : "none"}>
                  {loadingProductInventory || !productInventoryFields.length ? (
                    <Grid container spacing={2} style={{ padding: "8px" }}>
                      <CommonSkeleton lenArray={[...Array(7).keys()]} />
                    </Grid>
                  ) : (
                    <>
                      <DetailsPage data={productInventoryData}
                        fields={productInventoryData?.status &&
                          productInventoryData?.status === "Scrap" ?
                          [...productInventoryFields, customField] :
                          productInventoryFields} />
                    </>
                  )}
                </Box>


              </TabPanel>


              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <div className="detail-box">
                      <div className="detail-box-content">
                        <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                        <h3 className="form-label-style" title="Asset History">
                          Asset History
                        </h3>
                      </div>
                      <div>
                        <CustomTimeline />
                      </div>

                      <Grid item xs={12} sm={12} md={12} lg={12} className="mt-1">
                        {columns ?



                          isMobile ? <CustomSwipableList
                            allowSelection={false}
                            allowSwipe={false}
                            permissions={permissions.productInventory}
                            primaryField={columns?.find((d: any) => d?.field === "reference")}
                            onClick={(data) => { console.log(data) }}
                            dataRows={dataRows}
                            dispatch={dispatch}
                            onClone={() => { }}
                            selectedRecords={selectedRecords}
                            showClone={false}
                            onEdit={() => { }}
                            extraParamsToCheckDelete={false}
                            onDelete={() => { }}
                            rowCount={rowCount}
                            page={page}
                            loading={loading}
                            additionalDetails={[]}
                            chips={[]}
                            owerCollaboratorInitialsOrImages=""
                            onCreate={() => { }}
                            renderedFrom={productInventory.route}
                          /> :
                            <CustomAgGrid
                              columns={columns}
                              dataRows={dataRows}
                              frameworkComponents={frameworkComponents}
                              setGridApi={setGridApi}
                              dispatch={dispatch}
                              rowCount={rowCount}
                              limit={limit}
                              pageSizes={pageSizes}
                              page={page}
                              allowAction={false}
                              allowSelection={false}
                              isClientSideGrid={true}
                              loading={loading}
                              renderedFrom="rentalManagementDetailsPageInventory"
                              refreshGrid={fetchProductInventoryHistory}
                            />
                          : <Box
                            p={2}
                            height={500}
                            bgcolor="white">
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                          </Box>
                        }
                      </Grid>

                    </div>
                  </Grid>

                </Grid>

              </TabPanel>









            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} spacing={2}>
            <Paper style={{ overflow: 'hidden' }}>
              <Box
                padding={1}
                bgcolor="grey.200"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="subtitle2">
                  BOM - Product
                </Typography>
              </Box>
              {(
                <Box>
                  {loading || loadingBOMData ? (
                    [1].map((i) => (
                      <BoxWithBorder
                        key={i}
                        style={{
                          margin: "8px",
                        }}
                      >
                        <Box padding={1}>
                          <Skeleton
                            variant="text"
                            width="100px"
                            height="20px"
                          />
                          <Box marginTop={1} />
                          <Skeleton variant="text" width="100%" height="15px" />
                        </Box>
                      </BoxWithBorder>
                    ))
                  ) : BOMData.length ? (
                    <>
                      <ProductHierarchy
                        data={BOMData}
                        permissions={permissions?.product}
                        unassignProduct={() => { }}
                      />
                      <Box px={1} my={1} >
                        <Button
                          fullWidth
                          variant="outlined"
                          color='primary'
                          onClick={() => history.push(`${routes.productDetail.path}/${productId}/bom`, { productName: productInventoryData?.product?.optionLabel })}>
                          View All
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <Box textAlign="center" padding={2} minHeight={150}>
                      <Typography>No Product has been added </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

      </Fragment>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${storedRoutes ? storedRoutes.productInventory?.title : RESOURCE_LABEL.productInventory} ?`
          }
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {
        showRepairJobDialog &&
        <ManageRepairJob
          fromInventory
          inventories={[id]}
          open={showRepairJobDialog}
          onClose={() => setShowRepairJobDialog(false)}
          onSuccess={() => {
            setShowRepairJobDialog(false);
            fetchAllData()
          }}
        />
      }
      {openUpdateDialog &&
        <ManageProductInventory
          isClone={false}
          productInventoryId={id}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchProductInventoryData()
          }}
        />
      }
      {
        showReasonDialog ?
          <ReasonDialog
            onClose={() => setShowReasonDialog(false)}
            onAddReason={(reason) => {
              handleUpdateData({ status: "Scrap", reason: reason })
              setShowReasonDialog(false)
            }}
          /> : null
      }
    </>
  );
};

export default ProductInventoryDetailsPage;
