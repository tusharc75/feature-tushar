import { horizontalListSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { TableHead, TableRow } from '@mui/material';
import { Fragment, memo } from 'react';
import { DraggableHeader } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';

const MemoizedHeaderRenderer = memo(DraggableHeader);

export const VirtualTableHead = memo(
  ({
    table,
    virtualColumns,
    right,
    left,
    virtualization,
    customFilters,
    dispatch,
    isClientSideGrid,
    resource,
    vtableData,
    virtualPaddingLeft,
    virtualPaddingRight
  }: any) => {
    return (
      <TableHead
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
            virtualPaddingLeft={virtualPaddingLeft}
            virtualColumns={virtualColumns}
            right={right}
            virtualPaddingRight={virtualPaddingRight}
            virtualization={virtualization}
            table={table}
            customFilters={customFilters}
            dispatch={dispatch}
            isClientSideGrid={isClientSideGrid}
            resource={resource}
            vtableData={vtableData}
            left={left}
          />
        ))}
      </TableHead>
    );
  }
);

const SingleRow = memo(
  ({
    headerGroup,
    virtualPaddingLeft,
    virtualColumns,
    right,
    virtualPaddingRight,
    virtualization,
    table,
    customFilters,
    dispatch,
    isClientSideGrid,
    resource,
    vtableData,
    left
  }: any) => {
    return (
      <TableRow className="tr sticky top-0 z-[11] !flex bg-[var(--dark-primary,_white)]" key={headerGroup.id}>
        <SortableContext items={headerGroup.headers.map((header) => header.column.columnDef.id)} strategy={horizontalListSortingStrategy}>
          {virtualPaddingLeft && left.length === 0 ? <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingLeft }} /> : null}
          {virtualColumns.map((vc) => {
            const header = headerGroup.headers[vc?.index];
            if (!header) return null;
            return (
              <Fragment key={vc.index}>
                {right.length && header.id === right[0] && virtualPaddingRight ? (
                  <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingRight }} />
                ) : null}
                <MemoizedHeaderRenderer
                  virtualization={virtualization}
                  table={table}
                  customFilters={customFilters}
                  dispatch={dispatch}
                  isClientSideGrid={isClientSideGrid}
                  header={header}
                  key={header.id}
                  resource={resource}
                  vtableData={vtableData}
                />
                {left.length && header.id === left[left.length - 1] && virtualPaddingLeft ? (
                  <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingLeft }} />
                ) : null}
              </Fragment>
            );
          })}
          {virtualPaddingRight && right.length === 0 ? <th className="virtual-p-h" style={{ display: 'flex', width: virtualPaddingRight }} /> : null}
        </SortableContext>
      </TableRow>
    );
  }
);
