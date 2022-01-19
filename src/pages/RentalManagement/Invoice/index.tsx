
import Box from "@material-ui/core/Box/Box";
import React, { useState, useEffect, useReducer, useContext, Fragment } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer, } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Dialog, IconButton } from "@material-ui/core";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { CustomDialogTransition, customerContact, gridLoadingTimeout, purchaseOrder, rentalManagement, RENTAL_STATUS, sidebarResource } from "../../../constants/helpers";
import { useData } from "../../../StateProvider/Provider";
import axiosInstance from "../../../axios/axiosInstance";
import { CreateEmail } from "../../../components/Activity/Email/CreateEmail";
import { isMobile, isTablet } from "react-device-detect";
import { AiFillFilePdf } from "react-icons/ai";
import routes from "../../../components/Helpers/Routes";
import { BiPurchaseTagAlt, IoMdDownload, MdEmail } from "react-icons/all";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import { getColumnData, getStaticFields, getFrameworkComponents, genrateColoum } from "../../../constants/columns"
import { prepareDataForGrid, CHILD_RESOURCE } from "../../../constants/helpers";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import { Link } from "react-router-dom";
import { startCase } from "lodash";
import { CustomOfflineContext } from "../../../StateProvider/OfflineContext/OfflineContext";
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import AdditionalCostDialog from "../AdditionalCost/AdditionalCostDialog";


