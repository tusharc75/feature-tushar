import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isMobile, isTablet } from 'react-device-detect';
import { makeStyles } from '@material-ui/core/styles';
import FieldList from './FieldList';
import { DragBox } from './DragBox';
import { DropMaster } from './DropMaster';
import { CustomField } from './CustomField/index';
import styles from './Form.module.scss';
import { CHILD_RESOURCE } from "../../constants/helpers";

const subForms = [CHILD_RESOURCE.rentalManagementProduct, CHILD_RESOURCE.rentalManagementCost,
CHILD_RESOURCE.salesOrderProduct, CHILD_RESOURCE.salesOrderCost, CHILD_RESOURCE.purchaseOrderProduct, CHILD_RESOURCE.purchaseOrderService,
CHILD_RESOURCE.repairJobAsset]

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
    margin: 10
  },
  screenHeightAuto: {
    height: 'calc(85vh - 194px)',
    overflow: 'auto'
  },
  screenHeight: {
    overflow: 'auto'
  }
}));

export const FormBuilder = ({ section, setSection, deleteField, setDeleteField, isCustomField, module, extraFields, resource
  , onAddRemoveField = null,
}) => {
  const addSection = (sectionHoverIndex) => {
    let data = [...section];
    if (onAddRemoveField) onAddRemoveField()
    if (sectionHoverIndex !== null) {
      const obj = {
        sectionId: parseInt((Math.random() * 100000).toString()),
        sectionName: 'New Section ' + (data.length + 1),
        srno: data.length + 1,
        field: []
      };
      data.splice(sectionHoverIndex, 0, obj);
    } else {
      data.push({
        sectionId: parseInt((Math.random() * 100000).toString()),
        sectionName: 'New Section ' + (data.length + 1),
        srno: data.length + 1,
        field: []
      });
    }
    setSection(data);
  };

  const addDeleteField = (_id) => {
    let data = [...deleteField];
    data.push({ _id: _id });
    setDeleteField(data);
  };

  const removeExtraField = () => {
    let data = [...section];
    data.forEach((row) => {
      row.field = row.field.filter((i) => i._id);
    });
    setSection(data);
  };

  var filterFieldType = [];
  if (module === 'form-builder') {
    filterFieldType = ['DECIMAL', 'CURRENCYAMOUNT', 'FORMULA', 'VLOOKUPDROPDOWN', 'CONVERTER'];
  }
  if (module === 'pdf-template') {
    filterFieldType = ['SINGLELINE', 'MULTILINE', 'IMAGEUPLOAD'];
  }
  if (subForms.includes(resource)) {
    filterFieldType = []
    module = "form-builder-extra"
  }

  const classes = useStyles();
  return (
    <Box p={2} bgcolor="white">
      <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
        <Grid container spacing={1}>
          <Grid item xs={12} md={3} sm={4}>
            <Box border={1} p={2} borderColor="grey.300" className={styles.set_gridbox_layout}>
              <Grid container spacing={1} className={styles.form_grid_box}>
                {module !== 'pdf-template'
                  ? Object.keys(FieldList).map((type, index) => {
                    return !filterFieldType.includes(type) ? (
                      <DragBox
                        key={index}
                        type="field"
                        label={FieldList[type].label}
                        name={FieldList[type].type}
                        removeExtraField={removeExtraField}
                      />
                    ) : null;
                  })
                  : Object.keys(FieldList).map((type, index) => {
                    return filterFieldType.includes(type) ? (
                      <DragBox
                        key={index}
                        type="field"
                        label={FieldList[type].label}
                        name={FieldList[type].type}
                        removeExtraField={removeExtraField}
                      />
                    ) : null;
                  })}
              </Grid>
              {module !== 'pdf-template' && (
                <>
                  <Box >
                    <Divider />
                  </Box>
                  <DragBox name="New Section" label="New Section" type="master"></DragBox>
                  {isCustomField && (
                    <Box>
                      <CustomField />
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={9} sm={8}>
            <Box border={1} p={2} bgcolor="grey.100" borderColor="grey.300" className={classes.screenHeightAuto}>
              <DropMaster
                addSection={addSection}
                setSection={setSection}
                section={section}
                addDeleteField={addDeleteField}
                screenHeight={classes.screenHeight}
                module={module}
                extraFields={extraFields}
                onAddRemoveField={onAddRemoveField}
              />
            </Box>
          </Grid>
        </Grid>
      </DndProvider>
    </Box>
  );
};
