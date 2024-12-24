import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import ConditionDialog from './ConditionDialog';
import { MoreHoriz, Settings } from '@material-ui/icons';
import axiosInstance from 'src/axios/axiosInstance';
import { LOGIC } from '../../helper';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Entity } from 'src/components/FormBuilder/AddField/entity';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  group: {
    paddingTop: '2px',
    paddingBottom: '2px',
    paddingLeft: '10px',
    paddingRight: '10px'
  }
});

const Visibility = ({ values, setFieldValue, fields, fieldsToExclude, touched, errors, isVisibilityFromSection = false }) => {
  const classes = useStyles();
  const [open, setOpen] = useState({ open: false, group: null, data: null });
  const [anchorEl, setAnchorEl] = useState({});
  const [anchorElSetting, setAnchorElSetting] = useState({});
  const [data, setData] = useState({});

  const handleClose = (i) => {
    setAnchorEl({ ...anchorEl, [i]: null });
  };

  const handleCloseSetting = (i) => {
    setAnchorElSetting({ ...anchorElSetting, [i]: null });
  };

  useEffect(() => {
    if (!values?.visibilityCondition?.length) {
      setFieldValue('visibilityCondition', [
        {
          index: 0,
          logic: LOGIC.AND,
          fields: []
        }
      ]);
    } else {
      fetchFieldvalue();
    }
  }, [values?.visibilityCondition]);

  const fetchFieldvalue = async () => {
    const query: any = [];
    values?.visibilityCondition?.forEach((v) => {
      v?.fields.forEach((f) => {
        const fieldData = fields?.find((_f) => _f?.fieldName === f?.fieldName);
        if (fieldData?.lookup || fieldData?.dataList) {
          if (query?.find((q) => q?.fieldName === fieldData?.fieldName)) {
            query?.forEach((q) => {
              if (q?.fieldName === fieldData?.fieldName) {
                q._id = [...new Set([...q?._id, ...f?.value?.split(',')])];
              }
            });
          } else {
            query.push({
              resource: fieldData?.lookup ? fieldData?.lookupResource : fieldData?.dataList ? fieldData?.dataListId : '',
              dataList: fieldData?.dataList ? true : false,
              fieldName: fieldData?.fieldName,
              _id: f?.value?.split(',')
            });
          }
        }
      });
    });
    if (query?.length) {
      const {
        data: { data }
      } = await axiosInstance().get(`/sa-formbuilder/resource/fieldLabel?data=${JSON.stringify(query)}`);
      setData(data);
    }
  };

  const handleDeleteCondition = (group, fieldName) => {
    let visibilityCondition = values?.visibilityCondition || [];
    visibilityCondition = visibilityCondition?.map((v) => {
      if (v?.index === group) {
        v.fields = v?.fields?.filter((f) => f?.fieldName != fieldName);
      }
      return v;
    });
    setFieldValue('visibilityCondition', visibilityCondition);
  };

  return (
    <Box>
      {!isVisibilityFromSection && <Entity values={values} setFieldValue={setFieldValue} errors={errors} touched={touched} />}
      <Box pl={0.5} pt={2}>
        <Typography variant="subtitle2">ONLY SHOW WHEN...</Typography>
      </Box>
      {values &&
        values?.visibilityCondition?.map((c) => (
          <Box border={1} borderColor="var(--common-border-color)" mt={1} p={1}>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
              <Box>
                <ToggleButtonGroup
                  size="small"
                  color="primary"
                  classes={{ grouped: classes.group }}
                  value={c?.logic || LOGIC.AND}
                  exclusive
                  onChange={(e, val) => {
                    setFieldValue(
                      'visibilityCondition',
                      values?.visibilityCondition?.map((_c) => {
                        if (_c?.index === c?.index) {
                          return { ..._c, logic: val };
                        }
                        return _c;
                      })
                    );
                  }}
                  aria-label="logic"
                >
                  <ToggleButton size="small" value={LOGIC.AND}>
                    {LOGIC.AND}
                  </ToggleButton>
                  <ToggleButton size="small" value={LOGIC.OR}>
                    {LOGIC.OR}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <IconButton
                aria-label="setting"
                size="small"
                onClick={(e) => {
                  setAnchorElSetting({ ...anchorElSetting, [c?.index]: e.currentTarget });
                }}
              >
                <Settings fontSize="small" />
              </IconButton>
              <Menu
                id="simple-menu-setting"
                anchorEl={anchorElSetting[c?.index]}
                keepMounted
                open={Boolean(anchorElSetting[c?.index])}
                onClose={() => {
                  handleCloseSetting(c?.index);
                }}
              >
                <MenuItem
                  onClick={() => {
                    setFieldValue(
                      'visibilityCondition',
                      values?.visibilityCondition?.filter((_c) => _c?.index != c?.index)?.map((_c, i) => ({ ..._c, index: i }))
                    );
                    handleCloseSetting(c?.index);
                  }}
                >
                  Delete
                </MenuItem>
              </Menu>
            </Box>
            {c?.fields?.map((_f, j) => (
              <Box
                border={1}
                borderColor="var(--common-border-color)"
                p={1}
                px={2}
                display={'flex'}
                justifyContent={'space-between'}
                alignItems={'center'}
                mt={1}
              >
                <Typography variant="body2">{`${fields?.find((f) => f?.fieldName === _f?.fieldName)?.fieldLabel} is ${
                  fields?.find((f) => f?.fieldName === _f?.fieldName)?.lookup || fields?.find((f) => f?.fieldName === _f?.fieldName)?.dataList
                    ? data[_f?.fieldName]
                      ? data[_f?.fieldName]
                          ?.filter((d) => _f?.value?.split(',').includes(d?.optionValue))
                          ?.map((v) => v?.optionLabel)
                          ?.join(', ')
                      : ''
                    : _f?.value
                }`}</Typography>
                <Box>
                  <IconButton
                    aria-label="setting"
                    size="small"
                    onClick={(e) => {
                      setAnchorEl({ ...anchorEl, [`${c?.index}_${j}`]: e.currentTarget });
                    }}
                  >
                    <MoreHoriz fontSize="small" />
                  </IconButton>
                  <Menu
                    id="simple-menu"
                    anchorEl={anchorEl[`${c?.index}_${j}`]}
                    keepMounted
                    open={Boolean(anchorEl[`${c?.index}_${j}`])}
                    onClose={() => {
                      handleClose(`${c?.index}_${j}`);
                    }}
                  >
                    <MenuItem
                      onClick={() => {
                        handleClose(`${c?.index}_${j}`);
                        setOpen({ open: true, group: c?.index, data: _f });
                      }}
                    >
                      Edit
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        handleDeleteCondition(c?.index, _f?.fieldName);
                        handleClose(`${c?.index}_${j}`);
                      }}
                    >
                      Delete
                    </MenuItem>
                  </Menu>
                </Box>
              </Box>
            ))}
            <Box mt={2}>
              <Button
                variant="outlined"
                size="small"
                color="primary"
                onClick={() => {
                  setOpen({ open: true, group: c?.index, data: null });
                }}
              >
                Add Condition
              </Button>
            </Box>
          </Box>
        ))}
      <Box mt={2} mb={2}>
        <Button
          variant="outlined"
          size="small"
          color="primary"
          onClick={() => {
            setFieldValue('visibilityCondition', [
              ...values?.visibilityCondition,
              {
                index: values?.visibilityCondition?.length,
                logic: LOGIC.AND,
                fields: []
              }
            ]);
          }}
        >
          Add Group
        </Button>
      </Box>
      {open?.open && (
        <ConditionDialog
          onClose={() => {
            setOpen({ open: false, group: null, data: null });
          }}
          group={open?.group}
          data={open?.data}
          fieldValue={values}
          setValue={setFieldValue}
          fields={fields}
          fieldsToExclude={fieldsToExclude}
        />
      )}
    </Box>
  );
};

export default Visibility;
