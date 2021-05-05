import MaterialTable from 'material-table';
import PropTypes from 'prop-types'
import { isObjectEmpty, materialTableIcons } from '../../constants/helpers';

export default function CustomDynamicGrid({ columns, data, options, fixedLeftColumns, fixedRightColumns }) {

    const commonFieldWidth = 150;
    let updateOptions: any = {
        search: false,
        paging: false,
        sorting: false,
        draggable: false,
        padding: "dense",
        defaultExpanded: true,
        toolbar: false
    };

    if (options) {
        updateOptions = { ...updateOptions, ...options };
    }

    let fixedColumns = {};
    if (fixedLeftColumns) {
        fixedColumns["left"] = fixedLeftColumns;
    }
    if (fixedRightColumns) {
        fixedColumns["right"] = fixedRightColumns;
    }

    if (!isObjectEmpty(fixedColumns)) {
        updateOptions["fixedColumns"] = fixedColumns;
    }

    columns = columns.map(column => {
        return {
            title: column["title"], field: column["field"],
            render: (rowData: any) => <div style={{ width: column["width"] ? column["width"] : commonFieldWidth }}>
                {rowData[column["field"]]}
            </div>
        }
    })

    return <MaterialTable
        icons={materialTableIcons}
        data={data}
        columns={columns}
        options={updateOptions}
    />
}

CustomDynamicGrid.propTypes = {
    columns: PropTypes.any,
    data: PropTypes.any,
    options: PropTypes.any,
    fixedLeftColumns: PropTypes.number,
    fixedRightColumns: PropTypes.number
}

// Sample To Use This Component
{/* <CustomDynamicGrid data={[
    { id: 1, name: "punit 1", surname: "soni", city: "patan", state: "Gujarat", country: "India" },
    { id: 2, name: "punit 2", surname: "soni", city: "patan", state: "Gujarat", country: "India" },
    { id: 3, name: "punit 3", surname: "soni", city: "patan", state: "Gujarat", country: "India" }
]}
    columns={[
        { title: "Id", field: "id", width: 200 },
        { title: "Name", field: "name", width: 200 },
        { title: "Surname", field: "surname", width: 200 },
        { title: "City", field: "city", width: 200 },
        { title: "State", field: "state", width: 200 },
        { title: "Country", field: "country", width: 200 }
    ]}
    fixedLeftColumns={2}
    fixedRightColumns={1}
/> */}