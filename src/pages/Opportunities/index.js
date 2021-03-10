import React, { useState, useEffect } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import {
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Checkbox,
} from "@material-ui/core";
import { Link } from 'react-router-dom'
import { accountDetailPage } from '../../routes/Accounts'
import DeleteIcon from '@material-ui/icons/Delete';
import BlockIcon from '@material-ui/icons/Block';
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import { useData } from '../../StateProvider/Provider';
import Layout from "../../components/Layout";
import Container from "../../components/Container";
import { capitalize } from '../../services/util'
import axiosInstance from '../../axios/axiosInstance'
import { getSearchQuery, displayDate } from '../../services/util'
import { CustomEventEmitter } from './../../axios/events';
import Header from "./Header";
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import CreateOpportunity from './CreateOpportunity'
import MessageDialog from '../../components/Helpers/MessageDialog'
import "./style.css";

let opportunityTimeout
const useStyles = makeStyles((theme) => ({
  linksContainer: {
    display: "flex",
  },
  links: {
    color: theme.palette.textDark,
  },
  linkDivider: {
    backgroundColor: theme.palette.darkBg,
    margin: "0 1rem",
  },
}));

const OpportunityTypes = {
  "All Opportunities": 1,
  "My Opportunities": 2,
};

const Opportunities = () => {
  const classes = useStyles();
  const { state: { user } } = useData();
  const [searchVal, setSearchVal] = useState("");
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedType, setSelectedType] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [checkAllOpprtunities, setCheckAllOpportunities] = useState(false);
  const [dataRows, setDataRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [opportunityData, setOpportunityData] = useState([]);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false)
  const [deleteRec, setDeleteRec] = useState({})
  const [opportunityPermissions, setOpportunityPermissions] = useState({ isCreate: false, isRead: false, isDelete: false });
  const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] = useState(false);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false)

  useEffect(() => {
    const data = user?.role?.sideBar;

    if (data) {
      const hasOpportunityPermission = data.find(d => d.name == "Opportunity");
      if (hasOpportunityPermission) {
        setOpportunityPermissions({ isCreate: hasOpportunityPermission.isCreate, isRead: hasOpportunityPermission.isRead, isDelete: hasOpportunityPermission.isDelete });
      }
    }
  }, [user]);

  useEffect(() => {
    let millisec = Object.keys(searchVal).length > 0 ? 600 : 5;
    if (opportunityTimeout) {
      clearTimeout(opportunityTimeout);
    }

    opportunityTimeout = setTimeout(() => {
      fetchOpportunities();
    }, millisec);

  }, [searchVal]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchOpportunities();
    } else setRenderCount((preCount) => preCount + 1);
  }, [query, , selectedType]);

  useEffect(() => {
    let rows = opportunityData?.map((u) => {
      let res = {
        ...u,
        isChecked: false,
        id: u._id,
        owner: u.owner?.optionLabel ? u.owner.optionLabel : '',
        stage: u?.stage?.optionLabel,
        closeDate: u?.closeDate ? displayDate(u.closeDate) : '',
        // accountName: u?.accountName?.optionLabel || ''
      }
      return res
    });
    setDataRows([...rows]);
  }, [opportunityData])

  const fetchOpportunities = async () => {
    setLoading(true);
    let searchParams = { ...query, filterOpportunities: selectedType }
    searchParams = searchVal
      ? { ...searchParams, search: searchVal }
      : { ...searchParams };
    let api = getSearchQuery("/opportunity", searchParams)
    try {
      axiosInstance()
        .get(api).then(({ data }) => {
          setRowCount(data.count)
          setOpportunityData(data.data)
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

  const handleOpportunityTypeSel = (e) => {
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
          checked={checkAllOpprtunities}
          onChange={(ev) => {
            setCheckAllOpportunities(ev.target.checked);
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
      field: "opportunityName", headerName: "Opportunity Name", width: 200,
      renderCell: (params) => (
        getFirstName(params.row)
      )
    },
    {
      field: "accountName", headerName: "Account Name", width: 200,
      renderCell: (params) => (
        <Link className="accountNameLink" to={`${accountDetailPage.path}/${params?.row?.accountName?.optionValue}`}>
          {params?.row?.accountName?.optionLabel ? params.row.accountName.optionLabel : ''}
        </Link>
      )
    },
    { field: "stage", headerName: "Stage", width: 200 },
    { field: "closeDate", headerName: "Close Date", width: 200 },
    // { field: "status", headerName: "Lead Status", width: 200 },
    { field: "owner", headerName: "Opportunity Owner", width: 200 },
    {
      field: "actions", headerName: "Actions ",
      renderCell: (params) => (
        <>
          {
            opportunityPermissions.isDelete ?
              params.row.allowToDelete ?
                <Tooltip
                  title="Delete" >
                  <IconButton aria-label="Delete" onClick={() => showConfirmBox(params.row)} >
                    <DeleteIcon
                      fontSize="small" color="error" />
                  </IconButton>
                </Tooltip > :
                <Tooltip className="cursor-stop" title="You must be the owner of this opportunity to get the delete functionality">
                  <IconButton aria-label="Delete">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip> :
              <Tooltip className="cursor-stop" title="You do not have permission to delete opportunity">
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
      if (dataRows.find((d) => d.isChecked && d.allowToDelete == false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true)
      }
    }
  }
  const getFirstName = tData => {
    return <Link className="nameLink"
      to={`/opportunity/detail/${tData._id}`}
    >
      {capitalize(tData.opportunityName) || ''}
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
      setCheckAllOpportunities(true);
    } else {
      setCheckAllOpportunities(false);
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
  const clickCreateNew = () => {
    setShowCreateOpportunityDialog(true);
  }
  const handleDeleteOpportunity = async () => {
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
        .put(`/opportunity/remove`, { ids: [...recs] }).then(({ data }) => {
          CustomEventEmitter.dispatch("show-toast", { type: "success", errorMsg: data.message });
          setIsConformDialogVisible(false)
          setDeleteLoading(false)
          if (deleteRec) setDeleteRec({})
          fetchOpportunities()
        }).catch(err => {
          setIsConformDialogVisible(false)
          setDeleteLoading(false)
        })
    }
  }

  return (
    <>
      <Layout>
        <Grid container spacing={3} direction="row">
          <Grid item xs={12} sm={6} className="pl-3"></Grid>
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

        {/* Tables Begins Here */}
        <Container>
          <Header
            selectedType={selectedType}
            onTypeChange={handleOpportunityTypeSel}
            options={OpportunityTypes}
            onSearch={handleSearch}
            searchVal={searchVal}
            opportunityPermissions={opportunityPermissions}
            onCreate={clickCreateNew}
            showConfirmBox={showConfirmBox}
            canDelete={dataRows.filter((d) => d.isChecked).length == 0}

          />
        </Container>
        <Container styles={{ minHeight: "calc(100vh - 210px)", padding: 10 }}>
          <div className="contact-grid-height1">
            <DataGrid
              components={{
                Toolbar: GridToolbar,
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
                message={`Are you sure, you want to delete ${deleteRec?.opportunityName ? "Opportunity" : "Opportunities"}   ${deleteRec.opportunityName || ''}?`}
                onClose={() => {
                  if (deleteRec) setDeleteRec({})
                  setIsConformDialogVisible(false)
                }}
                okBtnLoading={deleteLoading}
                onOk={handleDeleteOpportunity}
              /> : null
          }
          {
            showCreateOpportunityDialog && <CreateOpportunity
              open={showCreateOpportunityDialog}
              onClose={() => setShowCreateOpportunityDialog(false)}
              onSuccess={() => {
                setShowCreateOpportunityDialog(false);
                fetchOpportunities()
              }}
            />
          }
        </Container>
      </Layout>
    </>
  );
};

export default Opportunities;
