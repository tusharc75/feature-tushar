import { useCallback } from 'react';
import useGroups from 'src/components/CardColTimeline/useGroups';
import ArrangeView from 'src/components/CustomReactTable/ArrangeView';
import ModernBulkAction from 'src/components/CustomReactTable/GridHeader/ModernBulkAction';
import { CardColTimelineProps } from './types';
import AllColumns from 'src/components/CardColTimeline/components/AllColumns';
import ButtonMenu from 'src/components/ButtonMenu';
import RenderAllGroup from 'src/components/CardColTimeline/components/RenderAllGroup';
export * from './types';
export * from './useCardColTimeline';

export const DEFAULT_DATA_ROWS_VISIBLE = 4;

const CardColTimeline = <D, C extends readonly string[]>({
  state,
  headerSlot,
  renderedFrom,
  bulkActionItems,
  groupByButtonItems,
  fetchGroupData,
  ...rest
}: { headerSlot?: React.ReactElement; renderedFrom: string } & CardColTimelineProps<D, C>) => {
  const { columnDef, setOrderAndVisibility, setSelectedView, refreshSignal } = state;
  const groupState = useGroups({ fetchGroupData, groupByButtonItems, renderedFrom, refreshSignal });
  const { isGrouppingEnabled, groupSelectorValue, groupByButtonOptions, setGroupSelectorValue } = groupState;

  const isBulkVisible = state.selectedRecords.length > 0 || state.selectedSubRows.length > 0;

  const stateAdapter = {
    selectedRecords: state.selectedRecords,
    selectedCustomSubRows: state.selectedSubRows
  } as any;

  const dispatchAdapter = useCallback(
    (payload: { type: 'selection'; selectedRecords: any[] }) => {
      state.setSelectedSubItemsMap(new Map());
      state.setSelectedRecordMap(new Map());
    },
    [state]
  );

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        {isBulkVisible ? (
          <>
            <ModernBulkAction
              state={stateAdapter}
              dispatch={dispatchAdapter}
              bulkActionItems={bulkActionItems}
              onClose={() => state?.setSelectedSubItemsMap?.(new Map())}
            />
          </>
        ) : (
          <>
            <div className="flex-grow">{headerSlot}</div>
            {isGrouppingEnabled && (
              <ButtonMenu
                onItemClick={(e, item) => {
                  setGroupSelectorValue(item);
                }}
                horizontal="right"
                showChevron
                getLabel={(d) => {
                  const label = d.optionLabel;
                  if (label === 'Group') {
                    return 'None';
                  }
                  return label;
                }}
                getSelectedMenuItem={(d) => d.optionValue === groupSelectorValue.optionValue}
                items={groupByButtonOptions}
              >
                <span>{groupSelectorValue.optionLabel}</span>
              </ButtonMenu>
            )}
            {columnDef && (
              <ArrangeView
                columns={columnDef}
                expander={false}
                hideSelection={true}
                renderedFrom={renderedFrom}
                setOrderAndVisibility={setOrderAndVisibility}
                setCardSelectedView={setSelectedView}
              />
            )}
          </>
        )}
      </div>
      {isGrouppingEnabled && groupSelectorValue.optionValue !== 'null' ? (
        <RenderAllGroup groupState={groupState} state={state} {...rest} />
      ) : (
        <AllColumns state={state} {...rest} group={null} />
      )}
    </>
  );
};

export default CardColTimeline;
