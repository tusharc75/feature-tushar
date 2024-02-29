import { Box, Button, CircularProgress, Grid } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { DragMaster } from './DragMaster';
import styles from './fields.module.css';
import { DropMaster } from './DropMaster';
import FieldList from './FieldList';
import { useContext, useEffect, useState } from 'react';
import { uniqBy } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { fieldLabelToFieldName } from 'src/constants/helpers';

const Fields = ({ id, fetchData, formsData }) => {
  const toastConfig = useContext(CustomToastContext);

  const [section, setSection] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const data: any = [];
    const section = uniqBy(formsData?.field || [], 'sectionId');
    section?.forEach((s: any) => {
      const sectionId = s?.sectionId;
      const sectionName = s?.sectionName;
      const field = formsData?.field?.filter((_f) => _f?.sectionId === s?.sectionId);

      data.push({
        sectionId,
        sectionName,
        field
      });
    });
    setSection(data);
  }, [formsData]);

  const addSection = (sectionHoverIndex) => {
    let data = [...section];
    if (sectionHoverIndex !== null) {
      const obj = {
        sectionId: parseInt((Math.random() * 100000).toString()),
        sectionName: 'New Section ' + (data.length + 1),
        field: []
      };
      data.splice(sectionHoverIndex, 0, obj);
    } else {
      data.push({
        sectionId: parseInt((Math.random() * 100000).toString()),
        sectionName: 'New Section ' + (data.length + 1),
        field: []
      });
    }
    setSection(data);
  };

  const removeExtraField = () => {
    let data = [...section];
    data.forEach((row) => {
      row.field = row.field.filter((i) => i._id);
    });
    setSection(data);
  };

  const handleSave = () => {
    setIsSubmitting(true);

    const data = [...section];
    const field: any = [];

    let order = 0;
    data?.forEach((_section, i) => {
      _section?.field?.forEach((_field) => {
        field.push({
          ..._field,
          fieldName: fieldLabelToFieldName(_field?.fieldLabel),
          sectionId: i,
          sectionName: _section.sectionName,
          order: ++order,
          roleType: 0
        });
      });
    });

    axiosInstance()
      .put(`${routes.forms?.path}/field`, { _id: id, field })
      .then(({ data }) => {
        setIsSubmitting(false);
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box>
      <Box textAlign={'end'} pb={2}>
        <Button
          disabled={isSubmitting}
          variant="contained"
          color="primary"
          size="small"
          type="submit"
          onClick={handleSave}
          endIcon={isSubmitting && <CircularProgress color="inherit" size={18} />}
        >
          {' '}
          Save
        </Button>
      </Box>
      <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
        <Grid container spacing={1}>
          <Grid item xs={12} md={4} sm={4}>
            <Box border={1} p={2} borderColor="var(--common-border-color)" className={styles.set_gridbox_layout}>
              <Box pt={1} pb={1} pr={'8px'}>
                <DragMaster name="New Section" label="New Section" type="master"></DragMaster>
              </Box>
              <Grid container spacing={1} className={styles.form_grid_box}>
                {Object.keys(FieldList).map((type, index) => {
                  return (
                    <DragMaster
                      key={index}
                      type="field"
                      label={FieldList[type].label}
                      name={FieldList[type].type}
                      removeExtraField={removeExtraField}
                    />
                  );
                })}
              </Grid>
            </Box>
          </Grid>
          <Grid item xs={12} md={8} sm={8}>
            <Box border={1} p={2} borderColor="var(--common-border-color)" className={styles.set_gridbox_layout}>
              <DropMaster section={section} setSection={setSection} addSection={addSection} />
            </Box>
          </Grid>
        </Grid>
      </DndProvider>
    </Box>
  );
};

export default Fields;
