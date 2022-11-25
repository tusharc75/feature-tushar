
import Box from "@material-ui/core/Box/Box";
import React, { useState, useEffect, useReducer, useContext, Fragment } from "react";
import CommonSkeleton from "../../../components/Helpers/CommonSkeleton";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, Chip, Dialog, IconButton, Menu, MenuItem } from "@material-ui/core";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { CustomDialogTransition, customerContact, dateFormat, formatAmountWithCurrency, gridLoadingTimeout, INVENTORY_STATUS, purchaseOrder, rentalManagement, RENTAL_STATUS, serializedAsset, sidebarResource } from "../../../constants/helpers";
import { useData } from "../../../StateProvider/Provider";
import axiosInstance from "../../../axios/axiosInstance";
import { CreateEmail } from "../../../components/Activity/Email/CreateEmail";
import { isMobile, isTablet } from "react-device-detect";
import { AiFillFilePdf } from "react-icons/ai";
import routes from "../../../components/Helpers/Routes";
import { IoMdDownload, MdEmail } from "react-icons/all";
import { startCase } from "lodash";
import { CustomOfflineContext } from "../../../StateProvider/OfflineContext/OfflineContext";
import { objectStore, findOne } from '../../../constants/indexdbhelper';
import AdditionalCostDialog from "../AdditionalCost/AdditionalCostDialog";
import { fetch_rental_product_fields, fetch_rental_cost_fields } from '../../../components/RentalManagment/helper';
import CustomReactTable from "src/components/CustomReactTable/CustomReactTable";
import moment from "moment";
import NoDataCell from "src/components/Helpers/NoDataCell";


