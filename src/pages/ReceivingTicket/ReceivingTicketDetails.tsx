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
import { getObjKeysWithValues, gridLoadingTimeout, productInventory, receivingTicket } from '../../constants/helpers';
import ManageReceivingTicket from './ManageReceivingTicket';
import DeleteButton from '../../components/Helpers/DeleteButton';
import SignatureDialog from '../../components/Helpers/SignatureDialog';
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import { Link } from "react-router-dom";
import { CommonRenderer, CreatedByRenderer, DateRenderer, UpdatedByRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';

const mappedStatus = {
  "Start Delivery": "In-Transit",
  "Sign-Off": "Delivered"
}

const ReceivingTicketDetails = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
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
    mainPoint['Delivery Person'] = data?.deliveryPerson.optionLabel || '';
    mainPoint['Status'] = data?.status || '';
    setMainPoints(mainPoint);
  };

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
        handleMainPoints(data)
        setHeadingLabel(data.receivingJobName);
        setCustomizedRoutes([routes.receivingTicket, { title: data.receivingJobName }]);
        getRessourceFields();
        if (data?.productInventory && data?.productInventory.length) {
          let ids = data?.productInventory.map(o => o?.optionValue)
          fetchProductInventory(ids)
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

  let label = receivingTicketData ? receivingTicketData?.status === "New" ? "Start Delivery" :
    (receivingTicketData?.status === "In-Transit") ? "Sign-Off" : "" : ""

  const handleSignature = (signedData) => {
    const { type, sign: newSign } = signedData;
    let stateArr = signatures;
    const existingData = signatures.find(d => d.type === type)

    if (existingData) {
      stateArr = stateArr.map(d => {
        if (d.type === type) {
          d.sign = newSign.split("base64,")[1]
        }
        return d
      })
    } else {
      stateArr.push(signedData);
    }

    if (stateArr.length === 2) {
      setSignatures(stateArr)
      setSubmittingSign(true)
      axiosInstance().put(`${receivingTicket.receivingTicketApi}/signature`, {
        _id: id,
        signatures: stateArr.map(d => ({ type: d.type, signature: d.sign, status: label }))
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
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
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
                  {permissions?.receivingTicket?.isUpdate && (
                    <Button variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                      Edit
                    </Button>
                  )}
                  {permissions?.receivingTicket?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
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
                </DetailsPageHeader>
              )}

              <Box>
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
                          <Grid container>
                            <Grid item xs={12}>
                              <Box
                                component="div"
                                display="flex"
                                alignItems="center"
                                flexGrow={1}
                              >
                                <Box padding="5px">
                                  <Typography variant="subtitle1">
                                    Product Inventory
                                  </Typography>
                                </Box>
                              </Box>
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
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} spacing={2}></Grid>
        </Grid>
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
          steps={label === "Start Delivery" ? ["Supervisor", "Delivery Person"] : ["Delivery Person", "Receiver"]}
          forDelivery={true}
          open={true}
          onClose={() => {
            setOpenSignatureDialog(false)
            setSignatures([])
          }}
          onSigned={handleSignature}
        />}
    </>
  );
};

export default ReceivingTicketDetails;
