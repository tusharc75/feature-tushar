import { Grid } from '@material-ui/core';
import Box from '@material-ui/core/Box/Box';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, serializedAsset } from 'src/constants/helpers';

const SerializedAsset = ({ bulkAssetCreationData, renderedFrom, allowedToEdit, stepFullScreen }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, filters, sorting, selectedRecords } = state;
  const [columns, setColumns] = useState(null);
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting]);

  const fetchColumns = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(renderedFrom, data, routes.serializedAssetDetail.path);
        newColumns?.forEach((o) => {
          if (data?.find((d) => d?.fieldData.fieldName === o.accessor)?.fieldData?.type === 'singleLine' && o.accessor !== 'assetNumber') {
            o.editable = true;
          }
        });
        setColumns([...newColumns, ...getStaticFields()]);
      });
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    const queryString = getQueryString();
    axiosInstance()
      .get(`${serializedAsset.api}${queryString}`)
      .then(({ data }) => {
        let rows = data.data?.map((u, user) => {
          let finalObject = prepareDataForGrid(u);
          return {
            ...finalObject
          };
        });
        dispatch({
          type: 'initialize',
          data: rows,
          count: data.count
        });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    let filterById = [];
    filterById.push({ field: 'bulkAssetCreation', term: bulkAssetCreationData?._id });
    deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`;

    const { deepFilters } = gridFilterParser(filters);
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    return `${deepFilter}&filterType=and&filterByIdType=and`;
  };

  const handleValueUpdate = async (data, row) => {
    const key = Object.keys(data)[0];
    if (!data && !data[key]) return;
    const assetId = row?._id;
    const value = [
      {
        _id: assetId,
        [key]: row[key]
      }
    ];
    try {
      await axiosInstance()
        .post(`${routes.serializedAsset.path}/update-assets`, value)
        .then(() => {
          fetchData();
        });
    } catch (err) {
      toastConfig.setToastConfig(err);
    }
  };

  const rightSideContents = () => {
    return (
      <>
        <ImportExportLinks
          permissions={permissions?.packages}
          module={routes.serializedAsset.title}
          api={`${serializedAsset.api}/custom-template`}
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
          isDownloadExcel={false}
          isBackgroundWhite={true}
          additionalParams={`&filterById=${JSON.stringify([{ field: 'bulkAssetCreation', term: bulkAssetCreationData?._id }])}`}
          small
        />
      </>
    );
  };

  return (
    <>
      <Box display="flex" justifyContent="flex-end" m={1} alignItems="center">
        {allowedToEdit && (
          <DetailsPageHeader isActionButtonVisible={false} isAddButtonVisible={false} rightSideContents={rightSideContents()} hasXpadding />
        )}
      </Box>
      <Grid item xs={12} md={12} sm={12}>
        {columns ? (
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            hideSelection={!allowedToEdit}
            onSaveEdit={handleValueUpdate}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
    </>
  );
};

export default SerializedAsset;
