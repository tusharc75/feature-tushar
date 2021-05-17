import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  Grid,
  Tooltip,
  IconButton,
  Checkbox,
} from "@material-ui/core";
import { Link, useHistory } from "react-router-dom";
import { DataGrid } from "@material-ui/data-grid";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import routes from "./../../components/Helpers/Routes";
import Layout from "../../components/Layout";
import LeadsHeader from "./LeadsHeader";
import axiosInstance from "../../axios/axiosInstance";
import { getSearchQuery } from "../../services/util";
import { useData } from "../../StateProvider/Provider";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import { leadDetailPage } from "../../routes/Lead";

import CustomRenderCell from "../../components/Helpers/CustomRenderCell";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import {
  downloadExcel,
  leadTemplateFileName,
  leadImportErrorFileName,
  leadProcessFieldName,
} from "../../constants/helpers";
import ManageLeadDialog from "./ManageLeadDialog/ManageLeadDialog";
import { HiUserGroup } from "react-icons/hi";
import { lead } from "../../constants/helpers";
import moment from "moment";
import NoDataCell from "../../components/Helpers/NoDataCell";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import CustomDataGridNoDataFound from "../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import { SiConvertio } from "react-icons/si";
import "./style.scss";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import CustomContainer from "../../components/CustomContainer";
import CustomDataGridToolbar from "../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";

const LeadTypes = [
  {
    key: "All Leads",
    value: 1,
  },
  {
    key: "My Leads",
    value: 2,
  },
];

