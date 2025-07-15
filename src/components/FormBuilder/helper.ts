import { sortBy } from 'lodash';
import axiosInstance from '../../axios/axiosInstance';
import FieldList from 'src/components/FormBuilder/FieldList';

export const getLookupResource = async () => {
  const {
    data: { data }
  } = await axiosInstance().get(`sa-formbuilder/lookup/options?type=brand`);
  return sortBy(data, ['name'])?.map((e) => {
    return { optionLabel: e.name, optionValue: e.value };
  });
};

export const getResourceField = async (resource, view = false) => {
  const {
    data: { data }
  } = await axiosInstance().get(`/field?resource=${resource}&view=${view}`);
  return data?.map((e) => {
    return { fieldName: e.fieldData.fieldName, fieldLabel: e.fieldData.fieldLabel, lookup: e.fieldData.lookup, type: e.fieldData.type };
  });
};

export const getEntity = async (brandId) => {
  const {
    data: { data }
  } = await axiosInstance().get(`/entity`);
  return data?.map((data) => ({ optionValue: data._id, optionLabel: data?.entityName }));
};

export const getLookupOption = async (brandId, resource) => {
  const {
    data: { data }
  } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=` + resource);
  return data[resource] || [];
};

export const LOGIC = {
  AND: 'AND',
  OR: 'OR'
};

export const OPERATOR = [
  {
    optionLabel: 'Less than',
    optionValue: 'lessThan'
  },
  {
    optionLabel: 'Less than or equals',
    optionValue: 'lessThanOrEquals'
  },
  {
    optionLabel: 'Greater than',
    optionValue: 'greaterThan'
  },
  {
    optionLabel: 'Greater than or equals',
    optionValue: 'greaterThanOrEquals'
  }
];

export const OPERATION_ON_LINE_ITEMS = {
  add: 'Add',
  subtract: 'Subtract'
};

export const PRE_FILTER_CHECKBOX_OPTION = {
  yes: 'YES',
  no: 'NO'
}

export const checkBoxOptions = [
  { optionLabel: 'YES', optionValue: 'yes' },
  { optionLabel: 'NO', optionValue: 'no' }
];

export const NOT_ALLOW_INLINE_EDIT_FIELD_TYPE = [
  FieldList.FORMULA.type,
  FieldList.VLOOKUPDROPDOWN.type,
  FieldList.CONVERTER.type,
  FieldList.SWITCH.type,
  FieldList.CHECKBOX.type,
  FieldList.IMAGEUPLOAD.type,
  FieldList.MULTIIMAGEUPLOAD.type,
  FieldList.FILEUPLOAD.type,
  FieldList.MULTIFILEUPLOAD.type,
  FieldList.LOCATION.type,
  FieldList.GPSLOCATION.type,
  FieldList.PROCESS.type,
  FieldList.FREESTYLEMULTISELECT.type,
  FieldList.RICHTEXTEDITOR.type,
  FieldList.SIGNATURE.type,
  FieldList.GROUPSIGNATURE.type,
  FieldList.LOOKUPDISPLAY.type,
  FieldList.COUNTER.type,
  FieldList.DESCRIPTION.type
]