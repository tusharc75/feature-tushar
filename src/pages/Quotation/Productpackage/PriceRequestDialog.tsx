import { useState, useEffect, useContext } from 'react';
import Dialog from '@mui/material/Dialog';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition, displayDateTime, prepareDataForGrid } from '../../../constants/helpers';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa6';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import routes from 'src/components/Helpers/Routes';
import { Link } from 'react-router-dom';

const PriceRequestDialog = ({ handleClose, quoteData, onSuccess, type, versionId }) => {
  let renderedFrom = 'ViewQuotationSupplierPrice';
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows } = state;
  const { generateColumns } = useColumns();

  const [productDataList, setproductDataList] = useState([]);
  const [allFields, setAllFields] = useState([]);
  const [response, setResponse] = useState({ open: false, type: '', id: '' });
  const [expandSupplierGrid, setExpandSupplierGrid] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    setComment(event.target.value.trimStart());
  };
  useEffect(() => {
    fetchProductGridData();
  }, []);

  const fetchProductGridData = () => {
    setIsLoading(true);
    if (type === 'Customer') {
      axiosInstance()
        .get(`/quotation/price-request/${quoteData?._id}`)
        .then(({ data: { data } }) => {
          setproductDataList(data);
          setIsLoading(false);
        })
        .catch((error) => {
          setIsLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
    if (type === 'Supplier') {
      axiosInstance()
        .get(`/quotation/supplier-price-request/quotation-product-supplier-response/${quoteData?._id}/${versionId}`)
        .then(({ data: { data } }) => {
          let rows = [];
          data?.data.forEach((d) => {
            const material = d?.material.filter((e) => !!!e?.parentId);
            material.forEach((_material, index) => {
              const res: any = {
                ...prepareDataForGrid(_material)
              };
              res.index = index + 1;
              res.detail =
                _material?.type === 'product'
                  ? _material?.productDetail?.productName
                  : _material?.type === 'service'
                    ? _material?.serviceDetail?.serviceName
                    : _material?.type === 'package'
                      ? _material?.packageDetail?.packageName
                      : '';
              res.description =
                _material?.type === 'product'
                  ? _material?.productDetail?.productDescription
                  : _material?.type === 'service'
                    ? _material?.serviceDetail?.serviceDescription
                    : _material?.type === 'package'
                      ? _material?.packageDetail?.packageDescription
                      : '';
              res.uniqueId = d?._id;
              res.subRows = generateNestedData(d?.material, res);

              rows = [...rows, res];
            });
          });

          dispatch({ type: 'initialize', data: rows, count: rows.length });

          setproductDataList(data?.data);
          setAllFields(data?.fields);
          setIsLoading(false);
        })
        .catch((error) => {
          setIsLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail =
        _subRow?.type === 'product'
          ? _subRow?.productDetail?.productName
          : _subRow?.type === 'service'
            ? _subRow?.serviceDetail?.serviceName
            : _subRow?.type === 'package'
              ? _subRow?.packageDetail?.packageName
              : '';
      _subRow.description =
        _subRow?.type === 'product'
          ? _subRow?.productDetail?.productDescription
          : _subRow?.type === 'service'
            ? _subRow?.serviceDetail?.serviceDescription
            : _subRow?.type === 'package'
              ? _subRow?.packageDetail?.packageDescription
              : '';
      _subRow.subRows = generateNestedData(material, _subRow);
    });

    return subRows;
  };

  const fetchColumns = (id = null) => {
    let columns = [];

    columns = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 150,
        show: true,
        disabled: true,
        primaryField: true,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        width: 150,
        show: true,
        disabled: true,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p className="text-truncate" title={row.original?.detail}>
              {row.original?.detail}
            </p>
            {row.original?.subRows?.length ? (
              <Box ml={1}>
                <span>({row.original?.subRows?.length})</span>
              </Box>
            ) : null}
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 150,
        show: true,
        disabled: true,
        Cell: ({ row }) => (row?.original?.description ? <p className="text-truncate">{row?.original?.description}</p> : <NoDataCell />)
      }
    ];

    if (id) {
      const filteredFields = allFields?.filter((e) => productDataList?.find((p) => p?._id === id)?.requiredFields.includes(e.fieldName));
      const newColumns = generateColumns(renderedFrom, filteredFields, null, false, quoteData.currency);
      newColumns?.forEach((e) => {
        e.editable = false;
      });

      columns = [...columns, ...newColumns];
    }

    return columns;
  };

  const handleAccept = (responseId) => {
    if (type === 'Customer') {
      axiosInstance()
        .put(`/quotation/price-request/${quoteData?._id}/apply-price/${responseId}`)
        .then(({ data: { data } }) => {
          fetchProductGridData();
          setResponse({ open: false, type: '', id: '' });
          onSuccess();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
    if (type === 'Supplier') {
      axiosInstance()
        .put(`/quotation/supplier-price-request/apply-bulk-supplier-price`, {
          requestId: responseId,
          quotationId: quoteData?._id
        })
        .then(({ data: { data } }) => {
          fetchProductGridData();
          setResponse({ open: false, type: '', id: '' });
          onSuccess();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleReject = () => {
    if (type === 'Customer') {
      axiosInstance()
        .put(`quotation/price-request/${quoteData?._id}/reject-price/${response.id}`, { responseComment: comment })
        .then(({ data: { data } }) => {
          fetchProductGridData();
          setResponse({ open: false, type: '', id: '' });
          onSuccess();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }

    if (type === 'Supplier') {
      axiosInstance()
        .put(`/quotation/supplier-price-request/apply-reject/${quoteData?._id}/${response.id}`, { body: comment })
        .then(({ data: { data } }) => {
          fetchProductGridData();
          setResponse({ open: false, type: '', id: '' });
          onSuccess();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };
  return (
    <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
      <CustomDialogHeader title={`View ${type} Quote`} onClose={handleClose} showRequiredLabel={false}></CustomDialogHeader>
      <div className="m-2 md:m-3">
        {productDataList && productDataList.length !== 0 && !isLoading ? (
          productDataList.map((data) => {
            return (
              <Accordion
                expanded={Boolean(expandSupplierGrid === data?._id)}
                onChange={() => (expandSupplierGrid === data?._id ? setExpandSupplierGrid(null) : setExpandSupplierGrid(data?._id))}
              >
                <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
                  <div className="flex  items-center gap-[5px]">
                    <Box>
                      <IconButton size="small">{expandSupplierGrid === data?._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                    </Box>
                    <div className="items-center gap-[5px] min-[768px]:flex">
                      <Box className="line-clamp-1 min-w-0" title={data?.status ? data?.status : ''}>
                        <Typography variant="subtitle2">{data?.status && `Status : ${data?.status}, `}</Typography>
                      </Box>
                      <Box className="line-clamp-1  min-w-0" title={data?.requestDate ? displayDateTime(data?.requestDate) : ''}>
                        <Typography variant="subtitle2">
                          {data?.requestDate && `Request Date : ${displayDateTime(data?.requestDate)} `}
                        </Typography>
                      </Box>
                    </div>
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  {expandSupplierGrid === data?._id && (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          {data?.status === 'Submit' && (
                            <Box
                              className="line-clamp-1  min-w-0"
                              title={data?.responseDate ? displayDateTime(data?.responseDate) : ''}
                            >
                              <Typography variant="subtitle2">
                                {data?.responseDate && `Response Date : ${displayDateTime(data?.responseDate)} `}
                              </Typography>
                            </Box>
                          )}

                          <div className="flex gap-3">
                            <Box className="line-clamp-1  min-w-0" title={data?.supplierAccount ? data?.supplierAccount?.optionLabel : ''}>
                              <Typography variant="subtitle2">
                                {data?.supplierAccount && (
                                  <>
                                    Supplier Account :{' '}
                                    <Link
                                      className="link text-truncate"
                                      target="_blank"
                                      to={`${routes.supplierAccountDetail.path}/${data.supplierAccount?.optionValue}`}
                                    >
                                      {data.supplierAccount.optionLabel}
                                    </Link>
                                  </>
                                )}
                              </Typography>
                            </Box>
                            <Box className="line-clamp-1  min-w-0" title={data?.supplierContact ? data?.supplierContact?.optionLabel : ''}>
                              <Typography variant="subtitle2">
                                {data?.supplierContact && (
                                  <>
                                    Supplier Contact :{' '}
                                    <Link
                                      className="link text-truncate"
                                      target="_blank"
                                      to={`${routes.supplierContactDetail.path}/${data.supplierContact?.optionValue}`}
                                    >
                                      {data.supplierContact.optionLabel}
                                    </Link>
                                  </>
                                )}
                              </Typography>
                            </Box>
                          </div>
                        </div>
                        {((type === 'Customer' && data?.status === 'Request') || (type === 'Supplier' && data?.status === 'Submit')) && (
                          <div className="flex gap-2">
                            <ThemeButton
                              borderColor="default"
                              iconForMobile={<FaThumbsUp />}
                              onClick={() => {
                                handleAccept(data?._id);
                              }}
                              mobileTooltip="Accept"
                            >
                              Accept
                            </ThemeButton>
                            <ThemeButton
                              borderColor="red"
                              hasMobileBorder
                              iconForMobile={<FaThumbsDown />}
                              onClick={() => {
                                setResponse({ open: true, type: 'Reject', id: data?._id });
                              }}
                              mobileTooltip="Reject"
                            >
                              Reject
                            </ThemeButton>
                          </div>
                        )}
                      </div>
                      <CustomReactTable
                        height={'calc(100vh - 393px)'}
                        columns={fetchColumns(data?._id)}
                        state={{ ...state, dataRows: dataRows?.filter((d) => d?.uniqueId === data?._id) }}
                        dispatch={dispatch}
                        renderedFrom={renderedFrom}
                        refreshGrid={fetchProductGridData}
                        isClientSideGrid={true}
                        hideAction={true}
                        hideSelection={true}
                        expander={true}
                      />
                    </>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })
        ) : isLoading ? (
          <Box height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        ) : (
          <h1 style={{ padding: '10px', display: 'flex', justifyContent: 'center', color: '#047d1c' }} title={' Thanks for your submission'}>
            No supplier quote
          </h1>
        )}
        {response.open && (
          <Dialog
            TransitionComponent={CustomDialogTransition}
            open={true}
            aria-labelledby="customized-dialog-title"
            fullWidth
            maxWidth={'sm'}
            onClose={(e, reason) => {
              if (reason !== 'backdropClick') {
              }
            }}
          >
            <CustomDialogHeader
              onClose={() => {
                setResponse({ open: false, type: '', id: '' });
              }}
              showRequiredLabel={false}
              title={'Response Comment'}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Box>
                <TextField
                  id="outlined-multiline-static"
                  label="Comment"
                  placeholder={`Comment`}
                  fullWidth
                  multiline
                  rows={4}
                  value={comment}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                color="primary"
                size="small"
                onClick={() => {
                  setResponse({ open: false, type: '', id: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                color="primary"
                variant="contained"
                size="small"
                onClick={() => {
                  response.type === 'Reject' && handleReject();
                }}
              >
                Save
              </Button>
            </CustomDialogFooter>
          </Dialog>
        )}
      </div>
    </Dialog>
  );
};

export default PriceRequestDialog;
