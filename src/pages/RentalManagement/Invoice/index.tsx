
import Box from "@material-ui/core/Box/Box";
import React, { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer, DateRenderer, } from "../../../components/AgGridComponents/CustomAgGridCellRenderers";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Dialog, IconButton } from "@material-ui/core";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { CustomDialogTransition, customerContact, gridLoadingTimeout, purchaseOrder, rentalManagement, sidebarResource } from "../../../constants/helpers";
import { useData } from "../../../StateProvider/Provider";
import axiosInstance from "../../../axios/axiosInstance";
import { CreateEmail } from "../../../components/Activity/Email/CreateEmail";
import { isMobile, isTablet } from "react-device-detect";
import { AiFillFilePdf } from "react-icons/ai";
import routes from "../../../components/Helpers/Routes";
import CustomSwipableList from "../../../components/SwipableListComponents/CustomSwipableList";
import { BiPurchaseTagAlt, MdEmail } from "react-icons/all";
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import { getColumnData, getStaticFields, getFrameworkComponents, genrateColoum } from "../../../constants/columns"
import { prepareDataForGrid } from "../../../constants/helpers";
import CustomAgGridEditable from "../../../components/AgGridComponents/CustomAgGridEditable";
import { Link } from "react-router-dom";
import { startCase } from "lodash";


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
      updateJobStatus("Ready to Invoice")
    }
  }, []);

  useEffect(() => {
    axiosInstance().get("/field/child?resource=Rental Management Product").then(({ data: { data } }) => {
      let fields = CURReplaceByCurrencySingle(data, rentalManagementData.currency)
      axiosInstance().get("/field/child?resource=Rental Management Cost").then(({ data: { data } }) => {
        fields = [...fields, ...CURReplaceByCurrencySingle(data, rentalManagementData.currency)]
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
      })
    })
  }, []);

  const fetchData = () => {
    let combinedData: any = []
    axiosInstance().get(`${rentalManagement.rentalManagementApi}/productpackage/${rentalManagementData._id}`).then(({ data: { data } }) => {
      data?.material?.forEach((item) => {
        if (!item.parentId) {
          item.description = `${item.type === "product" ? item.productDetail?.productName : item.packageDetail?.packageName}`
          item.type = startCase(item.type);
          combinedData.push(item);
        }
      });
      axiosInstance().get(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}`).then(({ data: { data } }) => {
        data?.forEach((e) => {
          e.type = "Service";
        })
        combinedData = [...combinedData, ...data];
        let rows = combinedData?.map((item) => {
          let res: any = {
            ...prepareDataForGrid(item),
          };
          return res;
        });
        dispatch({ type: "initialize", data: rows, count: rows.length });
        dispatch({ type: "loading", loading: false });
      }).catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: "loading", loading: false });
      });
    }).catch((error) => {
      dispatch({ type: "loading", loading: false });
      toastConfig.setToastConfig(error)
    });
  };

  const onSendEmailSuccess = () => {

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

  return (<>
    <Box display="flex" justifyContent="space-between" m={1}>
      <Box display="flex" alignItems="center">
        {permissions?.rentalManagement?.isRead && (
          <Button
            variant="outlined"
            color="primary"
            type="button"
            size="small"
            disabled={downlodingFile === "Preview" ? true : false}
            startIcon={isMobile ? '' : <AiFillFilePdf />}
            onClick={() => handlePDF("Preview")}
          >
            {isMobile ? <AiFillFilePdf size={22} /> : downlodingFile === "Preview" ? "Please wait..." : "Preview"}
          </Button>
        )}
        <Box mx={1} />
        {permissions?.rentalManagement?.isRead && (
          <Button
            variant="outlined"
            color="primary"
            type="button"
            size="small"
            disabled={downlodingFile === "Download" ? true : false}
            startIcon={isMobile ? '' : <AiFillFilePdf />}
            onClick={() => handlePDF("Download")}
          >
            {isMobile ? <AiFillFilePdf size={22} /> : downlodingFile === "Download" ? "Please wait..." : "Download"}
          </Button>
        )}
        <Box mx={1} />
        {permissions?.rentalManagement?.isRead && <Button
          variant={isMobile ? "outlined" : "contained"}
          color="primary"
          size="small"
          disabled={downlodingFile === "Email" ? true : false}
          onClick={() => {
            handlePDF("Email")
          }}
        >
          {isMobile ? <MdEmail size={22} /> : downlodingFile === "Email" ? "Please wait..." : `Send Email`}
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
          setFullScreen(false);
        }}
        fullWidth
      >
        <CreateEmail
          generatingFile={generatingPdfFile}
          handleClose={() => {
            setSendEmail(false);
            setFullScreen(false);
          }}
          fetchData={onSendEmailSuccess}
          id={rentalManagementData._id}
          showESign={true}
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
          fromPurchaseOrder={true}
        />
      </Dialog>
    )}
  </>
  );
}

export default Invoice;