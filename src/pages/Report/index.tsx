import React from 'react';
import { useParams } from 'react-router-dom';
import { Grid, Button, TextField, Checkbox } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { List } from '@material-ui/icons';
import { camelCase, startCase } from 'lodash';
import { isMobile } from 'react-device-detect';
import styles from '../Leads/Header.module.scss';

import routes from './../../components/Helpers/Routes';
import axiosInstance from '../../axios/axiosInstance';
import HideWhenOffline from '../../components/HideWhenOffline';
import CustomContainer from '../../components/CustomContainer';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import SearchBox from '../../components/Helpers/SearchBox';
import Tooltip from '../../components/CustomTooltipTitle';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { useData } from '../../StateProvider/Provider';
import { RESOURCE_LABEL } from './../../constants/helpers';

const Report = () => {
  const {
    state: { permissions }
  } = useData();
  let { resource } = useParams();
  let resourceCamelCase = camelCase(resource);
  let resourceStartCase = startCase(resource);
  const renderedFrom = `${resource}-report`;
  const lookupResource = 'Customer Account,Customer Contact,Warehouse'

  const [dropdownList, setDropdownList] = React.useState(null);
  const [selectedData, setSelectedData] = React.useState(null);
  const [columns, setColumns] = React.useState([]);
  const [gridApi, setGridApi] = React.useState(null);
  const [state, dispatch] = React.useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;

  React.useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = () => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${lookupResource}`)
      .then(({ data: { data } }) => {
        setDropdownList(data);
      });
  };

  const frameWorkComponents = {};

  return (
    <div>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes[resourceCamelCase], { title: 'Report', path: '' }]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <Grid container direction="row">
            <Grid item xs={12} sm={12}>
              <Grid container justifyContent="flex-end">
                <ImportExportLinks
                  permissions={permissions[resourceCamelCase]}
                  module="rentalManagements"
                  api={''}
                  afterImportCompleted={() => {}}
                  isExportAllOrSomeFeature={true}
                  total={0}
                  recordsToExport={0}
                  ids={[]}
                  onExportToExcelSuccess={() => {}}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <div>
            <Grid container className={styles.rental_header_layout} spacing={1}>
              <Grid item xs={2} sm={2}>
                <span className="listingHeader">{resourceStartCase}</span>
              </Grid>
              {/* <Grid item xs={12} sm={2}>
                <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                  <Grid style={{ display: 'flex', flex: 1, gap: '5px' }} className={isMobile ? styles.content_box : ''}>
                    <HideWhenOffline>
                      <SearchBox
                        onSearch={() => {}}
                        searchbox={isMobile ? styles.search_box_input : ''}
                        value={''}
                        size="small"
                        placeholder={`Search`}
                        style={isMobile ? { flex: 1 } : {}}
                      />
                    </HideWhenOffline>
                    <Grid style={{ display: 'flex', gap: '5px' }}></Grid>
                  </Grid>
                </Box>
              </Grid> */}
              <Grid item xs={12} sm={10}>
                <Grid container spacing={1}>
                  {dropdownList &&
                    Object.keys(dropdownList).length > 0 &&
                    Object.keys(dropdownList).map((data) => (
                      <Grid item xs={12} sm={4} md={3} key={data}>
                        <Autocomplete
                          options={dropdownList[data]}
                          limitTags={2}
                          disableCloseOnSelect={false}
                          multiple
                          value={selectedData && selectedData[data] ? selectedData[data] : []}
                          onChange={(_, val) => setSelectedData({ ...selectedData, [data]: val })}
                          fullWidth
                          getOptionSelected={(option, val) => option.optionValue === val.optionValue}
                          getOptionLabel={(option) => option.optionLabel}
                          renderInput={(params) => <TextField {...params} variant="outlined" label={data} size="small" />}
                        />
                      </Grid>
                    ))}
                  <Grid item xs={12} sm={3} md={2}>
                    <Button startIcon={<List />} color="primary" variant="outlined">Show</Button>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </div>
        </div>
        <div>
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameWorkComponents}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            actionWidth={100}
            loading={loading}
            renderedFrom={renderedFrom}
            allowSelection={false}
            isClientSideGrid={true}
            refreshGrid={() => {}}
            showOnlyShowFilteredRecordSwitch={true}
          />
        </div>
      </CustomContainer>
    </div>
  );
};

export default Report;
