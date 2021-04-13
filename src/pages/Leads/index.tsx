import { useState, useEffect, useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Grid,
  Divider,
  Tooltip,
  IconButton,
  Checkbox
} from "@material-ui/core";
import { Link } from 'react-router-dom'
import DeleteIcon from '@material-ui/icons/Delete';
import { DataGrid } from "@material-ui/data-grid";
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import Layout from "../../components/Layout";
import Container from "../../components/Container";
import Header from "./LeadsHeader";
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

const notAllowedMes = "You must be the owner or collaborator of this contact to get the delete functionality"
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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [leadData, setLeadData] = useState([]);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false)
  const [deleteRec, setDeleteRec] = useState<any>({})
  const [leadsPermissions, setLeadsPermissions] = useState({ isCreate: false, isUpdate: false, isRead: false, isDelete: false });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false)

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
      )
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
          {
            leadsPermissions.isDelete ?
              params.row.owner.optionValue == user._id ?
                <Tooltip title="Delete" >
                  <IconButton aria-label="Delete" onClick={() => showConfirmBox(params.row)}>
                    <DeleteIcon
                      fontSize="small" color="error" />
                  </IconButton>
                </Tooltip > :
                <Tooltip className="cursor-stop" title="You must be the owner of this lead to get the delete functionality">
                  <IconButton aria-label="Delete">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip> :
              <Tooltip className="cursor-stop" title="You do not have permission to delete lead">
                <IconButton aria-label="Delete">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
          }

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
    setDeleteLoading(true)
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
          setDeleteLoading(false)
          if (deleteRec) setDeleteRec({})
          fetchLeads()
        }).catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false)
          setDeleteLoading(false)
        })
    }
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

  return (
    <Layout>
      <CustomBreadCrumbs routes={[routes.lead]} />
      <Grid container direction="row" className="header-links">
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
      <Container>
        <div className="header-panel">
          <Header
            selectedType={selectedType}
            onTypeChange={handleLeadTypeSel}
            options={LeadTypes}
            onSearch={handleSearch}
            searchVal={searchVal}
            leadPermissions={leadsPermissions}
            onCreate={handleCreate}
            showConfirmBox={showConfirmBox}
            canDelete={dataRows.filter((d) => d.isChecked).length == 0}
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
              okBtnLoading={deleteLoading}
              onOk={handleDeleteLeads}
            /> : null
        }
      </Container>
    </Layout>
  );
};

export default Leads;