const Invoice = ({ rentalManagementData, isTabletScreen, isSmallScreen, setNextStep, fetchRentalData, updateJobStatus, statusOptions, renderedFrom, showActivity, stepFullScreen, currencySymbol, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state: { user, permissions } }: any = useData();

  const [sendEmail, setSendEmail] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [userEmails, setUserEmails] = useState({ to: [], cc: [] });
  const [generatingPdfFile, setGeneratingFile] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downlodingFile, setDownlodingFile] = useState(null)

  const [emailAttachments, setEmailAttachments] = useState([]);
  const { isOffline } = useContext(CustomOfflineContext);
  const [showCostDialog, setShowCostDialog] = useState(false)

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  useEffect(() => {
    if (statusOptions.findIndex(d => d.optionLabel === RENTAL_STATUS.readyToInvoice) > statusOptions.findIndex(d => d.optionLabel === rentalManagementData?.status)) {
      if (!isOffline && rentalManagementData?.status !== RENTAL_STATUS.cancelled) {
        updateJobStatus(RENTAL_STATUS.readyToInvoice)
      }
    }
  }, []);

  useEffect(() => {
    fetchFields()
  }, [isOffline]);

  const fetchFields = async () => {
    try {
      let { fields } = await fetch_rental_product_fields(rentalManagementData.currency, isOffline);
      const resultCost = await fetch_rental_cost_fields(rentalManagementData.currency, isOffline);
      fields = [...fields, ...resultCost]
      fields = [...new Map(fields.map(item => [item["fieldName"], item])).values()];
      const coloum: any = [
        {
          accessor: 'srno',
          Header: 'Index',
          width: 70,
          Cell: ({ row }) => (
            <p className="text-truncate"  >
              {row.original.srno}
            </p>),
        },
        {
          accessor: 'type',
          Header: 'Type',
          disableFilters: true,
          width: 200,
          Cell: ({ row }) =>
            row.original['type'] ? (
              <p>
                {`${startCase(row.original?.type)} `}
                {row.original['type'] === 'product' ? row.original?.productDetail?.serializedProduct ? '(Serialized)' : '(Non-Serialized)' :
                  row.original?.type === 'package' ? row.original?.packageDetail.packageType === 'Product' ? '(Product)' : '(Service)' :
                    row.original.type === 'service' ? row?.original?.serviceDetail?.serviceType && `(${row?.original?.serviceDetail?.serviceType})` : ''}
              </p>
            ) : (
              <NoDataCell />
            )
        },
        {
          accessor: 'detail',
          Header: 'Details',
          width: 300,
          Cell: ({ row }) => (
            <div className="d-flex gap-2 align-items-center">
              <p className="text-truncate" title={row.original.detail}  >
                {!isOffline ?
                  row.original?.type === "product" ?
                    <a className="link text-truncate" href={`${routes.productDetail.path}/${row.original.materialId}`} target="_blank">{row.original.detail}</a> :
                    row.original?.type === "service" ?
                      <a className="link text-truncate" href={`${routes.serviceMasterDetail.path}/${row.original.materialId}`} target="_blank">{row.original.detail}</a>
                      : row.original?.type === "package" ?
                        <a className="link text-truncate" href={`${routes.packagesDetail.path}/${row.original.materialId}`} target="_blank">{row.original.detail}</a>
                        : <a className="link text-truncate" href={`${routes.serializedAssetDetail.path}/${row.original._id}`} target="_blank">{row.original.detail}</a>
                  : row.original.detail}
              </p>
            </div>),
          Footer: () => {
            return <>Total</>
          }
        },
        {
          accessor: 'status',
          Header: 'Status',
          width: 200,
          Cell: ({ row }) => (
            <p className="text-truncate"  >
              {row.original.status ? row.original.status : <NoDataCell />}
            </p>),
        }]
      fields.forEach(element => {
        if (element.type === "date") {
          coloum.push({
            accessor: element.fieldName,
            Header: element.fieldLabel,
            disableFilters: true,
            Cell: ({ row }) => (
              row.original[element.fieldName] ? <p>{moment(row.original[element.fieldName].slice(0, 10)).format(dateFormat)}</p> : <NoDataCell />
            )
          })
        }
        else if (element.type === "converter" || element.type === "currencyAmount" || element.isConverter === true) {
          if (element.type !== "currencyAmount" && (element.type === "converter" || element.isConverter === true)) {
            element.displayUnits.forEach((_unit) => {
              let fieldName = element.fieldName + "_" + _unit.toLowerCase()
              let fieldLabel = element.fieldLabel + " " + _unit
              coloum.push({
                accessor: fieldName,
                Header: fieldLabel,
                Cell: ({ row }) => (
                  row.original[fieldName] ? <p>{row.original[fieldName]}</p> : <NoDataCell />
                )
              })
            })
          }
          else if (element.type === "currencyAmount" && (element.type === "converter" || element.isConverter === true)) {
            element.displayUnits.forEach((_unit) => {
              element.displayCurrency.forEach((_currency) => {
                let fieldName = element.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase()
                let fieldLabel = element.fieldLabel + " " + _unit + "/" + _currency
                coloum.push({
                  accessor: fieldName,
                  Header: fieldLabel,
                  Cell: ({ row }) => (
                    row.original[fieldName] ? <p>{formatAmountWithCurrency(rentalManagementData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p> : <NoDataCell />
                  )
                })
              })
            })
          }
          else if (element.type === "currencyAmount") {
            element.displayCurrency.forEach((_currency) => {
              let fieldName = element.fieldName + "_" + _currency.toLowerCase()
              let fieldLabel = element.fieldLabel + " " + _currency
              coloum.push({
                accessor: fieldName,
                Header: fieldLabel,
                Cell: ({ row }) => (
                  row.original[fieldName] ? <p>{formatAmountWithCurrency(rentalManagementData?.currency, row.original[fieldName])?.amountWithouCurrencyCode}</p> : <NoDataCell />
                ),
                Footer: (info) => {
                  const total = info?.rows?.filter(f => f.original.parentId === null && f.values.hasOwnProperty(fieldName) && !isNaN(f.values[fieldName])).reduce((sum, row) => row.values[fieldName] + sum, 0)
                  return <>{currencySymbol} {formatAmountWithCurrency(rentalManagementData?.currency, total)?.amountWithouCurrencyCode ?? total}</>
                }
              })
            })
          }
        }
        else {
          coloum.push({
            accessor: element.fieldName,
            Header: element.fieldLabel,
            Cell: ({ row }) => (
              row.original[element.fieldName] ? <p>{row.original[element.fieldName]}</p> : <NoDataCell />
            )
          })
        }
      });
      coloum.forEach(element => {
        if (element.accessor === "qty") {
          element["Footer"] = (info) => {
            const qtyTotal = info.rows.filter(f => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor])).reduce((sum, row) => row.values[element.accessor] + sum, 0)
            return <>{qtyTotal}</>
          }
        }
      });
      setColumns(coloum)
      fetchData()
    }
    catch (error) {
      toastConfig.setToastConfig(error)
    }
  }

  const fetchData = async () => {
    let combinedData: any = []
    let inventory: any = []
    let material: any = []
    let additionalcost: any = []
    try {
      if (isOffline) {
        const result = await findOne(objectStore.rentalManagement, rentalManagementData._id);
        material = result?.material;
        additionalcost = result?.additionalCost;
      }
      else {
        const resultMaterial = await axiosInstance().get(`${rentalManagement.api}/productpackage/${rentalManagementData._id}`)
        material = resultMaterial?.data?.data?.material;
        inventory = resultMaterial?.data?.data?.inventory;
        const resultCost = await axiosInstance().get(`${rentalManagement.api}/additionalcost/${rentalManagementData._id}`)
        additionalcost = resultCost?.data?.data;
      }
      material?.forEach((item) => {
        if (!item.parentId) {
          item.detail = item.type === "product" ? item.productDetail?.productName :
            item.type === "service" ? item.serviceDetail?.serviceName :
              item.type === "package" ? item.packageDetail?.packageName : ""
          item.type = item.type;
          combinedData.push(item);
        }
      });
      additionalcost?.forEach((e) => {
        e.type = "Add-on";
        e.detail = e.description
        e.parentId = null;
      })
      combinedData = [...combinedData, ...additionalcost];
      const rows = combinedData.filter((e) => e.parentId === null)
      rows.forEach((parent, i) => {
        parent.srno = i + 1;
        parent.detail = `${parent.type === "Add-on" ? parent.detail :
          parent.type === "product" ? parent?.productDetail?.productName :
            parent.type === "service" ? parent?.serviceDetail?.serviceName :
              parent.packageDetail?.packageName}`
        parent.qty = parent.qty;
        parent.subRows = generateNestedData(material, inventory, parent);
      });
      setRowsData(rows);
    }
    catch (error) {
      toastConfig.setToastConfig(error)
    }
  };

  const generateNestedData = (material, inventory, parent) => {

    const subRows: any = [];
    const inventory_result = inventory?.filter((e) => e._id === parent._id);

    inventory_result?.forEach((_inventory, k) => {
      subRows.push({
        _id: _inventory.inventoryDetail?._id,
        srno: `${parent.srno}.${(k + 1)}`,
        detail: _inventory.inventoryDetail?.assetNumber,
        status: _inventory.inventoryDetail?.status,
        actualStartDate: _inventory.startDate,
        actualEndDate: _inventory.endDate,
        type: "Asset",
        qty: 1,
      })
    })

    const childProduct: any = material.filter((e) => e.parentId === parent._id);
    childProduct.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.detail = _subRow?.type === "product" ? _subRow?.productDetail?.productName : _subRow?.type === "service" ? _subRow?.serviceDetail?.serviceName : _subRow?.packageDetail?.packageName;
      _subRow.qty = `${parent.qty * _subRow.qty}`;
      _subRow.subRows = generateNestedData(material, inventory, _subRow);
      subRows.push(_subRow)
    });
    return subRows;
  }

  const handlePDF = (type, PDFType) => {
    setIsLoading(true)
    axiosInstance().get(PDFType === "Detail" ?
      `${rentalManagement.api}/${rentalManagementData._id}/pdf/detail`
      : `${rentalManagement.api}/${rentalManagementData._id}/pdf`).then(({ data }) => {
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
              setIsLoading(false)
              setDownlodingFile(null);
            }
            else if (type === "Preview") {
              const file = new Blob([data], { type: "application/pdf" });
              const fileURL = URL.createObjectURL(file);
              const pdfWindow = window.open();
              pdfWindow.location.href = fileURL;
              setIsLoading(false)
              setDownlodingFile(null);
            }
            else {
              const file = new Blob([data], { type: 'application/pdf' });
              generateBase64forFile(file, 'pdf', PDFType);
            }
          })
          .catch((err) => {
            if (type === "Email") {
              setSendEmail(true)
            }
            toastConfig.setToastConfig(err);
            setIsLoading(false)
            setDownlodingFile(null);
          });
      }).catch((err) => {
        if (type === "Email") {
          setSendEmail(true)
        }
        toastConfig.setToastConfig(err);
        setIsLoading(false)
        setDownlodingFile(null);
      })
  }

  const generateBase64forFile = (blobData, type, PDFType) => {
    let reader = new FileReader();
    reader.readAsDataURL(blobData);
    reader.onloadend = function () {
      let base64data: any = reader.result;
      if (type === 'pdf') {
        const attachments = {
          base64: base64data.substring(parseInt(base64data.indexOf(',') + 1)),
          contentType: base64data.split(';')[0].split(':')[1],
          name: `Rental-${PDFType}-${rentalManagementData.rentalJobName}`
        };
        setEmailAttachments((prevState) => {
          return [
            ...prevState,
            attachments,
          ];
        });
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

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };


  return (<>
    <Box display="flex" justifyContent="space-between" m={1}>
      <Box display="flex" alignItems="center">
        {(!isOffline && ![RENTAL_STATUS.invoiced, RENTAL_STATUS.closed].includes(rentalManagementData.status) && allowedToEdit) &&
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
              Add
            </Button>
            <Box mx={1} />
          </Fragment>
        }
        {permissions?.rentalManagement?.isRead && !isMobile && (
          <Button
            variant={isMobile && !isTablet ? "text" : "outlined"}
            color="primary"
            type="button"
            size="small"
            style={isMobile && !isTablet ? { color: "var(--info-dark)" } : {}}
            disabled={downlodingFile === "Preview" && isLoading ? true : (false || isOffline)}
            startIcon={isMobile ? '' : <AiFillFilePdf />}
            onClick={(e) => {
              setDownlodingFile("Preview");
              handleClick(e);
            }}
          >
            {isMobile && !isTablet ? <AiFillFilePdf size={18} /> : downlodingFile === "Preview" && isLoading ? "Please wait..." : "Preview"}
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
            disabled={downlodingFile === "Download" && isLoading ? true : (false || isOffline)}
            startIcon={isMobile ? '' : <IoMdDownload />}
            onClick={(e) => {
              setDownlodingFile("Download");
              handleClick(e)
            }}
          >
            {isMobile && !isTablet ? <IoMdDownload size={20} /> : downlodingFile === "Download" && isLoading ? "Please wait..." : "Download"}
          </Button>
        )}
        <Menu
          id="simple-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleClose}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={() => {
            setAnchorEl(null)
            handlePDF(downlodingFile, "Regular")
          }}>Regular</MenuItem>
          <MenuItem onClick={() => {
            setAnchorEl(null)
            handlePDF(downlodingFile, "Detail")
          }}>Detail</MenuItem>
        </Menu>
        <Box mx={1} />
        {permissions?.rentalManagement?.isRead && <Button
          variant={isMobile && !isTablet ? 'text' : 'outlined'}
          color="primary"
          size="small"
          style={isMobile && !isTablet ? { color: "var(--danger-light)" } : {}}
          disabled={downlodingFile === "Email" && isLoading ? true : (false || isOffline)}
          startIcon={isMobile ? '' : <MdEmail />}
          onClick={() => {
            fetchEmailsData()
            handlePDF("Email", "Detail")
            handlePDF("Email", "Regular")
          }}
        >
          {isMobile && !isTablet ? <MdEmail size={20} /> : downlodingFile === "Email" && isLoading ? "Please wait..." : `Send Email`}
        </Button>}
      </Box>
    </Box>
    <Grid container spacing={2}>
      <Grid item xs={12} md={12} sm={12}>
        {columns && rowsData ?
          <Box
            zIndex={5}
            width={
              stepFullScreen ? "100%" :
                isTabletScreen
                  ? "calc(100vw)"
                  : isSmallScreen
                    ? "calc(100vw)"
                    : showActivity ? "100%" : "calc(100vw - 103px)"
            }
            height={stepFullScreen ? "calc(100vh - 150px)" : "calc(100vh - 350px)"}
          >
            <CustomReactTable
              height={stepFullScreen ? "calc(100vh - 150px)" : "calc(100vh - 365px)"}
              columns={columns}
              data={rowsData}
              setWholeRowsCellColor={() => { }}
              onSelect={() => { }}
              childrenProperty="subRows"
              uniqueKey="_id"
              hideSelection={true}
              renderedFrom="rental_management_serialized_asset"
              isClientSideGrid={true}
            /></Box>
          : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>
        }
      </Grid>
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
            setEmailAttachments([])
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