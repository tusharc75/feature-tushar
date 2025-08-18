import { useContext, useEffect, useState } from 'react';
import {
  Box,
  TextField,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import { CustomToastContext } from '../../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../../../axios/axiosInstance';
import Autocomplete from '@mui/material/Autocomplete';
import { FieldArray, Form, Formik } from 'formik';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isArray } from 'lodash';
import SearchBox from 'src/components/Helpers/SearchBox';
import Grid from '@mui/material/Grid2';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const recordOptions: string[] = ['All', 'My', 'Open'];

const DefaultRecordDialog = ({ userData, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);
  const [initialValues, setInitialValues] = useState({ data: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const userByDefaultRecord = userData?.uiPreference?.byDefaultRecord;
    const userRecord = {};
    if (isArray(userByDefaultRecord)) {
      userByDefaultRecord?.forEach((e) => {
        userRecord[e.resource] = e.type;
      });
    }
    setInitialValues({
      data: resources.map((e) => {
        return {
          resource: e.resource,
          resourceLabel: e.resourceLabel,
          type: userRecord[e.resource] || 'My'
        };
      })
    });
  }, [resources]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axiosInstance()
      .get(`/sa-formbuilder/my-record-resource`)
      .then(({ data: { data } }) => {
        setResources(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const updateData = (values) => {
    setIsSubmitting(true);
    let data = {
      byDefaultRecord: values.data?.map((e) => {
        return { resource: e.resource, type: e.type };
      })
    };
    axiosInstance()
      .put(`/user/ui-preference`, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onSuccess();
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
  return (
    <>
      {initialValues?.data?.length ? (
        <Formik initialValues={initialValues} onSubmit={updateData}>
          {({ values, submitForm }) => (
            <Box>
              <Form>
                <Grid container justifyContent="flex-end">
                  <SearchBox
                    onChange={handleSearch}
                    className="terms_header_search_bar"
                    width="300px"
                    value={searchQuery}
                  />
                </Grid>
                <TableContainer component={Paper} >
                  <Table aria-label="simple table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Resource</TableCell>
                        <TableCell>By Default Records</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <FieldArray
                        name="data"
                        render={(arrayHelpers) =>
                          values.data
                            ?.filter((d) => d.resourceLabel.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((data, index) => (
                              <TableRow key={data.resource}>
                                <TableCell>{data.resourceLabel}</TableCell>
                                <TableCell>
                                  <Autocomplete
                                    value={data.type}
                                    onChange={(e, val) => {
                                      arrayHelpers.replace(index, {
                                        ...values?.data[index],
                                        ['type']: val
                                      });
                                      const res = initialValues.data;
                                      res.forEach((r) => {
                                        if (r.resource === data.resource) {
                                          r.type = val;
                                        }
                                      });
                                      setInitialValues({ data: res });
                                    }}
                                    disableClearable
                                    options={recordOptions}
                                    getOptionLabel={(option) => option}
                                    renderInput={(params) => <TextField {...params} size="small" variant="outlined" />}
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                        }
                      />
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box display="flex" justifyContent="flex-end" m={2}>
                  <ThemeButton
                    onClick={submitForm}
                    disabled={isSubmitting}
                    buttonType='theme'
                    isLoading={isSubmitting}
                  >
                    Save
                  </ThemeButton>
                </Box>
              </Form>
            </Box>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
};

export default DefaultRecordDialog;
