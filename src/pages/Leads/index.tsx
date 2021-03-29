import React, { useState, useEffect, useContext } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  Grid,
  Divider,
  Tooltip,
  IconButton,
  Checkbox
} from "@material-ui/core";
import { Link } from 'react-router-dom'
import DeleteIcon from '@material-ui/icons/Delete';
import BlockIcon from '@material-ui/icons/Block';
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import Layout from "../../components/Layout";
import Container from "../../components/Container";
import CreateLeadDialog from './CreateLead'
import Header from "./LeadsHeader";
import axiosInstance from '../../axios/axiosInstance'
import { getSearchQuery } from '../../services/util'
import { useData } from '../../StateProvider/Provider';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import MessageDialog from '../../components/Helpers/MessageDialog'
import { leadDetailPage } from '../../routes/Lead'

import "./style.scss";
import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import CustomRenderCell from '../../components/Helpers/CustomRenderCell'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";

const useStyles = makeStyles((theme) => ({
  linksContainer: {
    display: "flex",
  },
  links: {
    color: theme.palette.primary.main,  //  textDark
  },
  linkDivider: {
    backgroundColor: theme.palette.primary.main,  //  darkBg
    margin: "0 1rem",
  },
}));

const LeadTypes = {
  "All Leads": 1,
  "My Leads": 2,
};

const notAllowedMes = "You must be the owner or collaborator of this contact to get the delete functionality"
let leadTimeout
const Leads = () => {
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const { state: { user } }: any = useData();
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

  useEffect(() => {
    const data = user?.role?.sideBar;

    if (data) {
      const hasLeadsPermission = data.find(d => d.name == "Lead");
      if (hasLeadsPermission) {
        setLeadsPermissions({
          isCreate: hasLeadsPermission.isCreate,
          isUpdate: hasLeadsPermission.isUpdate,
          isRead: hasLeadsPermission.isRead,
          isDelete: hasLeadsPermission.isDelete
        });
      }
    }
  }, [user]);

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
  }, [query, , selectedType]);

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
    setLoading(true);
    let searchParams: any = { ...query, filterLeads: selectedType }
    searchParams = searchVal
      ? { ...searchParams, search: searchVal }
      : { ...searchParams };
    let api = getSearchQuery("/lead", searchParams)
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

  const handleSearch = (e) => {
    if (query.page !== 0) {
      setQuery((prevState) => ({ ...prevState, page: 0 }));
    }
    setSearchVal(e.target.value);
  };

  // ****** ACTIONS BUTTON STUFF *********
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleLeadTypeSel = (e) => {
    setSelectedType(e.target.value);
  };

  const handleCreate = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
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
      field: "firstName", headerName: "Name", width: 200,
      renderCell: (params) => (
        getFirstName(params.row)
      )
    },
    {
      field: "title", headerName: "Title", width: 200,
      renderCell: (params) => <CustomRenderCell value={params?.value} />
    },
    {
      field: "company", headerName: "Company", width: 200,
      renderCell: (params) => <CustomRenderCell value={params?.value} />
    },
    {
      field: "phone", headerName: "Phone", width: 200,
      renderCell: (params) => <CustomRenderCell value={params?.value} />
    },
    {
      field: "mobile", headerName: "Mobile", width: 200,
      renderCell: (params) => <CustomRenderCell value={params?.value} />
    },
    {
      field: "email", headerName: "Email", width: 200,
      hide: true,
      renderCell: (params) => <CustomRenderCell value={params?.value} />
    },
    // { field: "status", headerName: "Lead Status", width: 200 },
    {
      field: "owner", headerName: "Owner Alies", width: 200,
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
  const getFirstName = tData => {
    return <Link className="LeadNameLink"
      to={`${leadDetailPage.path}/${tData._id}`}
    >
      {tData.name || ''}
    </Link>
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
        .put(`/lead/remove`, { ids: [...recs] }).then(({ data }) => {
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
  return (
    <Layout>
      <Grid container spacing={3} direction="row">
        <Grid item xs={12} sm={6} className="pl-3">
          <CustomBreadCrumbs routes={[routes.lead]} />
        </Grid>
        <Grid item xs={12} sm={6} className="pr-3">
          <Grid container justify="flex-end">
            <Link
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Import from Excel
            </Link>
            <Divider
              orientation="vertical"
              flexItem
              className={classes.linkDivider}
            />
            <Link
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Export to Excel
            </Link>
            <Divider
              orientation="vertical"
              flexItem
              className={classes.linkDivider}
            />
            <Link
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Download Template
            </Link>
            <Divider
              orientation="vertical"
              flexItem
              className={classes.linkDivider}
            />
            <Link
              href="#"
              onClick={(e) => e.preventDefault()}
              className={classes.links}
            >
              Email a Link
            </Link>
          </Grid>
        </Grid>
      </Grid>

      <Container>
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
        />
        {
          isOpen ?
            <CreateLeadDialog
              open={isOpen}
              onClose={handleClose}
              fetchData={fetchLeads}
            /> : null
        }
      </Container>
      <Container styles={{ minHeight: "calc(100vh - 210px)", padding: 10 }}>
        <div className="contact-grid-height1">
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
