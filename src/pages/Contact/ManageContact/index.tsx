import React, { useContext, useEffect, useState } from "react";
import ManageContact from "./ManageContact";
import {
  getObjKeys,
  initializeDropdownById,
  sidebarResource,

} from "../../../constants/helpers";
import { useData } from "../../../StateProvider/Provider";
import _ from "lodash";
import { useHistory } from 'react-router-dom';
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import ManageAccountDialog from '../../Account/ManageAccount/index'

export default function ManageContactMain(props) {
  const toastConfig = useContext(CustomToastContext);

  const {
    open,
    onClose,
    onSuccess,
    accountId,
    contactResource,
    contactApi,
    account = {},
    userId = null,
    isRedirectToDetailPage = true,
    contactId = null,
    handleSubmit = null
  } = props;
  const { accountApi, accountResource, accountPermission, accountRoute } = account
  const {
    state: { user, selectedEntity },
  }: any = useData();
  const [entityData, setEntityData] = useState({
    fields: [],
    initialValues: {},
  });
  const [loading, setLoading] = useState(false);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [accountSource, setAccountSource] = useState([])
  const [newAddedAccountId, setNewAddedAccountId] = useState(null);

  const history = useHistory();

  useEffect(() => {
    const { entityData } = props
    if (entityData && entityData?.fields && entityData?.initialValues) {
      setEntityData({
        fields: entityData.fields,
        initialValues: entityData.initialValues,
      })
      entityData.fields.some(currentField => {
        if (currentField.fieldName === "accountName") {
          setAccountSource(currentField.option)
          return true
        }
      })
    }
    else getContactFields();
  }, [user]);

  const getContactFields = () => {
    setLoading(true);
    axiosInstance()
      .get(`/field?resource=${sidebarResource[contactResource]}`)
      .then(({ data: { data } }) => {
        const newFields = [];
        data
          .filter((d) => d.isCreate)
          .map((_f) => {
            //  If this dialog opens from account details screen, make that account preselected
            if (accountId && _f.fieldData.fieldName === "accountName") {
              _f = initializeDropdownById(_f, _f.fieldData.fieldName, accountId);
            }

            if (userId && _f.fieldData.fieldName == "owner") {
              _f = initializeDropdownById(_f, _f.fieldData.fieldName, userId);
            }

            if (_f?.fieldData?.fieldName && _f.fieldData.fieldName === "accountName") {
              setAccountSource(_f.fieldData.option)
            }
            newFields.push(_f.fieldData);
          });
        setEntityData({
          fields: newFields,
          initialValues: getObjKeys("", newFields),
        });
        setLoading(false);
      })
      .catch((err) => setLoading(false));
  };

  const handleCreateContact = (values, saveAndNew, setValues) => {
    setLoading(true);
    axiosInstance()
      .post(`/${contactApi}`, values)
      .then(({ data }) => {
        const newId = data.data._id;
        onClose({ fetch: true });
        onSuccess({ fetch: true });
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        if (isRedirectToDetailPage) {
          history.push(`${contactApi}/detail/${newId}`)
        }
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };
  // const handleSubmit = async (setTouched, values, setValues, setErrors, saveAndNew = false, resetForm) => {
  //     const errors = formValidation(values, _.cloneDeep(entityData.fields));
  //     if (Object.keys(errors).length) {
  //         entityData.fields.forEach((input) => {
  //             if (input.required) {
  //                 setTouched(input.fieldName, true);
  //             }
  //         });
  //     } else {
  //         handleLoading(true, saveAndNew)
  //         handleCreateContact(values, saveAndNew, setValues)
  //         setErrors({});
  //     }

  // }

  const handleDialogClose = () => {
    setShowAccountDialog(false)
  }

  const handleGetAddedAccount = ({ data }) => {
    if (data?._id) {
      setAccountSource(prevState => {
        return [...prevState, {
          optionValue: data._id, optionLabel: data.accountName,
          order: accountSource.length, default: false
        }]
      })
      setNewAddedAccountId(data._id);
    }
  }

  return (
    <>
      <ManageContact
        loading={loading}
        open={open}
        isNew={contactId ? false : true}
        onClose={onClose}
        entityData={entityData}
        handleSubmit={handleSubmit ? handleSubmit : handleCreateContact}
        accountSource={accountSource}
        onCreateAccount={() => setShowAccountDialog(true)}
        accountId={newAddedAccountId}
        contactId={contactId}
      />
      {
        showAccountDialog ?
          <ManageAccountDialog
            open={showAccountDialog}
            onClose={handleDialogClose}
            id={null}
            accountResource={accountResource}
            accountApi={accountApi}
            isGetAccountData={true}
            onGetAddedAccount={handleGetAddedAccount}
            isRedirectToDetailPage={false}
          /> : null
      }
    </>
  );
}
