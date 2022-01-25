import { Grid, Typography, Box, List, ListItem, ListItemText, Collapse, makeStyles } from '@material-ui/core';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import React from 'react';
import FormTypes from '../../../components/Helpers/FormTypes';
import styles from "./product-detail-page.module.scss";
import Chip from '@material-ui/core/Chip';


const useStyles = makeStyles(() => ({

  listOpen: {
    backgroundColor: "#F7F7F7",
    borderBottom: "1px solid grey"
  },
  listClose: {
    backgroundColor: "#555555",
    color: "white"
  }
}));

const ProductConfiguration = ({ data, handleChange, initializeProductConfig }) => {
  const { values, fields, error } = data;
  const classes = useStyles();

  const [expanded, setExpanded] = React.useState({});

  const onChange = (name, value) => {
    let newValues = {
      ...values,
      [name]: value
    };
    handleChange(newValues);
  };

  React.useEffect(() => {
    if (fields) {
      initializeProductConfig();
    }
  }, [fields]);

  if (!data || data.fields.length === 0 || !data.hasOwnProperty('fields')) return null;

  const handleExpand = (index) => {
    const temp = { ...expanded };
    temp[index] = !temp[index]
    setExpanded(temp)
  }

  return (<Box mt={2}>
    <h3 className={styles.product_type_heading} > Product Configuration</h3>
    {error && (
      <Typography variant="body1" color="error">
        {error}
      </Typography>
    )}
    <Grid container>
      {fields.map((field, index) => (
        <Grid item xs={12} key={field._id}>
          <List>
            <ListItem button onClick={() => { handleExpand(index) }} >
              <ListItemText inset primary={field.fieldLabel} />
              {expanded[index] ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={expanded[index]} timeout="auto" unmountOnExit className={!expanded[index] ? classes.listClose : classes.listOpen}>
              <Box display="flex" p={1}>
                {field.option.map((option) => (
                  <Box pl={1}>
                    {values[field.fieldName] === option.optionLabel ?
                      <Chip
                        clickable
                        onClick={() => { onChange(field.fieldName, option.optionLabel) }}
                        label={option.optionLabel}
                        size="medium"
                        color="primary" />
                      :
                      <Chip
                        clickable
                        onClick={() => { onChange(field.fieldName, option.optionLabel) }}
                        label={option.optionLabel}
                        size="medium"
                        variant={"outlined"}
                        color="primary" />
                    }
                  </Box>
                ))}
              </Box>
            </Collapse>
          </List>
          {/* <Box pb={1}>
              <Typography variant="body1">{field.fieldLabel}</Typography>
            </Box>
            <FormTypes
              isNew={true}
              fieldData={field}
              values={values}
              errors={{}}
              touched={{}}
              label={''}
              name={field.fieldName}
              type={field.type}
              options={field.option}
              setFieldValue={onChange}
              required={field.required}
              fullWidth
              isTooltip={field?.isTooltip || false}
              tooltipMessage={field?.tooltipMessage}
              size="small"
            /> */}
        </Grid>
      ))}
    </Grid>
  </Box>
  );
};

export default ProductConfiguration;
