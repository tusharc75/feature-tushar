import { useContext, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import AIUploadLoader from 'src/components/AiImport/AIUploadLoader';
import AiButton from 'src/components/Helpers/Buttons/AiButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const AiImport = ({ referenceData, onSuccess, resource }) => {
  const toastConfig = useContext(CustomToastContext);
  const [loading, setLoading] = useState(false);

  const handleAiImport = async (formData: FormData) => {
    try {
      setLoading(true);
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
      await axiosInstance().post(api, formData, {
        headers
      });
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'AI Import successful'
      });
      onSuccess();
      setLoading(false);
    } catch (err) {
      toastConfig.setToastConfig(err);
      setLoading(false);
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
      <AiButton onClick={() => document.getElementById('ai-import-input')?.click()}>AI Import </AiButton>
      <AIUploadLoader isProcessing={loading} />
    </>
  );
};

export default AiImport;
