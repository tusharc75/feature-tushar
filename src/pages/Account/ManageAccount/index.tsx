import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import ManageAccount from "./ManageAccount";
import {
  getObjKeys,
  sidebarResource,
  initializeDropdownById,
  formFieldNames,
} from "../../../constants/helpers";
import { useData } from "../../../StateProvider/Provider";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { CustomOfflineContext } from "../../../StateProvider/OfflineContext/OfflineContext";

export default function ManageAccountDialog(props) {
  const toastConfig = useContext(CustomToastContext);

  const {
    open,
    onClose,
    id,
    accountResource,
    accountApi,
    onSuccess,
    isGetAccountData,
    onGetAddedAccount,
    owners,
    collaborators,
    fromProject,
    isRedirectToDetailPage = true,
    userId = null,
    marketSegmentId = null,
    subMarketSegmentId = null,
    isClone = false,
    accountNameForClone = '',
    parentId = null
  } = props;

  const { isOffline, offlineFieldsData, offlineGridData, updateFieldsData } = useContext(CustomOfflineContext);
  const {
    state: { user },
  }: any = useData();
  const [accountData, setAccountData] = useState({
    fields: [],
    initialValues: {},
  });
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({})
  const history = useHistory();
  const [addressDataSource, setAddressDataSource] = useState([]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      axiosInstance()
        .get(`/field?resource=${sidebarResource[accountResource]}`)
        .then(({ data: { data } }) => {
          const newFields = [];
          data
            .filter((d) => d.isCreate)
            .map((_f) => newFields.push(_f.fieldData));

          axiosInstance()
            .get(`/${accountApi}/clone/${id}`)
            .then(({ data: dataToClone }) => {
              if (dataToClone) {
                dataToClone.data.accountName = "";
                dataToClone.data.billingAddress = [];
                dataToClone.data.shippingAddress = [];

              }
              setAccountData({
                fields: newFields,
                initialValues: dataToClone.data
                  ? dataToClone.data
                  : getObjKeys("", newFields),
              });
              setFormValues(dataToClone.data
                ? dataToClone.data
                : getObjKeys("", newFields))
              setTimeout(() => setLoading(false), 500);
            })
            .catch((error) => {
              setLoading(false);
            });
        });
    } else {
      getAccountFields();
    }

    return () => {
      setLoading(false);
      setFormValues({})
      setAccountData({
        fields: [],
        initialValues: {},
      });
    };
  }, [user]);

  const getAccountFields = async () => {
    setLoading(true);

    let data
    if (isOffline) {
      data = offlineFieldsData[accountResource] ?? []
    }
    else {
      const response = await axiosInstance()
        .get(`/field?resource=${sidebarResource[accountResource]}`)

      data = response?.data?.data

      try {
        updateFieldsData(accountResource, data);
      } catch (ex) {
        console.error(`Lead: Error while storing data for Offline context. Error: ${ex.message}`)
      }
    }

    const newFields = [];
    data
      .filter((d) => d.isCreate)
      .map((_f) => {
        if (userId && _f.fieldData.fieldName == "owner") {
          _f = initializeDropdownById(_f, _f.fieldData.fieldName, userId);
        }
        if (marketSegmentId && _f.fieldData.fieldName === formFieldNames.marketSegment) {
          _f = initializeDropdownById(_f, _f.fieldData.fieldName, marketSegmentId)
        }
        if (subMarketSegmentId && _f.fieldData.fieldName === formFieldNames.subMarketSegment) {
          _f = initializeDropdownById(_f, _f.fieldData.fieldName, subMarketSegmentId)
        }

        if (parentId && _f.fieldData.fieldName === formFieldNames.parentAccount) {
          _f = initializeDropdownById(_f, _f.fieldData.fieldName, parentId)
        }

        newFields.push(_f.fieldData);
      });

    let initialData = getObjKeys("", newFields)

    setAccountData({
      fields: newFields,
      initialValues: initialData,
    });
    setFormValues(getObjKeys("", newFields))
    setTimeout(() => setLoading(false), 500);

  };

  const handleCreateAccount = (values, saveAndNew, setValues) => {
    setLoading(true);

    if (!isOffline) {
      axiosInstance()
        .post(`/${accountApi}`, values)
        .then(({ data }) => {
          const newId = data.data._id;
          onClose({ fetch: true, id: newId });
          if (isGetAccountData) {
            data["addressDataSource"] = addressDataSource
            onGetAddedAccount(data);
          }
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          onSuccess(data)
          if (Boolean(isRedirectToDetailPage)) {
            history.push(`${accountApi}/detail/${newId}`);
          }
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      let storedData = {};

      if (localStorage.getItem("offlineDataToSave")) {
        storedData = JSON.parse(localStorage.getItem("offlineDataToSave"));
      }

      const dataToSave = {
        api: accountApi,
        method: "post",
        values: values
      };

      if (!storedData[accountResource]) {
        storedData[accountResource] = [];
      }
      storedData[accountResource].push(dataToSave)

      localStorage.setItem("offlineDataToSave", JSON.stringify(storedData));
      onClose({ fetch: false, id: null })
    }
  };

  const handleValuesChange = (name, value) => {
    setFormValues((prevState) => ({
      ...prevState,
      [name]: value
    }))
  }

  return (
    <ManageAccount
      open={open}
      loading={loading}
      isNew={true}
      onClose={onClose}
      accountData={accountData}
      handleSubmit={handleCreateAccount}
      owners={owners}
      collaborators={collaborators}
      fromProject={fromProject}
      formValues={formValues}
      handleValuesChange={handleValuesChange}
      marketSegmentId={marketSegmentId}
      subMarketSegmentId={subMarketSegmentId}
      isClone={isClone}
      accountNameForClone={accountNameForClone}
      accountResource={accountResource}
      accountApi={accountApi}
      addressDataSource={addressDataSource}
      setAddressDataSource={setAddressDataSource}
    />
  );
}
