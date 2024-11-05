import ArrangeViewMenu from 'src/components/CustomReactTable/ArrangeView/ArrangeViewMenu';

const ArrangeView = ({ columns, renderedFrom = null, dispatchTable, hideSelection, state, expander, appliedView, table }) => {
  return (
    <>
      <ArrangeViewMenu
        table={table}
        dispatch={dispatchTable}
        renderedFrom={renderedFrom}
        state={state}
        columns={columns}
        hideSelection={hideSelection}
        expander={expander}
        appliedView={appliedView}
      />
    </>
  );
};

export default ArrangeView;
