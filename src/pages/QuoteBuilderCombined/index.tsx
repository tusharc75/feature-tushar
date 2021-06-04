import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Grid,
  IconButton,
  Tooltip,
  Checkbox,
  Chip,
} from "@material-ui/core";
import { Link } from "react-router-dom";
import DeleteIcon from "@material-ui/icons/Delete";
import { DataGrid } from "@material-ui/data-grid";
import { useData } from "../../StateProvider/Provider";
import Layout from "../../components/Layout";
import axiosInstance from "../../axios/axiosInstance";
import { getSearchQuery, displayDate } from "../../services/util";
import QuoteHeader from "./QuoteHeader";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import "./style.scss";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import routes from "./../../components/Helpers/Routes";
import CustomRenderCell from "../../components/Helpers/CustomRenderCell";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { GiHiveMind } from "react-icons/gi";
import ManageQuoteDialog from "./ManageQuote/ManageQuoteDialog";
import {
  quoteBuilder,
} from "../../constants/helpers";
import moment from "moment";
import NoDataCell from "../../components/Helpers/NoDataCell";
import CustomDataGridNoDataFound from "../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import CustomContainer from "../../components/CustomContainer";
import { useHistory } from "react-router-dom";
import CustomDataGridToolbar from "../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";

let quoteTimeout;
const QuoteType = [
  {
    key: "All Quotes",
    value: 1,
  },
  {
    key: "My Quotes",
    value: 2,
  },
];

