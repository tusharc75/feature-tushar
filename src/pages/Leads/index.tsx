import { useState, useEffect, useContext, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Grid,
  Divider,
  Tooltip,
  IconButton,
  Checkbox
} from "@material-ui/core";
import { Link } from 'react-router-dom'
import { DataGrid } from "@material-ui/data-grid";
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import Layout from "../../components/Layout";
import Container from "../../components/Container";
import LeadsHeader from "./LeadsHeader";
import axiosInstance from '../../axios/axiosInstance'
import { getSearchQuery } from '../../services/util'
import { useData } from '../../StateProvider/Provider';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import MessageDialog from '../../components/Helpers/MessageDialog'
import { leadDetailPage } from '../../routes/Lead'

import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import CustomRenderCell from '../../components/Helpers/CustomRenderCell'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { downloadExcel, leadTemplateFileName, leadImportErrorFileName } from "../../constants/helpers";
import ManageLeadDialog from "./ManageLeadDialog/ManageLeadDialog";
import { HiUserGroup } from 'react-icons/hi';
import { lead } from '../../constants/helpers'
import moment from "moment";
import NoDataCell from "../../components/Helpers/NoDataCell";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";
import "./style.scss";

const useStyles = makeStyles((theme) => ({
  linksContainer: {
    display: "flex",
  },
  links: {
    color: theme.palette.primary.main,   //  textDark
    fontSize: "0.90rem"
  },
  linkDivider: {
    backgroundColor: theme.palette.primary.main,  //  darkBg
    margin: "0 1rem",
  },
}));

const LeadTypes = [
  {
    key: "All Leads",
    value: 1
  },
  {
    key: "My Leads",
    value: 2
  }
]

