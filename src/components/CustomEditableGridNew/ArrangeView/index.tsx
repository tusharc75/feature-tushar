//! in development will be replaced by common arrange view compoenent
import { forwardRef } from 'react';
import ArrangeViewMenu from './ArrangeViewMenu';
import { TActios, TInitialState } from 'src/components/CustomEditableGridNew/hooks/tableReducer';
import { ApplyViewRef } from 'src/components/CustomEditableGridNew';

type ArrangeViewProps = {
  columns: any[];
  renderedFrom: string;
  dispatchTable: React.Dispatch<TActios>;
  hideSelection?: boolean;
  state: TInitialState;
  expander?: any;
  appliedView?: { hide: string[]; order: string[] };
};

const ArrangeView = forwardRef<ApplyViewRef, ArrangeViewProps>(
  ({ columns, renderedFrom = null, dispatchTable, hideSelection, state, expander, appliedView }, ref) => {
    return (
      <>
        <ArrangeViewMenu
          dispatch={dispatchTable}
          renderedFrom={renderedFrom}
          state={state}
          columns={columns}
          hideSelection={hideSelection}
          expander={expander}
          ref={ref}
          appliedView={appliedView}
        />
      </>
    );
  }
);

export default ArrangeView;
