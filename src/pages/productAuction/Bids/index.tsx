import { useState, useReducer, useEffect } from 'react';
import CustomAgGrid, { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import { gridLoadingTimeout } from 'src/constants/helpers';
import { CommonRenderer, DateTimeRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';

const BidsPage = ({ bids }) => {

  const [state, dispatch] = useReducer(reducer, intialState);
  const [gridApi, setGridApi] = useState(null);

  const { dataRows, rowCount, page, limit, pageSizes } = state;

  useEffect(() => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    bids?.forEach(element => {
      element.user = element?.user?.firstName + ` ` + element?.user?.lastName
    });
    dispatch({
      type: 'initialize',
      data: bids,
      count: bids?.length,
    });
    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  }, []);

  const columns = [
    { field: "user", headerName: "User", show: true, cellRenderer: "commonRenderer" },
    { field: "amount", headerName: "Amount", show: true, cellRenderer: "commonRenderer" },
    { field: "date", headerName: "Date", show: true, cellRenderer: "dateTimeRenderer" },
  ]

  const frameworkComponents = {
    commonRenderer: CommonRenderer,
    dateTimeRenderer: DateTimeRenderer
  };

  return (
    <CustomAgGrid
      setGridApi={setGridApi}
      columns={columns}
      dataRows={dataRows}
      frameworkComponents={frameworkComponents}
      dispatch={dispatch}
      rowCount={rowCount}
      limit={limit}
      pageSizes={pageSizes}
      page={page}
      allowAction={false}
      loading={false}
      allowSelection={false}
      refreshGrid={() => { }}
      showOnlyShowFilteredRecordSwitch={false}
    />
  );
};

export default BidsPage;
