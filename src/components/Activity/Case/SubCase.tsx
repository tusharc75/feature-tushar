import React, { useContext, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  TextField,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar
} from '@material-ui/core';
import { DeleteOutline } from '@material-ui/icons';

import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { number } from 'yup/lib/locale';
import { MdAdd, MdDelete } from 'react-icons/md';
import {BsDot} from "react-icons/bs"
import { classNames } from 'react-easy-crop/helpers';
import { type } from 'os';
import { resCaseColors } from '../Helpers/utils';

const useStyles = makeStyles((theme) => ({
  marginLeft: {
    marginLeft: 10
  },
  boldFont: {
    fontWeight: 500
  },
  childChipLayout: {
    fontSize: '10px',
    minWidth:"70px !important"
  }
}));

export const SubCase = ({ setId, openAddSub, setOpenAddSub, fetchCaseDetail, data }) => {
  const { setToastConfig } = useContext(CustomToastContext);
  const [childCases, setChildCases] = useState(data.childCase || null);
  



  const [isSubmitting, setSubmitting] = useState(false);
  const [caseName, setCaseName] = useState('');
  const [isError, setError] = useState(false);

  const handleSave = () => {
    if (caseName && caseName.length >= 3) {
      setSubmitting(true);
      const values = { ...data };
      delete values._id;
      values.parentId = data._id;
      values.description = '';
      values.name = caseName;

      axiosInstance()
        .post('/case', values)
        .then(() => {
          setOpenAddSub(false);
          setSubmitting(false);
          fetchCaseDetail();
        })
        .catch((err) => {
          setToastConfig(err);
          setSubmitting(false);
        });
    } else {
      setError(true);
    }
  };

  const handleOpenActivity = (id) => {
    setId(id);
  };

  const deleteCase = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    if (!id) return;

    setTimeout(() => {
      const updTasks = childCases?.filter((t) => t._id !== id);
      setChildCases(updTasks);
    }, 500);

    axiosInstance()
      .delete(`/case/${id}`)
      .then(() => {})
      .catch((err) => {
        setToastConfig(err);
      });
  };

  // const chipColor = (element) => {
  //      if(element.status === "To Do"){
  //       Chip = "green"
  //      }else if(element.status === "In Progress"){
  //       document.getElementById("demo").style.backgroundColor = 'red'
  //      }
  // }
  // chipColor(true)

  const classes = useStyles();

  return (
    <Box mt={3} mb={3}>
      {((childCases && childCases.length > 0) || openAddSub === true) && (
        <Box mb={1} className='d-flex justify-content-space-between'>
          <Typography variant="body2" className={classes.boldFont}>
            Child Case
          </Typography>
          
        </Box>
      )}
      {childCases &&
        childCases.map((element, index) => (
          <Box
            key={index}
            border={1}
            onClick={() => handleOpenActivity(element._id)}
            borderColor="grey.300"
            p={1.5}
            mb={1}
            boxShadow={1}
            borderRadius={4}
            style={{ cursor: 'pointer', padding: '6px', marginBottom: '0', boxShadow: 'none' }}
          >
            <Grid container spacing={1}>
              <Grid item xs={12} className='d-flex justify-content-space-between'>
                <Grid style={{ display: 'flex', gap: '15px' }}>
                  <Typography variant="body1" color="primary" style={{ paddingLeft: '10px', display:"flex", justifyContent:"center" , alignItems:"center" , color:"#a3a0a0" }}>
                    <BsDot/>
                  </Typography>

                  <Typography variant="body1" color="primary">
                    {element.name}
                  </Typography>
                </Grid>

                <Grid style={{ display: 'flex', gap: '15px' }}>
                  <Avatar style={{width:"24px",height:"24px"}}>M</Avatar>

                 <Chip size="small" label={element.status} color="primary" className={classes.childChipLayout} style={{
                    backgroundColor: resCaseColors[element.status],
                    color: "white",
                  }} id="check"/>
                  <IconButton size="small" style={{ color:"var(--error)"}} onClick={(e) => deleteCase(e, element._id)}>
                    <MdDelete  />
                  </IconButton>
                </Grid>

              </Grid>
              {/* <Grid container justify="flex-end">
               
                <Box mr={1} />
                <IconButton
                  size="small"
                  color="default"
                  onClick={(e) => deleteCase(e, element._id)}
                >
                  <DeleteOutline color="error" />
                </IconButton>
              </Grid> */}
            </Grid>
          </Box>
        ))}
      {openAddSub && (
        <Box>
          <TextField
            variant="outlined"
            type="text"
            label="Case Name"
            required={true}
            name="name"
            fullWidth
            margin="dense"
            onChange={(e) => setCaseName(e.target.value)}
            error={isError && caseName.length < 3}
            helperText={isError && caseName.length < 3 && 'Case name must be at least 3 letters'}
          />

          <Box mt={1}>
            <Button color="primary" size="small" variant="contained" disabled={!caseName || isSubmitting} onClick={handleSave}>
              {isSubmitting ? <CircularProgress size={18} /> : 'Create'}
            </Button>
            <Button variant="contained" size="small" className={classes.marginLeft} disableElevation onClick={() => setOpenAddSub(false)}>
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
