import { useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import AiButton from 'src/components/Helpers/Buttons/AiButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const AiImport = ({ referenceData, onSuccess, resource }) => {
  const toastConfig = useContext(CustomToastContext);

  const handleAiImport = async (formData: FormData) => {
    try {
      let api = `/dynamic-form/ai-import`;
      let headers = {};
      if (resource) {
        headers = {
          Resource: resource
        };
      }
      Object?.keys(referenceData)?.forEach((key) => {
        formData.append(key, referenceData[key]);
      });
      const res = await axiosInstance().post(api, formData, { headers });
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'AI Import successful'
      });
      onSuccess();
    } catch (err) {
      toastConfig.setToastConfig(err);
    }
  };

  return (
    <>
      <input
        id="ai-import-input"
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          const formData = new FormData();
          formData.append('file', file);

          handleAiImport(formData);

          e.target.value = '';
        }}
      />
      <AiButton
        onClick={() => document.getElementById('ai-import-input')?.click()}>
        AI Import
      </AiButton>
    </>
  );
};

export default AiImport;