let leadTimeout
const Leads = () => {
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const { state: { user, selectedEntity, permissions } }: any = useData();
  const [searchVal, setSearchVal] = useState("");
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedType, setSelectedType] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [checkAllLeads, setCheckAllLeads] = useState(false);
  const [dataRows, setDataRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [okButtonLoading, setOkButtonLoading] = useState(false);
  const [leadData, setLeadData] = useState([]);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false)
  const [deleteRec, setDeleteRec] = useState<any>({})
  const [leadsPermissions, setLeadsPermissions] = useState({ isCreate: false, isUpdate: false, isRead: false, isDelete: false });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false)

  const [convertLeadToOpportunityConfirmationDialog, setConvertLeadToOpportunityConfirmationDialog] = useState({ open: false, id: null, leadName: null, message: null });

  const { leadResource, leadApi } = lead

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
      let name = [u.firstName, u.middleName, u.lastName].filter(d => d).join(" ");

      let res = {
        ...u,
        isChecked: false,
        id: u._id,
        name: name,
        owner: u.owner?.optionLabel ? u.owner.optionLabel : '',
      }
      return res
    });
    setDataRows([...rows]);
  }, [leadData])

  const fetchLeads = async () => {
    if (selectedEntity) {
      setLoading(true);
      let searchParams: any = { ...query, entity: selectedEntity, filterLeads: selectedType }
      searchParams = searchVal
        ? { ...searchParams, search: searchVal }
        : { ...searchParams };
      let api = getSearchQuery(leadApi, searchParams)
      try {
        axiosInstance()
          .get(api).then(({ data }) => {
            setRowCount(data.count)
            setLeadData(data.data)
            setLoading(false);
          })

      }
      catch (err) {
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


  const handleLeadTypeSel = (filteredValue) => {
    setSelectedType(filteredValue);
  };

  const handleCreate = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false);
    fetchLeads();
  }

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
            updateCheckedStatus(params, ev)
          }}
        />
      ),
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      width: 75,
    },
    {
      field: "name", headerName: "Name", width: 400,
      renderCell: (params) => (
        <Link className="LeadNameLink"
          to={`${leadDetailPage.path}/${params.row._id}`}
        >
          {params?.value ?? ''}
        </Link>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "title", headerName: "Title", width: 300,
      renderCell: (params) => <CustomRenderCell value={params?.value} />
    },
    {
      field: "company", headerName: "Company", width: 300,
      renderCell: (params) => <CustomRenderCell value={params?.value} />
    },
    {
      field: "createdBy",
      headerName: "Created By",
      width: 250,
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      renderCell: (params) =>
        params?.value && params?.value?.user ? (
          <h5 className="createBy">
            {params.value.user.firstName}
            <span
              className="createdAtTime"
              title={`${params.value.user.firstName} • ${moment(
                params?.value?.date?.slice(0, 10)
              ).format('MMM Do, YYYY')}`}
            >
              {moment(params?.value?.date?.slice(0, 10)).format(
                'MMM Do, YYYY'
              )}
            </span>
          </h5>
        ) : <NoDataCell />
    },
    {
      field: "updatedBy",
      headerName: "Updated By",
      width: 250,
      sortable: false,
      filterable: false,
      renderCell: (params) =>
        params?.value && params?.value?.user ? (
          <h5 className="updateBy">
            {params.value.user.firstName}
            <span
              title={params.value.date}
              className="updatedAtTime"
            >
              {moment(params.value.date.slice(0, 10)).format(
                'MMM Do, YYYY'
              )}
            </span>
          </h5>
        ) :
          <NoDataCell />

    },
    {
      field: "phone", headerName: "Phone", width: 250,
      renderCell: (params) => <CustomRenderCell value={params?.value} />
    },
    {
      field: "mobile", headerName: "Mobile", width: 250,
      renderCell: (params) => <CustomRenderCell value={params?.value} />
    },
    {
      field: "email", headerName: "Email", width: 250,
      hide: true,
      renderCell: (params) => <CustomRenderCell value={params?.value} />
    },
    // { field: "status", headerName: "Lead Status", width: 200 },
    {
      field: "owner", headerName: "Owner Alies", width: 250,
      hide: true,
      sortable: false,
      filterable: false,
      renderCell: (params) => <CustomRenderCell value={params?.value} />
    },
    {
      field: "actions",
      headerName: "Actions ",
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          {/* <Tooltip title="Convert this lead to opportunity" >
            <IconButton aria-label="Convert to opportunity" onClick={() => {
              const leadName = [params.row.firstName, params.row.lastName].filter(d => d).join(" ");
              setConvertLeadToOpportunityConfirmationDialog({
                open: true, id: params.row._id, leadName: leadName,
                message: `Are you sure, You want to convert ${leadName} to opportunity ?`
              })
            }}>
              <SiConvertio size={18} />
            </IconButton>
          </Tooltip> */}

          <GridDeleteIcon
            hasDeletePermission={leadsPermissions.isDelete}
            ownerId={params.row.owner.optionValue}
            userId={user._id}
            onDelete={() => showConfirmBox(params.row)}
            entity="lead"
          />

        </>
      ), width: 200
    }
  ];

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true)
      if (row && row._id) {
        setDeleteRec(row)
      }
    }
    else {
      if (dataRows.find((d) => d.isChecked && d.owner.optionValue != user._id)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true)
      }
    }
  }


  const updateCheckedStatus = (params, ev) => {
    const gridData = [...dataRows];
    const indexOfRecord = gridData.findIndex(
      (d) => d.id === params.row.id
    );
    gridData[indexOfRecord].isChecked = ev.target.checked;

    setDataRows([...gridData]);

    const checkedRecords = gridData.filter((d) => d.isChecked === true);

    if (checkedRecords.length === gridData.length) {
      setCheckAllLeads(true);
    } else {
      setCheckAllLeads(false);
    }
  }

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
  }

  const handleDeleteLeads = async () => {
    setOkButtonLoading(true)
    let recs = []
    if (deleteRec?._id) {
      recs.push(deleteRec?._id)
    }
    else {
      dataRows.forEach(obj => {
        if (obj.isChecked) recs.push(obj._id)
      })
    }
    if (recs && recs.length > 0) {
      axiosInstance()
        .put(`${leadApi}/remove?entity=${selectedEntity}`, { ids: [...recs] }).then(({ data }) => {
          toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
          setIsConformDialogVisible(false)
          setOkButtonLoading(false)
          if (deleteRec) setDeleteRec({})
          fetchLeads()
        }).catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false)
          setOkButtonLoading(false)
        })
    }
  }

  const convertLeadToOpportunity = () => {
    //  TODO: need to think about which records to pick
    const ids = convertLeadToOpportunityConfirmationDialog.id ? [convertLeadToOpportunityConfirmationDialog.id] :
      dataRows.filter(d => d.isChecked == true).map(m => m._id);

    //  TODO: api needed
    axiosInstance().put("", ids).then(({ data }) => {

      toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
      setConvertLeadToOpportunityConfirmationDialog({ open: false, id: null, leadName: null, message: null })
    }).catch((error) => {
      toastConfig.setToastConfig(error);
      setOkButtonLoading(false);
    })
  }

  const uploadLeads = (event) => {
    if (event.target.files && event.target.files.length) {
      toastConfig.setToastConfig({ open: true, type: "info", message: "Uploading lead(s), Please wait..." });
      const file = event.target.files[0];

      let formData = new FormData();
      formData.append("file", file);
      axiosInstance()
        .post(`/${leadApi}/import`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then(({ data }) => {
          if (data.message) {
            toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
            fetchLeads();
          }
          else {
            downloadExcel(data, leadImportErrorFileName);
            toastConfig.setToastConfig({ open: true, type: "error", message: "Found some issue(s) while importing lead(s)" });
          }
        })
        .catch((error) => {
          toastConfig.setToastConfig(error)
        });
    }
  };

  const onFilterChange = useCallback((params) => {
    if (params.filterModel.items[0].value) {
      setQuery((prevState) => ({
        ...prevState,
        [params.filterModel.items[0].columnField]:
          params.filterModel.items[0].value,
      }));
    } else {
      setQuery({ page: 0, limit: 25 });
    }
  }, []);
  return (
    <Layout>
      <Grid container>
        <Grid item md={6} sm={12} xs={12}>
          <CustomBreadCrumbs routes={[routes.lead]} />
        </Grid>
        <Grid item md={6} sm={12} xs={12} className="d-flex align-items-center bg-white">
          <Grid container direction="row">
            <Grid item xs={12} sm={12} className="pr-3">
              <Grid container justify="flex-end">
                <label htmlFor="importFromExcel" className={`${classes.links} cursor-pointer`}>
                  <input
                    id="importFromExcel"
                    name="importFromExcel"
                    onChange={uploadLeads}
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    style={{
                      opacity: "0",
                      position: "absolute",
                      zIndex: -1,
                    }}
                    type="file"
                  />
              Import from Excel
             </label>
                <Divider
                  orientation="vertical"
                  flexItem
                  className={classes.linkDivider}
                />
                <label
                  onClick={(e) => {
                    axiosInstance().get(`/${leadApi}/template?export=true`, { responseType: "arraybuffer" })
                      .then((response) => {
                        downloadExcel(response.data, leadTemplateFileName)
                      }).catch((error) => {
                        toastConfig.setToastConfig(error);
                      });
                  }}
                  className={`${classes.links} cursor-pointer`}
                >
                  Export to Excel
            </label>
                <Divider
                  orientation="vertical"
                  flexItem
                  className={classes.linkDivider}
                />
                <label
                  onClick={(e) => {
                    axiosInstance().get(`/${leadApi}/template`, { responseType: "arraybuffer" }).then((response) => {
                      downloadExcel(response.data, leadTemplateFileName)
                    }).catch((error) => {
                      toastConfig.setToastConfig(error);
                    });
                  }}
                  className={`${classes.links} cursor-pointer`}
                >
                  Download Template
            </label>
                <Divider
                  orientation="vertical"
                  flexItem
                  className={classes.linkDivider}
                />
                <label
                  onClick={(e) => e.preventDefault()}
                  className={`${classes.links} cursor-pointer`}
                >
                  Email a Link
            </label>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Container>
        <div className="header-panel">
          <LeadsHeader
            selectedType={selectedType}
            onTypeChange={handleLeadTypeSel}
            options={LeadTypes}
            onSearch={handleSearch}
            searchVal={searchVal}
            leadPermissions={leadsPermissions}
            onCreate={handleCreate}
            showConfirmBox={showConfirmBox}
            allowToDelete={!dataRows.some((d) => d.isChecked && d.owner != user?.user?._id)}
            icon={<HiUserGroup className="headerLogo" />}
            heading="Leads"
          />
        </div>
        {
          isOpen && <ManageLeadDialog
            open={isOpen}
            onSuccess={handleClose}
            onClose={() => { setIsOpen(false) }}
            isNew={true}
            dataToUpdate={null}
            leadApi={leadApi}
          />
        }

      </Container>
      <Container>
        <div className="listing-grid">
          <DataGrid
            components={{
              Toolbar: DataGridCustomToolbar,
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
          />
        </div>
        {
          showDeleteWarningConfirmBox ?
            <MessageDialog
              open={showDeleteWarningConfirmBox}
              message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
              onClose={() => setShowDeleteWarningConfirmBox(false)}
            /> : null
        }
        {
          isConfirmDialogVisible ?
            <ConfirmationDialog
              open={isConfirmDialogVisible}
              message={`Are you sure, you want to delete Lead ${deleteRec.name || ''}?`}
              onClose={() => {
                if (deleteRec) setDeleteRec({})
                setIsConformDialogVisible(false)
              }}
              okBtnLoading={okButtonLoading}
              onOk={handleDeleteLeads}
            /> : null
        }

        {
          convertLeadToOpportunityConfirmationDialog.open ?
            <ConfirmationDialog
              open={convertLeadToOpportunityConfirmationDialog.open}
              message={convertLeadToOpportunityConfirmationDialog.message}
              onClose={() => {
                setConvertLeadToOpportunityConfirmationDialog({ open: false, id: null, leadName: null, message: null })
                fetchLeads();
              }}
              okBtnLoading={okButtonLoading}
              onOk={convertLeadToOpportunity}
            /> : null
        }

      </Container>
    </Layout>
  );
};

export default Leads;
