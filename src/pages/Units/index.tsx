import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Box, IconButton, MenuItem, Menu, FormControlLabel, Checkbox, FormGroup } from '@material-ui/core';
import { camelCase } from 'lodash';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { COLOUR_MASTER, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import ManageUnit from './ManageUnit';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { deleteDisable } from 'src/constants/messageHelpers';
import DeleteIcon from '@material-ui/icons/Delete';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import { Link } from 'react-router-dom';
import WarningIcon from '@material-ui/icons/Warning';
import { BiFilterAlt } from 'react-icons/bi';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { Close } from '@material-ui/icons';

const getWarningList = (row?: any) => {
  const icon = <WarningIcon style={{ fontSize: '16px' }} fontSize="small" color="error" />;
  const list = [
    {
      key: 1,
      warningFilter: 1,
      icon,
      title: 'Unit is assigned to multiple deals',
      label: 'Unit is assigned to multiple deals',
      isVIsible: row?.original?.secondaryStatus === 'Allocated' && row?.original?.restdeal?.length > 0
    },
    {
      key: 2,
      warningFilter: 2,
      icon,
      label: 'Manager Plus Status Conflict',
      title: 'Manager Plus Status Conflict - Status is other than Active,Committed',
      isVIsible: row?.original?.secondaryStatus === 'Allocated' && !['ACTIVE', 'COMMITTED']?.includes(row?.original?.status)
    },
    {
      key: 3,
      warningFilter: 3,
      icon,
      title: 'Unit is not ready for the deal',
      label: 'Unit is not ready for the deal',
      isVIsible:
        row?.original?.availabilityDate &&
        row?.original?.contractDate &&
        new Date(row?.original?.availabilityDate)?.getTime() > new Date(row?.original?.contractDate)?.getTime()
    },
    {
      key: 4,
      warningFilter: 4,
      icon,
      title: 'Contract Start Date has not set',
      label: 'Contract Start Date has not set',
      isVIsible: row?.original?.status === 'COMMITTED' && !row?.original?.contractDate
    }
  ];

  return list;
};

const Units = () => {
  const renderedFrom = camelCase(routes?.units.title);
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { permissions, selectedEntity }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [open, setOpen] = useState({ open: false, id: null });
  const [columns, setColumns] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const { generateColumns } = useColumns();

  // Warnings
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [checkedFilter, setCheckedFilter] = useState<null | number>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // end of Warnings

  useEffect(() => {
    fetchColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, checkedFilter]);

  const getWarnings = useCallback((row: any) => {
    const warningList = getWarningList(row).filter((d) => d.isVIsible);
    return warningList;
  }, []);

  const fetchColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.units}`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(renderedFrom, data, routes.unitDetail.path, true);
        newColumns?.forEach((o) => {
          if (o?.accessor === 'unitNumber') {
            o.cell = ({ row }) => {
              const warnings = getWarnings(row);
              return (
                <div
                  style={{
                    backgroundColor: warnings.length > 0 ? COLOUR_MASTER.lostAssets.background : ''
                  }}
                >
                  <Link className="link text-truncate" title={row?.original?.unitNumber} to={`${routes.unitDetail.path}/${row?.original?._id}`}>
                    {row?.original?.unitNumber}
                  </Link>
                  {warnings?.length > 0
                    ? warnings.map((w) => (
                        <Box ml={1}>
                          <HtmlTooltip title={w.title}>{w.icon}</HtmlTooltip>
                        </Box>
                      ))
                    : null}
                </div>
              );
            };
          }
        });
        setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${routes?.units.path}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u: any) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['canDelete'] = permissions?.units?.isDelete;
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    if (checkedFilter) {
      deepFilter = `${deepFilter}&warningFilter=${checkedFilter}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || [])?.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleDelete = async () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }

    axiosInstance()
      .put(`${routes?.units?.path}/remove`, { ids: ids })
      .then(({ data }) => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
          onClick={() => {
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords.length})`}
        </MenuItem>
      </>
    );
  };

  const rightSideContents = useMemo(() => {
    const warnings = getWarningList();
    return (
      <>
        <span className="relative">
          <span className={`flex h-[6px] w-[6px] absolute -top-[3px] -left-[3px] z-10 ${checkedFilter ? '' : 'sr-only'}`}>
            <span className="absolute -top-[3px] -left-[3px] animate-ping inline-flex rounded-full bg-sky-400 opacity-75 h-3 w-3"></span>
            <span className="inline-flex rounded-full  bg-sky-500 w-full h-full"></span>
          </span>
          <ThemeButton
            size="small"
            tooltip="Filter data by warnings"
            variant="outlined"
            iconForMobile={<BiFilterAlt />}
            startIcon={<BiFilterAlt />}
            onClick={handleClick}
          >
            Warnings
          </ThemeButton>
        </span>
        <Menu
          id="simple-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleClose}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
        >
          <h6 className="text-center px-2 py-2 text-[16px] font-semibold [border-bottom:1px_solid_var(--common-border-color)]">
            Filter Items by warning
          </h6>
          <FormGroup>
            {warnings.map((w) => (
              <MenuItem key={w.key} dense>
                <FormControlLabel
                  value="end"
                  control={
                    <Checkbox
                      color="primary"
                      checked={checkedFilter === w.warningFilter}
                      name={`${w.key}`}
                      onChange={(e) => {
                        const isChecked = checkedFilter === w.warningFilter ? null : w.warningFilter;
                        setCheckedFilter(isChecked);
                      }}
                    />
                  }
                  label={w.label}
                  labelPlacement="end"
                />
              </MenuItem>
            ))}
          </FormGroup>
          {checkedFilter && (
            <div className={`px-2 py-2 [border-top:1px_solid_var(--common-border-color)]`}>
              <ThemeButton iconForMobile={<Close />} startIcon={<Close />} onClick={() => setCheckedFilter(null)}>
                Clear all filter
              </ThemeButton>
            </div>
          )}
        </Menu>
      </>
    );
  }, [anchorEl, checkedFilter]);

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.units.title }]} />
        <ImportExportLinks
          permissions={permissions.units}
          module={routes.units.title}
          api={'units'}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          rightSideContents={rightSideContents}
          addButtonOnclick={() => {
            setOpen({ open: true, id: null });
          }}
          isAddButtonVisible={permissions?.units?.isCreate}
        />
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.units}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {open?.open && (
          <ManageUnit
            id={open?.id}
            onClose={() => {
              setOpen({ open: false, id: null });
            }}
            onSuccess={() => {
              fetchData();
              setOpen({ open: false, id: null });
            }}
          />
        )}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${routes?.units.title?.toLowerCase()} ${deleteRecord?.unitNumber || ''} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default Units;
