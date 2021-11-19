import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Grid, Box, Button, Paper, Typography } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { defaultActivityShow, getObjKeysWithValues, gridLoadingTimeout, productInventory, receivingTicket } from '../../constants/helpers';
import ManageReceivingTicket from './ManageReceivingTicket';
import DeleteButton from '../../components/Helpers/DeleteButton';
import SignatureDialog from '../../components/Helpers/SignatureDialog';
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { Link } from "react-router-dom";
import { CommonRenderer, CreatedByRenderer, DateRenderer, UpdatedByRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import queryString from "query-string";
import ViewSignsDialog from '../DeliveryTicket/ViewSignsDialog';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import Activity from "../../components/Activity";
import { isMobile, isTablet } from "react-device-detect";

const mappedStatus = {
  "Sign-off - Dispatch": "In-Transit",
  "Sign-off - Receive": "Delivered"
}

const ReceivingTicketDetails = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit } = parsed;
  const {
    state: { user, permissions }
  }: any = useData();
  const [headingLabel, setHeadingLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [receivingTicketData, setReceivingTicketData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [receivingTicketFields, setReceivingTicketFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [signatures, setSignatures] = useState([]);
  const [submittingSign, setSubmittingSign] = useState(false);
  const [openSigns, setOpenSigns] = useState(false);
  const [showActivity, setActivityShow] = useState(defaultActivityShow);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, page, limit, pageSizes } = state;
  useEffect(() => {
    if (id) {
      fetchReceivingTicketData()
    }
    // eslint-disable-next-line
  }, [id]);

  const handleMainPoints = (data) => {
    let mainPoint = {};
    mainPoint['Receiving Job Name'] = data?.receivingJobName || '';
    mainPoint['Delivery Person'] = data?.deliveryPerson?.optionLabel || '';
    mainPoint['Status'] = data?.status || '';
    setMainPoints(mainPoint);
  };

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity)
  }

  const getRessourceFields = () => {
    setLoading(true);
    axiosInstance()
      .get('/field?resource=Receiving Ticket')
      .then(({ data: { data } }) => {
        setReceivingTicketFields(data)
        setLoading(false)
      })
      .catch((err) => {
        setLoading(false)
        toastConfig.setToastConfig(err);
      });
  };

  const fetchReceivingTicketData = () => {
    setLoading(true);
    axiosInstance()
      .get(`${routes.receivingTicket.path}/${id}`)
      .then(({ data: { data } }) => {
        setReceivingTicketData(data)
        setSignatures(data?.signatures || []);
        handleMainPoints(data)
        setHeadingLabel(data.receivingJobName);
        setCustomizedRoutes([routes.receivingTicket, { title: data.receivingJobName }]);
        getRessourceFields();
        if (data?.productInventory && data?.productInventory.length) {
          let ids = data?.productInventory.map(o => o?.optionValue)
          fetchProductInventory(ids)
        }

        if (permissions?.receivingTicket?.isUpdate && openEdit === "true") {
          setOpenUpdateDialog(true)
          const params = new URLSearchParams()
          params.delete("openEdit")
          history.push({ search: params.toString() })
        }
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${receivingTicket.receivingTicketApi}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleChangeStatus = (label) => {
    if (mappedStatus[label]) {
      const fieldsDataForUpdate = receivingTicketFields.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      let values = getObjKeysWithValues(receivingTicketData, fieldsDataForUpdate)
      values["status"] = mappedStatus[label]
      values["_id"] = receivingTicketData._id
      axiosInstance().put(`${receivingTicket.receivingTicketApi}`, values).then(({ data: { data } }) => {
        fetchReceivingTicketData()
      }).catch((error) => {
        toastConfig.setToastConfig(error);
      });
    }
  }

  let label = receivingTicketData ? receivingTicketData?.status === "New" ? "Sign-off - Dispatch" :
    (receivingTicketData?.status === "In-Transit") ? "Sign-off - Receive" : "" : ""

  const handleSignature = (signedData) => {
    const { type, sign: newSign } = signedData;
    let stateArr = signatures;
    stateArr.push({ type, signature: newSign, status: label === "Sign-off - Dispatch" ? "Start Delivery" : "Sign-Off" });
    setSignatures(stateArr)

    if (stateArr.length === 2 || stateArr.length === 4) {
      setSubmittingSign(true)
      axiosInstance().put(`${receivingTicket.receivingTicketApi}/signature`, {
        _id: id,
        signatures: stateArr
      }).then(() => {
        handleChangeStatus(label)
        setOpenSignatureDialog(false)
        setSubmittingSign(false)
        setSignatures([])
      }).catch((error) => {
        toastConfig.setToastConfig(error);
        setOpenSignatureDialog(false)
        setSubmittingSign(false)
        setSignatures([])
      });
    }
  }

  const columns = [
    { field: "serialNumber", headerName: "Serial Number", show: true, disabled: true, cellRenderer: "nameRenderer" },
    { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "productRenderer" },
    { field: "productCategory", headerName: "Product Category", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "description", headerName: "Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "equipmentNumber", headerName: "Equipment Number", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "commonRenderer" },
    { field: "batchNumber", headerName: "Batch Number", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "bornOnDate", headerName: "Born on Date", show: true, cellRenderer: "dateRenderer" },
    { field: "inServiceDate", headerName: "In Service Date", show: true, cellRenderer: "dateRenderer" },
    { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
    { field: "inventoryNumber", headerName: "Inventory Number", show: true, cellRenderer: "commonRenderer" },
    { field: "warehouse", headerName: "Plants", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
  ];

  const NameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const ProductRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.product.path}/detail/${params.data.productId}`}>
      {params.value}
    </Link>
  );
  const frameworkComponents = {
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer,
    productRenderer: ProductRenderer
  };

  const columnState = JSON.parse(localStorage.getItem("receivingTicketDetailInventoryPage"));
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }
  const fetchProductInventory = (productInventories) => {
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }
    let ids = JSON.stringify(productInventories)
    const queryString = `?getById=${ids}`
    axiosInstance().get(`${productInventory.api}${queryString} `).then(({ data }) => {
      data.data = data.data.filter((u) => productInventories.indexOf(u?._id) >= 0)
        ?.map((u) => ({
          ...u,
          id: u._id,
          inServiceDate: u.inServiceDate,
          bornInDate: u.bornInDate,
          status: u.status,
          warehouse: u.warehouse?.optionLabel,
          warehouseId: u.warehouse?.optionValue,
          productCategory: u.productCategory?.optionLabel,
          productName: u.product?.optionLabel,
          productId: u.product?.optionValue,
          createdBy: u.createdBy?.user?.concatedName,
          createdByDate: u.createdBy?.date,
          updatedBy: u.updatedBy?.user?.concatedName,
          updatedByDate: u.updatedBy?.date,
        }));

      dispatch({ type: "initialize", data: data.data, count: data.count });
      setTimeout(() => {
        dispatch({ type: "loading", loading: false });
      }, gridLoadingTimeout);

    }).catch((error) => {
      toastConfig.setToastConfig(error);
      dispatch({ type: "loading", loading: false });
    });
  };

  return (
    <>
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`} >
          <div>
            <Paper>
              {!receivingTicketData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                    <Box marginX={1} />
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  </Box>
                </div>
              ) : (
                <DetailsPageHeader heading={headingLabel} mainPoints={mainPoints} showHeading={true}>
                  {/* {permissions?.receivingTicket?.isUpdate && (
                    <Button variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                      Edit
                    </Button>
                  )}
                  {permissions?.receivingTicket?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />} */}
                  {
                    receivingTicketData?.deliveryPerson?.optionValue === user?.user?._id ?
                      label !== "" ?
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          disabled={loading}
                          onClick={() => setOpenSignatureDialog(true)}>
                          {label}
                        </Button> : null : null
                  }
                  {
                    receivingTicketData?.deliveryPerson?.optionValue === user?.user?._id && (receivingTicketData?.status === "In-Transit" || receivingTicketData?.status === "Delivered") ?
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => setOpenSigns(true)}>
                        View Signatures
                      </Button> : null
                  }
                </DetailsPageHeader>
              )}

              {loading || !receivingTicketFields.length ? (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                  <CommonSkeleton lenArray={[...Array(7).keys()]} />
                </Grid>
              ) : (
                <>
                  <DetailsPage data={receivingTicketData} fields={receivingTicketFields} />
                  {
                    dataRows && dataRows.length ?
                      <>
                        <Grid container spacing={1} className="p-2">
                          <Grid item xs={12} className="mt-2">
                            <Typography variant="subtitle1" className="font-weight-bold text-primary">
                              Serialized Assets
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <CustomAgGrid
                              allowSelection={false}
                              allowAction={false}
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
                              loading={false}
                              renderedFrom="receivingTicketDetailInventoryPage"
                              refreshGrid={fetchProductInventory}
                            />
                          </Grid>
                        </Grid>
                      </>
                      : null
                  }
                </>
              )}
            </Paper>
          </div>
          <div className="position-relative">
            {showActivity ?
              <Paper>
                {!isMobile && !isTablet && <span className="activityHide cursor-pointer" onClick={handleActivityHideShow}>
                  <IoIosArrowDropright className="icon" />
                </span>}
                {!receivingTicketData ? (
                  <Box>
                    <Skeleton variant="text" width="100px" height="25px" />
                    <Box marginY={1} />
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} width="100%" height="50px" />
                    ))}
                  </Box>
                ) : (
                  <div>
                    <Activity
                      resourceId={receivingTicketData?._id}
                      resource={receivingTicket.receivingTicketResource}
                      restrictedAddActivities={["Attachment", "Case"]}
                      relatedTo={[
                        {
                          type: receivingTicket.receivingTicketResource,
                          referenceId: receivingTicketData?._id,
                          access: true,
                        },
                      ]}
                      handleActivityRefresh={() => { }}
                      //   emails={contactsEmailsData}
                      emails={null}
                    />
                  </div>
                )}
              </Paper> :
              !isMobile && !isTablet && <span className="activityShow cursor-pointer" onClick={handleActivityHideShow}>
                <IoIosArrowDropleft className="icon" />
              </span>}
          </div>
        </div>

      </Fragment>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this receiving ticket: ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageReceivingTicket
          open={openUpdateDialog}
          isClone={false}
          receivingTicketId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            getRessourceFields();
            setOpenUpdateDialog(false);
          }}
        />
      )}
      {openSignatureDialog &&
        <SignatureDialog
          submitting={submittingSign}
          label={label}
          steps={label === "Sign-off - Dispatch" ? ["Supervisor", "Delivery Person"] : ["Delivery Person", "Receiver"]}
          forDelivery={true}
          open={true}
          onClose={() => {
            setOpenSignatureDialog(false)
            setSignatures([])
          }}
          onSigned={handleSignature}
        />}
      {openSigns &&
        <ViewSignsDialog
          signatures={receivingTicketData?.signatures}
          close={() => setOpenSigns(false)}
        />}
    </>
  );
};

export default ReceivingTicketDetails;
