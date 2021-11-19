import { FC } from 'react';
import MaterialTable from 'material-table';

import { materialTableIcons } from '../../constants/helpers';

interface TableProps {
  columns: any[];
  rowData: any[];
  title?: string;
  options?: object;
  loading: boolean;
  updateProductData?: any;
  onSelection: any;
  onRowClick?: any;
  calculatePricing?: any;
  cellEditable?: any;
  parentChildData?: any;
  selectionProps?: any;
  rowStyle?: any;
}

const MaterialTableComponent: FC<TableProps> = (props) => {
  const { columns, rowData, title, loading, onSelection, calculatePricing, rowStyle, selectionProps } = props;

  return (
    <div>
      <MaterialTable
        style={{ boxShadow: "none" }}
        isLoading={loading}
        data={rowData}
        onSelectionChange={onSelection}
        totalCount={25}
        parentChildData={(row, rows) => rows.find((a) => a.treeId === row.parent)}
        options={{
          selection: true,
          hideFilterIcons: false,
          headerStyle: { backgroundColor: '#efefef', color: "#232323", padding: "0px" },
          rowStyle,
          sorting: false,
          search: false,
          padding: 'default',
          maxBodyHeight: 500,
          minBodyHeight: 500,
          paging: false,
          toolbar: false,
          editCellStyle: {
            borderBottomWidth: 0
          },
          selectionProps
        }}
        title={title}
        icons={materialTableIcons}
        columns={columns}

      />
    </div>
  );
};

export default MaterialTableComponent;
