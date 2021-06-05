import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import ManageAccount from "./ManageAccount";
import {
  getObjKeys,
  sidebarResource,
  initializeDropdownById,
} from "../../../constants/helpers";
import { useData } from "../../../StateProvider/Provider";
import _ from "lodash";
import axiosInstance from "../../../axios/axiosInstance";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";

export default function ManageAccountDialog(props) {
  const toastConfig = useContext(CustomToastContext);

  const {
    open,
    onClose,
    id,
    accountResource,
    accountApi,
    isGetAccountData,
    onGetAddedAccount,
    owners,
    collaborators,
    fromProject,
    isRedirectToDetailPage = true,
    userId = null,
  } = props;
  const {
    state: { user },
  }: any = useData();
  const [accountData, setAccountData] = useState({
    fields: [],
    initialValues: {},
  });
  const [loading, setLoading] = useState(false);
  const history = useHistory();

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
              setAccountData({
                fields: newFields,
                initialValues: dataToClone.data
                  ? dataToClone.data
                  : getObjKeys("", newFields),
              });
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
      setAccountData({
        fields: [],
        initialValues: {},
      });
    };
  }, [user]);

  const getAccountFields = () => {
    setLoading(true);
    axiosInstance()
      .get(`/field?resource=${sidebarResource[accountResource]}`)
      .then(({ data: { data } }) => {
        const newFields = [];
        data
          .filter((d) => d.isCreate)
          .map((_f) => {
            if (userId && _f.fieldData.fieldName == "owner") {
              _f = initializeDropdownById(_f, _f.fieldData.fieldName, userId);
            }

            newFields.push(_f.fieldData);
          });

        setAccountData({
          fields: newFields,
          initialValues: getObjKeys("", newFields),
        });
        setTimeout(() => setLoading(false), 500);
      })
      .catch((err) => setLoading(false));
  };

  const handleCreateAccount = (values, saveAndNew, setValues) => {
    setLoading(true);
    axiosInstance()
      .post(`/${accountApi}`, values)
      .then(({ data }) => {
        const newId = data.data._id;
        onClose({ fetch: true, id: newId });
        if (isGetAccountData) onGetAddedAccount(data);
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        if (isRedirectToDetailPage) {
          history.push(`${accountApi}/detail/${newId}`);
        }
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

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
    />
  );
}
