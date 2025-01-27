import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { Fragment, memo } from 'react';
import { DraggableHeader } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';

const MemoizedHeaderRenderer = memo(DraggableHeader) as typeof DraggableHeader;

export const VirtualTableHead = memo(
  ({
    table,
    virtualColumns,
    virtualization,
    customFilters,
    dispatch,
    isClientSideGrid,
    resource,
    vtableData,
    renderedFrom = '',
    tableHeight = '100%'
  }: any) => {
    return (
      <thead
        style={{
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        className="header sticky top-0 z-[11] bg-[var(--dark-primary,_white)]"
      >
        {table.getHeaderGroups().map((headerGroup) => (
          <SingleRow
            key={headerGroup.id}
            headerGroup={headerGroup}
            virtualColumns={virtualColumns}
            virtualization={virtualization}
            table={table}
            customFilters={customFilters}
            dispatch={dispatch}
            isClientSideGrid={isClientSideGrid}
            resource={resource}
            vtableData={vtableData}
            renderedFrom={renderedFrom}
            tableHeight={tableHeight}
          />
        ))}
      </thead>
    );
  }
) as typeof VirtualTableHead;

const SingleRow = memo(
  ({
    headerGroup,
    virtualColumns,
    virtualization,
    table,
    customFilters,
    dispatch,
    isClientSideGrid,
    resource,
    vtableData,
    renderedFrom,
    tableHeight = '100%'
  }: any) => {
    return (
      <tr className="tr sticky top-0 z-[11] !flex bg-[var(--dark-primary,_white)]" key={headerGroup.id}>
        <SortableContext items={headerGroup.headers.map((header) => header.column.columnDef.id)} strategy={horizontalListSortingStrategy}>
          {virtualColumns.map((vc) => {
            const header = headerGroup.headers[vc?.index];
            if (!header) return null;
            return (
              <Fragment key={vc.index}>
                <MemoizedHeaderRenderer
                  virtualization={virtualization}
                  virtualPosition={{ position: 'absolute', left: vc.start }}
                  table={table}
                  customFilters={customFilters}
                  dispatch={dispatch}
                  isClientSideGrid={isClientSideGrid}
                  header={header}
                  key={header.id}
                  resource={resource}
                  renderedFrom={renderedFrom}
                  vtableData={vtableData}
                  tableHeight={tableHeight}
                />
              </Fragment>
            );
          })}
        </SortableContext>
      </tr>
    );
  }
);