let leadTimeout;
const Leads = () => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();
  const [searchVal, setSearchVal] = useState("");
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedType, setSelectedType] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [checkAllLeads, setCheckAllLeads] = useState(false);
  const [dataRows, setDataRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [okButtonLoading, setOkButtonLoading] = useState(false);
  const [leadData, setLeadData] = useState([]);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRec, setDeleteRec] = useState<any>({});
  const [leadsPermissions, setLeadsPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });
  const [
    showDeleteWarningConfirmBox,
    setShowDeleteWarningConfirmBox,
  ] = useState(false);
  const history = useHistory();

  const [
    convertLeadToOpportunityConfirmationDialog,
    setConvertLeadToOpportunityConfirmationDialog,
  ] = useState({ open: false, id: null, leadName: null, message: null });
  const hasPermissionToConvertInOpportunity =
    user?.user?.permissions?.convertLeadToOpportunity;

  const { leadResource, leadApi } = lead;

  useEffect(() => {
    if (permissions && permissions[leadResource]) {
      setLeadsPermissions(permissions[leadResource]);
    }
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(searchVal).length > 0 ? 600 : 5;
    if (leadTimeout) {
      clearTimeout(leadTimeout);
    }

    leadTimeout = setTimeout(() => {
      fetchLeads();
    }, millisec);
  }, [searchVal]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchLeads();
    } else setRenderCount((preCount) => preCount + 1);
  }, [query, , selectedType, selectedEntity]);

  useEffect(() => {
    let rows = leadData?.map((u) => {
      let name = [u.firstName, u.middleName, u.lastName]
        .filter((d) => d)
        .join(" ");

      let res = {
        ...u,
        isChecked: false,
        id: u._id,
        name: name,
        owner: u.owner,
        isAllowedToUpdate: [...u.collaborator ?? [], u.owner].some(
          (d) => d?.optionValue == user?.user?._id
        ),
        relatedOpportunity: u.staticData?.convertedToOpportunity && u.staticData?.opportunity
      };
      return res;
    });
    setDataRows([...rows]);
  }, [leadData]);

  const fetchLeads = async () => {
    if (selectedEntity) {
      setLoading(true);
      let searchParams: any = {
        ...query,
        entity: selectedEntity,
        filterLeads: selectedType,
      };
      searchParams = searchVal
        ? { ...searchParams, search: searchVal }
        : { ...searchParams };
      let api = getSearchQuery(leadApi, searchParams);
      try {
        axiosInstance()
          .get(api)
          .then(({ data }) => {
            setRowCount(data.count);
            setLeadData(data.data);
            setCheckAllLeads(false);
            setLoading(false);
          });
      } catch (err) {
        setLoading(false);
      }
    }
  };

  const handleSearch = (e) => {
    if (query.page !== 0) {
      setQuery((prevState) => ({ ...prevState, page: 0 }));
    }
    setSearchVal(e.target.value);
  };

  const handleLeadTypeSel = (filteredValue) => {
    setSelectedType(filteredValue);
  };

  const handleCreate = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    fetchLeads();
  };

  const generateLeadToOpportunityButton = ({
    _id,
    firstName,
    middleName,
    lastName,
    staticData,
    [leadProcessFieldName]: leadProcess,
    isAllowedToUpdate,
  }) => {
    let dontHavePermissions = [];

    if (!permissions["customerAccount"].isCreate) {
      dontHavePermissions.push("Customer Account");
    }
    if (!permissions["customerContact"].isCreate) {
      dontHavePermissions.push("Customer Contact");
    }
    if (!permissions["opportunity"].isCreate) {
      dontHavePermissions.push("Opportunity");
    }

    const isCurrentLeadStatusQualified = leadProcess && leadProcess.toLowerCase() == "qualified";

    return dontHavePermissions.length > 0 ? (
      <>
        <Tooltip
          title={`To convert lead to opportunity, you must need create permission of ${dontHavePermissions.join(
            ", "
          )}`}
        >
          <IconButton aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </Tooltip>
      </>
    ) : staticData && staticData["convertedToOpportunity"] ? (
      <>
        <Tooltip title="This lead is already converted to opportunity">
          <IconButton aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </Tooltip>
      </>
    ) : !isAllowedToUpdate ? (
      <>
        <Tooltip title="You are not allowed to convert as you are neither owner nor collaborator">
          <IconButton aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </Tooltip>
      </>
    ) : !isCurrentLeadStatusQualified ? (
      <>
        <Tooltip title="To covert this lead to opportunity, Lead status must be qualified">
          <IconButton aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </Tooltip>
      </>
    ) : (
      <Tooltip title="Convert to opportunity">
        <IconButton
          aria-label="Convert to opportunity"
          onClick={() => {
            const leadName = [firstName, middleName, lastName]
              .filter((d) => d)
              .join(" ");
            setConvertLeadToOpportunityConfirmationDialog({
              open: true,
              id: _id,
              leadName: leadName,
              message: `Are you sure, You want to convert ${leadName} to opportunity ?`,
            });
          }}
        >
          <SiConvertio size={18} className="text-primary" />
        </IconButton>
      </Tooltip>
    );
  };

  const columns = [
    {
      field: "isChecked",
      headerName: "Checkbox",
      renderHeader: () => (
        <Checkbox
          color="primary"
          checked={checkAllLeads}
          onChange={(ev) => {
            setCheckAllLeads(ev.target.checked);
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
          color="primary"
          checked={params.value}
          onChange={(ev) => {
            updateCheckedStatus(params, ev);
          }}
        />
      ),
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      width: 75,
    },
    {
      field: "name",
      headerName: "Name",
      width: 250,
      renderCell: (params) => (
        <>
          <Link
            className="link"
            to={`${leadDetailPage.path}/${params.row._id}`}
          >
            {params?.value ?? ""}
          </Link>
        </>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "relatedOpportunity",
      headerName: "Related Opportunity",
      width: 300,
      renderCell: (params) => (
        <>
          {
            params.value ?
              <Link className="link" to={`${routes.opportunityDetail.path}/${params.value?._id}`} title={params.value?.opportunityName}>
                {params.value?.opportunityName}
              </Link>
              : <NoDataCell />
          }
        </>
      ),
    },
    {
      field: "title",
      headerName: "Title",
      width: 300,
      renderCell: (params) => <CustomRenderCell value={params?.value} />,
    },
    {
      field: "company",
      headerName: "Company",
      width: 300,
      renderCell: (params) => <CustomRenderCell value={params?.value} />,
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
    },
    {
      field: "updatedBy",
      headerName: "Updated By",
      width: 250,
      renderCell: (params) =>
        params?.value && params?.value?.user ? (
          <h5 className="updateBy">
            {params.value.user.firstName}
            <span title={params.value.date} className="updatedAtTime badge-date">
              {moment(params.value.date.slice(0, 10)).format("MMM Do, YYYY")}
            </span>
          </h5>
        ) : (
          <NoDataCell />
        ),
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 250,
      renderCell: (params) => <CustomRenderCell value={params?.value} isCopyToClipboard={true} />,
    },
    {
      field: "mobile",
      headerName: "Mobile",
      width: 250,
      renderCell: (params) => <CustomRenderCell value={params?.value} isCopyToClipboard={true} />,
    },
    {
      field: "email",
      headerName: "Email",
      width: 250,
      hide: true,
      renderCell: (params) => <CustomRenderCell value={params?.value} isCopyToClipboard={true} />,
    },
    // { field: "status", headerName: "Lead Status", width: 200 },
    {
      field: "owner",
      headerName: "Owner Alies",
      width: 250,
      hide: true,
      renderCell: (params) => <CustomRenderCell value={params?.value} />,
    },
    {
      field: "actions",
      headerName: "Actions ",
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          {hasPermissionToConvertInOpportunity &&
            generateLeadToOpportunityButton(params.row)}

          <GridDeleteIcon
            hasDeletePermission={leadsPermissions.isDelete}
            ownerId={params.row.owner.optionValue}
            userId={user?.user?._id}
            onDelete={() => showConfirmBox(params.row)}
            entity="lead"
          />
        </>
      ),
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
      if (
        dataRows.find((d) => d.isChecked && d.owner.optionValue != user._id)
      ) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const updateCheckedStatus = (params, ev) => {
    const gridData = [...dataRows];
    const indexOfRecord = gridData.findIndex((d) => d.id === params.row.id);
    gridData[indexOfRecord].isChecked = ev.target.checked;

    setDataRows([...gridData]);

    const checkedRecords = gridData.filter((d) => d.isChecked === true);

    if (checkedRecords.length === gridData.length) {
      setCheckAllLeads(true);
    } else {
      setCheckAllLeads(false);
    }
  };

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

  const handleDeleteLeads = async () => {
    setOkButtonLoading(true);
    let recs = [];
    if (deleteRec?._id) {
      recs.push(deleteRec?._id);
    } else {
      dataRows.forEach((obj) => {
        if (obj.isChecked) recs.push(obj._id);
      });
    }
    if (recs && recs.length > 0) {
      axiosInstance()
        .put(`${leadApi}/remove?entity=${selectedEntity}`, { ids: [...recs] })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setIsConformDialogVisible(false);
          setOkButtonLoading(false);
          if (deleteRec) setDeleteRec({});
          fetchLeads();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setOkButtonLoading(false);
        });
    }
  };

  const convertLeadToOpportunity = () => {
    const ids = convertLeadToOpportunityConfirmationDialog.id
      ? [convertLeadToOpportunityConfirmationDialog.id]
      : dataRows.filter((d) => d.isChecked == true).map((m) => m._id);

    axiosInstance()
      .post(`${leadApi}/to-opportunity`, { ids: ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        setConvertLeadToOpportunityConfirmationDialog({
          open: false,
          id: null,
          leadName: null,
          message: null,
        });
        if (convertLeadToOpportunityConfirmationDialog.id) {
          history.push(`${routes.opportunityDetail.path}/${data.data[0]}`)
        } else {
          fetchLeads();
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setOkButtonLoading(false);
      });
  };

  const onFilterChange = useCallback((params) => {
    if (params.filterModel.items[0].value) {
      let field = params.filterModel.items[0].columnField

      if (params.filterModel.items[0].columnField == 'createdBy') {
        field = "createdBy.user"
      }
      if (params.filterModel.items[0].columnField == 'updatedBy') {
        field = "updatedBy.user"
      }
      let deepFilter = JSON.stringify([{ field: field, term: params.filterModel.items[0].value }])
      if (params.filterModel.items[0].columnField == 'name') {
        deepFilter = JSON.stringify([{ field: "firstName", term: params.filterModel.items[0].value }, { field: "middleName", term: params.filterModel.items[0].value }, { field: "lastName", term: params.filterModel.items[0].value }])
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
    <Layout>
      <Grid container>
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.lead]} />
        </Grid>
        <Grid
          item
          md={8}
          sm={1}
          xs={2}>
          <ImportExportLinks
            module="lead(s)"
            api={leadApi}
            onSuccessfulImport={(isImportedSuccessfully) => {
              if (isImportedSuccessfully) { fetchLeads(); }
            }}
          />
        </Grid>
      </Grid>

      <CustomContainer>
        <div className="header-panel">
          <LeadsHeader
            userId={user?.user?._id}
            selectedType={selectedType}
            onTypeChange={handleLeadTypeSel}
            options={LeadTypes}
            onSearch={handleSearch}
            searchVal={searchVal}
            leadPermissions={leadsPermissions}
            onCreate={handleCreate}
            showConfirmBox={showConfirmBox}
            allowToDelete={
              !dataRows.some((d) => d.isChecked && d.owner != user?.user?._id)
            }
            icon={<HiUserGroup className="headerLogo" />}
            heading="Leads"
            allowToConvertLeadToOpportunity={
              permissions["customerAccount"].isCreate &&
              permissions["customerContact"].isCreate &&
              permissions["opportunity"].isCreate
            }
            selectedLeads={dataRows.filter((d) => d.isChecked)}
            showLeadToOpportunityConfirmationDialog={() => {
              setConvertLeadToOpportunityConfirmationDialog({
                open: true,
                id: null,
                leadName: null,
                message: `Are you sure, You want to convert selected leads to opportunity ?`,
              });
            }}
          />
        </div>
        {isOpen && (
          <ManageLeadDialog
            open={isOpen}
            onSuccess={handleClose}
            onClose={() => {
              setIsOpen(false);
            }}
            isNew={true}
            dataToUpdate={null}
            leadApi={leadApi}
          />
        )}
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
            message={`Are you sure, you want to delete Lead ${deleteRec.name || ""
              }?`}
            onClose={() => {
              if (deleteRec) setDeleteRec({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={okButtonLoading}
            onOk={handleDeleteLeads}
          />
        ) : null}

        {convertLeadToOpportunityConfirmationDialog.open ? (
          <ConfirmationDialog
            open={convertLeadToOpportunityConfirmationDialog.open}
            message={convertLeadToOpportunityConfirmationDialog.message}
            onClose={() => {
              setConvertLeadToOpportunityConfirmationDialog({
                open: false,
                id: null,
                leadName: null,
                message: null,
              });
            }}
            okBtnLoading={okButtonLoading}
            onOk={convertLeadToOpportunity}
          />
        ) : null}
      </CustomContainer>
    </Layout>
  );
};

export default Leads;