const QuoteBuilders = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();
  const [searchVal, setSearchVal] = useState("");
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [selectedType, setSelectedType] = useState(1);
  const [checkAllQuotes, setCheckAllQuotes] = useState(false);
  const [dataRows, setDataRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [QuoteData, setQuoteData] = useState([]);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [QuotePermissions, setQuotePermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });
  const [
    showCreateQuoteDialog,
    setshowCreateQuoteDialog,
  ] = useState(false);
  const [
    showDeleteWarningConfirmBox,
    setShowDeleteWarningConfirmBox,
  ] = useState(false);
  const [singleQuoteDelete, setsingleQuoteDelete] = useState({
    id: null,
    show: false,
    quoteName: "",
  });
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource,
  })

  const { qbResource, qbApi } = quoteBuilder;

  useEffect(() => {
    if (permissions && permissions[qbResource]) {
      setQuotePermissions(permissions[qbResource]);
    }

    return () => {
      setQuotePermissions(null)
    }
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(searchVal).length > 0 ? 600 : 5;
    if (quoteTimeout) {
      clearTimeout(quoteTimeout);
    }

    quoteTimeout = setTimeout(() => {
      fetchOpportunities();
    }, millisec);
    // eslint-disable-next-line
  }, [searchVal]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchOpportunities();
    } else setRenderCount((preCount) => preCount + 1);


    return () => {
      setRenderCount(0);
    }
  }, [query, selectedType, selectedEntity, accountDetails]);

  useEffect(() => {
    let rows = QuoteData?.map((u) => {
      let res = {
        ...u,
        isChecked: false,
        id: u._id,
        canDelete: u.owner?.optionValue === user?.user._id,
        owner: u.owner?.optionLabel ? u.owner.optionLabel : "",
        stage: u.stage ? u.stage : "",
        closeDate: u?.closeDate ? displayDate(u.closeDate) : "",
        // accountName: u?.accountName?.optionLabel || ''
      };
      return res;
    });
    setDataRows([...rows]);

    return () => {
      setDataRows([])
    }

  }, [QuoteData]);

  const handleSingleDeleteOpportunity = async () => {
    setLoading(true);

    axiosInstance()
      .put(`${qbApi}/remove?entity=${selectedEntity}`, {
        ids: [singleQuoteDelete.id],
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        fetchOpportunities();
        setLoading(false);
      });
    setsingleQuoteDelete({ id: null, show: false, quoteName: "" });
  };
  const fetchOpportunities = async () => {
    if (selectedEntity) {
      setLoading(true);
      let searchParams: any = {
        ...query,
        entity: selectedEntity,
        filterQuotes: selectedType,
      };
      searchParams = searchVal
        ? { ...searchParams, search: searchVal }
        : { ...searchParams };

      if (accountDetails.accountId) {
        if (accountDetails.resource === "customerAccountName") {
          searchParams["filterById"] = JSON.stringify([{ field: accountDetails.resource, term: accountDetails.accountId }]);
        } else if (accountDetails.resource === "supplierAccountName") {
          searchParams["filterById"] = JSON.stringify([{ field: accountDetails.resource, term: { $in: [accountDetails.accountId] } }]);
        }
      }

      let api = getSearchQuery(qbApi, searchParams);
      try {
        axiosInstance()
          .get(api)
          .then(({ data }) => {
            setRowCount(data.count);
            setQuoteData(data.data);
            setCheckAllQuotes(false);
            setLoading(false);
          });
      } catch (err) {
        setLoading(false);
      }
    }
  }

  const handleSearch = (e) => {
    if (query.page !== 0) {
      setQuery((prevState) => ({ ...prevState, page: 0 }));
    }
    setSearchVal(e.target.value);
  };

  const handleOpportunityTypeSel = (filterValues) => {
    setSelectedType(filterValues);
  };

  const onSuccess = () => {
    setshowCreateQuoteDialog(false);
    fetchOpportunities();
  };

  const columns = [
    {
      field: "isChecked",
      headerName: "Checkbox",
      renderHeader: () => (
        <Checkbox
          color="primary"
          checked={checkAllQuotes}
          onChange={(ev) => {
            setCheckAllQuotes(ev.target.checked);
            const gridData = dataRows;
            gridData.map((d) => {
              d.isChecked = ev.target.checked;
              return d;
            });
            setDataRows([...gridData]);
          }}
        />
      ),
      renderCell: (params) => (
        <Checkbox
          // color="primary"
          // checked={params.value}
          // onChange={(ev) => {
          //   updateCheckedStatus(params, ev)

          // }}

          color="primary"
          // disabled={!params.canDelete}
          checked={params.value}
          onChange={(ev) => {
            const gridData = dataRows;
            const indexOfRecord = gridData.findIndex(
              (d) => d.id === params.row.id
            );
            gridData[indexOfRecord].isChecked = ev.target.checked;

            setDataRows([...gridData]);

            const checkedRecords = gridData.filter((d) => d.isChecked === true);

            if (checkedRecords.length === gridData.length) {
              setCheckAllQuotes(true);
            } else {
              setCheckAllQuotes(false);
            }
          }}
        />
      ),
      disableColumnMenu: true,
      width: 75,
      sortable: false,
      filterable: false,
    },
    {
      field: "quoteName",
      headerName: "Quote Name",
      width: 400,
      renderCell: (params) => getFirstName(params.row),
    },
    {
      field: "supplierAccountName",
      headerName: "Supplier Account Name",
      width: 300,
      hide: true,
      renderCell: (params) =>
        params?.row?.supplierAccountName.length > 0 ? (
          <>
            <h5 className="createBy">
              <Link className="link"
                to={`${routes.supplierAccount.path}/detail/${params?.row?.supplierAccountName[0].optionValue}`}
              >
                {params?.row?.supplierAccountName[0].optionLabel}
              </Link>
              {
                params?.row?.supplierAccountName.length > 1 &&
                <span className="createdAtTime badge-date">
                  {`+${params?.row?.supplierAccountName.length - 1} more..`}
                </span>
              }
            </h5>
          </>
        ) : <NoDataCell />
    },
    {
      field: "customerAccountName",
      headerName: "Customer Account Name",
      width: 300,
      renderCell: (params) => (
        <Link
          className="link"
          to={`${routes.customerAccount.path}/detail/${params?.row?.customerAccountName?.optionValue}`}
        >
          {params?.row?.customerAccountName?.optionLabel
            ? params.row.customerAccountName.optionLabel
            : ""}
        </Link>
      ),
    },
    {
      field: "createdBy",
      headerName: "Created By",
      width: 250,
      disableColumnMenu: true,
      renderCell: (params) =>
        params?.value && params?.value?.user ? (
          <h5 className="createBy">
            {params.value.user.firstName}
            <span
              className="createdAtTime badge-date"
              title={`${params.value.user.firstName} • ${moment(
                params?.value?.date?.slice(0, 10)
              ).format("MMM Do, YYYY")}`}
            >
              {moment(params?.value?.date?.slice(0, 10)).format("MMM Do, YYYY")}
            </span>
          </h5>
        ) : (
          <NoDataCell />
        ),
      // renderCell: (params) => <CustomRenderCell value={params?.value?.createdBy?.optionLabel} />
    },
    {
      field: "updatedBy",
      headerName: "Updated By",
      width: 250,
      renderCell: (params) =>
        params?.value?.user ? (
          <h5 className="updateBy">
            {params.value.user.firstName}
            <span title={params.value.date} className="updatedAtTime badge-date">
              {moment(params?.value?.date?.slice(0, 10)).format("MMM Do, YYYY")}
            </span>
          </h5>
        ) : (
          <NoDataCell />
        ),

      // renderCell: (params) => <CustomRenderCell value={params?.value?.updatedBy?.optionLabel} />
    },
    {
      field: "closeDate",
      headerName: "Close Date",
      width: 250,
      renderCell: (params) => <CustomRenderCell value={params?.value} />,
    },
    // { field: "status", headerName: "Lead Status", width: 200 },
    {
      field: "owner",
      headerName: "Opportunity Owner",
      width: 250,
      renderCell: (params) => <CustomRenderCell value={params?.value} />,
    },
    {
      field: "actions",
      headerName: "Actions ",
      renderCell: (params) => (
        <>
          {QuotePermissions.isDelete ? (
            params.row.canDelete ? (
              <Tooltip title="Delete">
                <IconButton
                  aria-label="Delete"
                  onClick={() =>
                    setsingleQuoteDelete({
                      show: true,
                      id: params.row._id,
                      quoteName: `${params.row.quoteName}`,
                    })
                  }
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip
                className="cursor-stop"
                title="You must be the owner of this opportunity to get the delete functionality"
              >
                <IconButton aria-label="Delete">
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            )
          ) : (
            <Tooltip
              className="cursor-stop"
              title="You do not have permission to delete opportunity"
            >
              <IconButton aria-label="Delete">
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          )}
        </>
      ),
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      width: 200,
    },
  ];

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row._id) {
        setDeleteRec(row);
      }
    } else {
      if (dataRows.find((d) => d.isChecked && d.canDelete === false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };
  const getFirstName = (tData) => {
    return (
      <Link
        className="nameLink"
        to={`quote-builder/${tData._id}`}
      >
        <span className="text-capitalize">{tData.quoteName}</span>
      </Link>
    );
  };

  // const updateCheckedStatus = (params, ev) => {
  //   const gridData = [...dataRows];
  //   const indexOfRecord = gridData.findIndex((d) => d.id === params.row.id);
  //   gridData[indexOfRecord].isChecked = ev.target.checked;

  //   setDataRows([...gridData]);

  //   const checkedRecords = gridData.filter((d) => d.isChecked === true);

  //   if (checkedRecords.length === gridData.length) {
  //     setCheckAllQuotes(true);
  //   } else {
  //     setCheckAllQuotes(false);
  //   }
  // };

  const handlePage = (params) => {
    if (query.page !== params.page) {
      setQuery((prevState) => ({ ...prevState, page: params.page }));
    }
  };

  const handlePageSize = (params) => {
    if (params.pageSize !== query.limit) {
      setQuery({ page: 0, limit: params.pageSize });
    }
  };

  const handleSortModelChange = (params) => {
    if (params?.sortModel && params.sortModel.length > 0) {
      let temp = { ...params.sortModel[0] };
      setQuery((prevState) => ({
        ...prevState,
        page: 0,
        sortBy: temp.field,
        orderBy: temp.sort,
      }));
    }
  };

  const clickCreateNew = () => {
    setshowCreateQuoteDialog(true);
  };

  const handleDeleteOpportunity = async () => {
    setDeleteLoading(true);
    let recs = [];
    if (deleteRec?._id) {
      recs.push(deleteRec?._id);
    } else {
      recs = dataRows.filter((obj) => obj.isChecked).map((o) => o._id);
    }
    if (recs && recs.length > 0) {
      axiosInstance()
        .put(`${qbApi}/remove?entity=${selectedEntity}`, {
          ids: [...recs],
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRec) setDeleteRec({});
          fetchOpportunities();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  const onFilterChange = useCallback((params) => {
    if (params.filterModel.items[0].value) {
      let deepFilter;
      switch (params.filterModel.items[0].columnField) {
        case 'createdBy':
          deepFilter = JSON.stringify([{ field: "createdBy.user.concatedName", term: params.filterModel.items[0].value }])
          break;
        case 'updatedBy':
          deepFilter = JSON.stringify([{ field: "updatedBy.user.concatedName", term: params.filterModel.items[0].value }])
          break;
        case 'name':
          deepFilter = JSON.stringify([{ field: "firstName", term: params.filterModel.items[0].value }, { field: "middleName", term: params.filterModel.items[0].value }, { field: "lastName", term: params.filterModel.items[0].value }])
          break;
        default:
          deepFilter = JSON.stringify([{ field: params.filterModel.items[0].columnField, term: params.filterModel.items[0].value }])
      }
      setQuery((prevState) => ({
        ...prevState,
        deepFilter
      }));

    } else {
      setQuery({ page: 0, limit: 25 });
    }
  }, []);
  return (
    <>
      <Layout>
        <Grid container className="headerbox">
          <Grid item md={12} sm={12} xs={12}>
            <CustomBreadCrumbs routes={[{ title: "Quote Builder" }]} />
          </Grid>
        </Grid>
        {/* Tables Begins Here */}
        <CustomContainer>
          <div className="header-panel">
            <QuoteHeader
              selectedType={selectedType}
              onTypeChange={handleOpportunityTypeSel}
              options={QuoteType}
              onSearch={handleSearch}
              searchVal={searchVal}
              QuotePermissions={QuotePermissions}
              onCreate={clickCreateNew}
              showConfirmBox={showConfirmBox}
              canDelete={dataRows.filter((d) => d.isChecked).length === 0}
              icon={<GiHiveMind className="headerLogo" />}
              heading="Quote Builder"
            >
              {
                accountDetails.accountId && <Chip
                  className="ml-3"
                  color="primary"
                  label={`Account: ${accountDetails.accountName}`}
                  onDelete={() => {
                    setAccountDetails({ accountId: null, accountName: null, resource: null });
                  }}
                />
              }
            </QuoteHeader>
          </div>


          <div className="listing-grid">
            <DataGrid
              components={{
                Toolbar: CustomDataGridToolbar,
                NoRowsOverlay: CustomDataGridNoDataFound,
              }}
              rows={loading ? [] : dataRows}
              columns={columns}
              loading={loading}
              disableSelectionOnClick
              disableMultipleSelection
              paginationMode="server"
              pagination
              onPageChange={handlePage}
              onPageSizeChange={handlePageSize}
              pageSize={query.limit}
              page={query.page}
              rowCount={rowCount}
              rowsPerPageOptions={[25, 50, 75]}
              onSortModelChange={handleSortModelChange}
              density="compact"
              onFilterModelChange={onFilterChange}
              filterMode="server"
            />
          </div>

          {showDeleteWarningConfirmBox ? (
            <MessageDialog
              open={showDeleteWarningConfirmBox}
              message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
              onClose={() => setShowDeleteWarningConfirmBox(false)}
            />
          ) : null}
          {isConfirmDialogVisible ? (
            <ConfirmationDialog
              open={isConfirmDialogVisible}
              message={`Are you sure, you want to delete ${deleteRec?.quoteName ? "Opportunity" : "Opportunities"
                }   ${deleteRec.quoteName || ""}?`}
              onClose={() => {
                if (deleteRec) setDeleteRec({});
                setIsConformDialogVisible(false);
              }}
              okBtnLoading={deleteLoading}
              onOk={handleDeleteOpportunity}
            />
          ) : null}
          {/* {
            showCreateQuoteDialog && <ManageOpportunityMain
              open={showCreateQuoteDialog}
              onClose={() => setshowCreateQuoteDialog(false)}
              onSuccess={() => {
                setshowCreateQuoteDialog(false);
                fetchOpportunities()
              }}
            />
          } */}
          {singleQuoteDelete.show ? (
            <ConfirmationDialog
              open={singleQuoteDelete.show}
              message={`Are you sure, you want to delete contact: ${singleQuoteDelete.quoteName} ?`}
              onClose={() =>
                setsingleQuoteDelete({
                  id: null,
                  show: false,
                  quoteName: "",
                })
              }
              onOk={handleSingleDeleteOpportunity}
            />
          ) : null}
        </CustomContainer>
      </Layout>

      {showCreateQuoteDialog && (
        <ManageQuoteDialog
          open={showCreateQuoteDialog}
          onSuccess={onSuccess}
          onClose={() => {
            setshowCreateQuoteDialog(false);
          }}
          isNew={true}
          dataToUpdate={null}
          resource={null}
          isRedirectTodetailPage={true}
          contactId={null}
          opportunityId={null}
        />
      )}
    </>
  );
};

export default QuoteBuilders;