const Invoice = ({ rentalManagementData, setNextStep, fetchRentalData, updateJobStatus, statusOptions }) => {

  const toastConfig = useContext(CustomToastContext);
  const { state: { user, permissions } }: any = useData();

  const [sendEmail, setSendEmail] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
  const [generatingPdfFile, setGeneratingFile] = useState(false);

  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [columns, setColumns] = useState([
    { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "description", headerName: "Description", show: true, disabled: true, cellRenderer: "commonRenderer" }
  ])
  const [frameWorkComponent, setFrameWorkComponent] = useState(null)

  const [downlodingFile, setDownlodingFile] = useState(null)
  const [emailAttachments, setEmailAttachments] = useState([]);
  const { isOffline } = useContext(CustomOfflineContext);
  const [showCostDialog, setShowCostDialog] = useState(false)

  const NameRenderer = (params) => (
    <Link
      className="link"
      title={params.value}
      to={`${routes.productDetail.path}/${params.data.productId}`}
    >
      {params.value}
    </Link>
  );

  useEffect(() => {
    if (statusOptions.findIndex(d => d.optionLabel === "Ready to Invoice") > statusOptions.findIndex(d => d.optionLabel === rentalManagementData?.status)) {
      if (!isOffline) {
        updateJobStatus("Ready to Invoice")
      }
    }
  }, []);

  useEffect(() => {
    fetchFields()
  }, [isOffline]);

  const fetchFields = async () => {
    try {
      let fields = []
      if (isOffline) {
        const resultProduct = await findOne(objectStore.resource, "rentalManagementProduct")
        fields = CURReplaceByCurrencySingle(resultProduct, rentalManagementData.currency)
        const resultCost = await findOne(objectStore.resource, "rentalManagementCost")
        fields = [...fields, ...CURReplaceByCurrencySingle(resultCost, rentalManagementData.currency)]
      }
      else {
        const resultProduct = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementProduct}`)
        fields = CURReplaceByCurrencySingle(resultProduct?.data?.data, rentalManagementData.currency)
        const resultCost = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementCost}`)
        fields = [...fields, ...CURReplaceByCurrencySingle(resultCost?.data?.data, rentalManagementData.currency)]
      }
      let rendererNames = [];
      genrateColoum(fields, columns, rendererNames, false);
      let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
      tempFrameworkComponent = {
        commonRenderer: CommonRenderer,
        nameRenderer: NameRenderer,
        ...tempFrameworkComponent,
      }
      setFrameWorkComponent({ ...tempFrameworkComponent })
      setColumns([...columns])
      fetchData()
    }
    catch (error) {
      toastConfig.setToastConfig(error)
    }
  }

  const fetchData = async () => {
    let combinedData: any = []
    let material: any = []
    let additionalcost: any = []
    try {
      dispatch({ type: "loading", loading: true });
      if (isOffline) {
        const result = await findOne(objectStore.rentalManagement, rentalManagementData._id);
        material = result?.material;
        additionalcost = result?.additionalCost;
      }
      else {
        const resultMaterial = await axiosInstance().get(`${rentalManagement.rentalManagementApi}/productpackage/${rentalManagementData._id}?isInvoice=true`)
        material = resultMaterial?.data?.data?.material;
        const resultCost = await axiosInstance().get(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}`)
        additionalcost = resultCost?.data?.data;
      }
      material?.forEach((item) => {
        if (!item.parentId) {
          item.description = `${item.type === "product" ? item.productDetail?.productName : item.packageDetail?.packageName}`
          item.type = startCase(item.type);
          combinedData.push(item);
        }
      });
      additionalcost?.forEach((e) => {
        e.type = "Ad-hoc Charge";
      })
      combinedData = [...combinedData, ...additionalcost];
      let rows = combinedData?.map((item) => {
        let res: any = {
          ...prepareDataForGrid(item),
        };
        return res;
      });
      dispatch({ type: "initialize", data: rows, count: rows.length });
      dispatch({ type: "loading", loading: false });
    }
    catch (error) {
      dispatch({ type: "loading", loading: false });
      toastConfig.setToastConfig(error)
    }
  };

  const handlePDF = (type) => {
    setDownlodingFile(type);
    axiosInstance().get(`${rentalManagement.rentalManagementApi}/${rentalManagementData._id}/pdf`).then(({ data }) => {
      axiosInstance().get(`user/download?fileName=${data.data.fileName}`, {
        responseType: "blob",
      })
        .then(({ data }) => {
          if (type === "Download") {
            const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Rental-${rentalManagementData.rentalJobName}.pdf`);
            document.body.appendChild(link);
            link.click();
            setDownlodingFile(null);
          }
          else if (type === "Preview") {
            const file = new Blob([data], { type: "application/pdf" });
            const fileURL = URL.createObjectURL(file);
            const pdfWindow = window.open();
            pdfWindow.location.href = fileURL;
            setDownlodingFile(null);
          }
          else {
            const file = new Blob([data], { type: 'application/pdf' });
            generateBase64forFile(file, 'pdf');
          }
        })
        .catch((err) => {
          if (type === "Email") {
            setSendEmail(true)
          }
          toastConfig.setToastConfig(err);
          setDownlodingFile(null);
        });
    }).catch((err) => {
      if (type === "Email") {
        setSendEmail(true)
      }
      toastConfig.setToastConfig(err);
      setDownlodingFile(null);
    })
  }

  const generateBase64forFile = (blobData, type) => {
    let reader = new FileReader();
    reader.readAsDataURL(blobData);
    reader.onloadend = function () {
      let base64data: any = reader.result;
      if (type === 'pdf') {
        const attachments = [{
          base64: base64data.substring(parseInt(base64data.indexOf(',') + 1)),
          contentType: base64data.split(';')[0].split(':')[1],
          name: `Rental-${rentalManagementData.rentalJobName}`
        }];
        setEmailAttachments(attachments)
        setSendEmail(true)
      }
    };
  };

  const fetchEmailsData = () => {
    let ownerCollaboratorEmails = [];
    if (rentalManagementData?.collaborator && rentalManagementData.collaborator.length) {
      ownerCollaboratorEmails = rentalManagementData.collaborator.filter((o) => o?.email).map((o) => o?.email);
    }
    if (rentalManagementData?.owner?.email) {
      ownerCollaboratorEmails.push(rentalManagementData.owner.email);
    }
    let toEmails = [];
    if (rentalManagementData?.customerAccount?.email) {
      toEmails.push(rentalManagementData.customerAccount.email);
    }
    setUserEmails({ cc: [...ownerCollaboratorEmails], to: [...toEmails] });
  }

  const handleAddCost = (rows) => {
    axiosInstance().post(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}/add`, { additionalCost: rows })
      .then(() => {
        fetchData()
        setShowCostDialog(false)
      }).catch((error) => {
        toastConfig.setToastConfig(error)
      });
  }

  return (<>
    <Box display="flex" justifyContent="space-between" m={1}>
      <Box display="flex" alignItems="center">
        {(!isOffline && ![RENTAL_STATUS.invoiced, RENTAL_STATUS.closed].includes(rentalManagementData.status)) &&
          <Fragment>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              disabled={isOffline}
              onClick={() => {
                setShowCostDialog(true);
              }}
            >
              Add Ad-hoc Charge
            </Button>
            <Box mx={1} />
          </Fragment>
        }
        {permissions?.rentalManagement?.isRead && (
          <Button
            variant={isMobile && !isTablet ? "text" : "outlined"}
            color="primary"
            type="button"
            size="small"
            style={isMobile && !isTablet ? { color: "var(--info-dark)" } : {}}
            disabled={downlodingFile === "Preview" ? true : (false || isOffline)}
            startIcon={isMobile ? '' : <AiFillFilePdf />}
            onClick={() => handlePDF("Preview")}
          >
            {isMobile && !isTablet ? <AiFillFilePdf size={18} /> : downlodingFile === "Preview" ? "Please wait..." : "Preview"}
          </Button>
        )}
        <Box mx={1} />
        {permissions?.rentalManagement?.isRead && (
          <Button
            variant={isMobile && !isTablet ? 'text' : 'outlined'}
            color="primary"
            type="button"
            size="small"
            style={isMobile && !isTablet ? { color: "var(--warning-darken)" } : {}}
            disabled={downlodingFile === "Download" ? true : (false || isOffline)}
            startIcon={isMobile ? '' : <IoMdDownload />}
            onClick={() => handlePDF("Download")}
          >
            {isMobile && !isTablet ? <IoMdDownload size={20} /> : downlodingFile === "Download" ? "Please wait..." : "Download"}
          </Button>
        )}
        <Box mx={1} />
        {permissions?.rentalManagement?.isRead && <Button
          variant={isMobile && !isTablet ? 'text' : 'outlined'}
          color="primary"
          size="small"
          style={isMobile && !isTablet ? { color: "var(--danger-light)" } : {}}
          disabled={downlodingFile === "Email" ? true : (false || isOffline)}
          onClick={() => {
            fetchEmailsData()
            handlePDF("Email")
          }}
        >
          {isMobile && !isTablet ? <MdEmail size={20} /> : downlodingFile === "Email" ? "Please wait..." : `Send Email`}
        </Button>}
      </Box>
    </Box>
    <Grid item xs={12} md={12} sm={12} className="mt-3">
      {columns && frameWorkComponent ?
        <CustomAgGridEditable
          columns={columns}
          dataRows={dataRows}
          frameworkComponents={frameWorkComponent}
          setGridApi={setGridApi}
          dispatch={dispatch}
          rowCount={rowCount}
          limit={limit}
          pageSizes={pageSizes}
          page={page}
          allowAction={false}
          loading={loading}
          allowSelection={false}
          isClientSideGrid={true}
          renderedFrom="rentalManagmentInvoicePage"
          refreshGrid={fetchData}
          fromPurchaseOrderGrid={true}
          onCellValueChanged={(row) => {
          }}
          currency={rentalManagementData?.currency?.toLowerCase()}
          footerIgnoreFields={["tenure"]}
        />
        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
      }
    </Grid>
    {sendEmail && (
      <Dialog
        open={sendEmail}
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        maxWidth="md"
        onClose={() => {
          setSendEmail(false);
          setDownlodingFile(null);
          setFullScreen(false);
        }}
        fullWidth
      >
        <CreateEmail
          generatingFile={generatingPdfFile}
          handleClose={() => {
            setSendEmail(false);
            setDownlodingFile(null);
            setFullScreen(false);
          }}
          fetchData={() => {
            setSendEmail(false);
            setDownlodingFile(null);
            setFullScreen(false);
          }}
          id={rentalManagementData._id}
          isQuoteBuilder={true}
          options={userEmails?.to}
          cc={userEmails?.cc ?? []}
          emailId={null}
          qouteBuilderAttachments={emailAttachments}
          subject={`${user?.user?.brandName ?? 'Brand'} Invoice - ${rentalManagementData?.rentalJobName ?? ''}`}
          fromQuote={true}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
          refrenceType="rentalJob"
        />
      </Dialog>
    )}
    {showCostDialog &&
      <AdditionalCostDialog
        onClose={() => {
          setShowCostDialog(false)
        }}
        handleAddCost={handleAddCost}
        handleUpdateCost={() => { return false }}
        currency={rentalManagementData?.currency}
        costData={null}
      />
    }
  </>
  );
}

export default Invoice;