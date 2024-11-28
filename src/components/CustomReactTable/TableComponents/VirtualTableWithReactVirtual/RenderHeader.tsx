import { Header, Table } from '@tanstack/react-table';
import React from 'react';
import { DraggableHeader } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';

const RenderHeader = ({
  table,
  style,
  header,
  customFilters,
  dispatch,
  isClientSideGrid,
  resource
}: {
  columnIndex: number;
  table: Table<any>;
  customFilters: any;
  dispatch: any;
  key: string;
  rowIndex: number;
  style: React.CSSProperties;
  header: Header<any, unknown>;
  isClientSideGrid: boolean;
  resource: string;
}) => {
  return (
    <div
      style={style}
      className="relative isolate text-[--primary] after:absolute after:inset-0 after:-z-10 after:[border-bottom:1px_solid_var(--common-border-color)] after:[border-right:1px_solid_var(--common-border-color)]  after:[content:''] dark:text-[white]"
    >
      <DraggableHeader
        className="bg-transparent"
        virtualization={false}
        table={table}
        customFilters={customFilters}
        dispatch={dispatch}
        isClientSideGrid={isClientSideGrid}
        header={header}
        key={header.id}
        resource={resource}
        virtualTable={false}
      />
    </div>
  );
};

export default RenderHeader;
