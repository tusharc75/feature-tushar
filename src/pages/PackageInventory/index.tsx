import { Box, IconButton, TextField } from '@mui/material';
import { Autocomplete } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ShowAvailableInventory from 'src/pages/PackageInventory/ShowAvailableInventory';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';

const PackageInventory = () => {
  const renderedFrom = camelCase(sidebarResource?.packageInventory);
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const { generateColumns } = useColumns();

  const {
    state: { user, selectedEntity, resources }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [plantId, setPlantId] = useState(null);
  const [plantOptions, setPlantOptions] = useState([]);
  const [showAvailableInventory, setShowAvailableInventory] = useState({ open: false, packageId: null });

  useEffect(() => {
    fetchColumns();
  }, []);

  const getPlants = () => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse,Storage Location')
      .then(({ data: { data } }) => {
        setPlantOptions([{ optionLabel: 'All', optionValue: 'All' }, ...data.Warehouse]);
        if (plantId === null && data?.Warehouse.length) {
          setPlantId('All');
        }
      });
  };

  useEffect(() => {
    getPlants();
  }, [selectedEntity]);

  const fetchColumns = async () => {
    setColumns(null);

    const packagesFields = await axiosInstance().get(`/field?resource=${sidebarResource.packages}&view=true`);

    const newColumns = generateColumns(renderedFrom, packagesFields?.data?.data, routes.packagesDetail.path);

    const defaultColumns = [
      {
        accessor: 'availableInventory',
        Header: 'Available Inventory',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => <h5 className="text-truncate">{row?.original?.availableInventory || 0}</h5>
      }
    ];

    setColumns([
      ...newColumns?.filter((c) => c?.accessor === 'packageName'),
      ...defaultColumns,
      ...newColumns?.filter((c) => c?.accessor != 'packageName'),
      ActionsRenderer
    ]);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 150,
    maxWidth: 180,
    width: 150,
    sticky: 'right',
    Cell: ({ row }) => (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Box>
          <HtmlTooltip title="View Inventory">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowAvailableInventory({ open: true, packageId: row?.original?._id });
              }}
            >
              <VisibilityOutlinedIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
        </Box>
      </div>
    )
  };

  const fetchData = () => {
    if (plantId) {
      dispatch({ type: 'loading', loading: true });
      const queryString = getQueryString();

      axiosInstance()
        .get(`${routes.packageInventory.path}${queryString}`)
        .then(({ data: { data, count } }) => {
          let rows = data?.map((u) => {
            let finalObject: any = prepareDataForGrid(u, user);
            finalObject['isChecked'] = false;
            return finalObject;
          });

          dispatch({ type: 'initialize', data: rows, count: count });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        })
        .finally(() => {
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
        });
    }
  };

  const getQueryString = (isExport = false) => {
    let tempPlantId =
      plantId === 'All'
        ? plantOptions
            .filter((d) => d.optionValue !== 'All')
            .map((d) => d.optionValue)
            .toString()
        : plantId;

    let deepFilter = `?warehouse=${tempPlantId}&page=${page}&limit=${limit}`;

    if (isExport) {
      deepFilter = `?warehouse=${tempPlantId}`;
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

  useEffect(() => {
    fetchData();
  }, [search, page, limit, filters, sorting, showFilteredRecordsOnly, plantId]);

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes?.packageInventory, title: resources?.packageInventory?.titlePlural }]} />
        <ImportExportLinks
          additionalParams={getQueryString(true)}
          permissions={{}}
          module={resources?.packageInventory?.titlePlural}
          onlyExport={true}
          api={routes.packageInventory.path}
          afterImportCompleted={() => {}}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {}}
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          leftSideContents={
            <LeftSideContents
              {...{
                plantOptions,
                plantId,
                setPlantId,
                resources
              }}
            />
          }
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          isAddButtonVisible={false}
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
            showFilters
            resource={sidebarResource.packages}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {showAvailableInventory.open && (
        <ShowAvailableInventory
          onClose={() => {
            setShowAvailableInventory({ open: false, packageId: null });
          }}
          renderedFrom={'packageAvailableInventory'}
          plantId={plantId === 'All' ? null : plantId}
          packageId={showAvailableInventory.packageId}
        />
      )}
    </section>
  );
};

export default PackageInventory;

const LeftSideContents = ({ plantOptions, plantId, setPlantId, resources }) => {
  return (
    <>
      <Autocomplete
        style={{ minWidth: '200px', flexGrow: 1 }}
        className="md:max-w-[250px]"
        options={plantOptions}
        getOptionLabel={(option: any) => option.optionLabel || ''}
        disableClearable
        getOptionSelected={(option: any, val) => option.optionValue === val}
        value={
          plantOptions.filter((data) => data.optionValue === plantId).length ? plantOptions.filter((data) => data.optionValue === plantId)[0] : ''
        }
        onChange={(e, val) => {
          if (val !== null) {
            setPlantId(val && val.optionValue ? val.optionValue : '');
          }
        }}
        size="small"
        renderInput={(params) => (
          <TextField {...params} margin="none" size="small" name="plant" label={resources?.warehouse?.titleSingular} variant="outlined" fullWidth />
        )}
      />
    </>
  );
};
