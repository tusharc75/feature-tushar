import { useContext } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const AiImport = ({ referenceData, onSuccess, isDynamicForm = false }) => {
  const toastConfig = useContext(CustomToastContext);

  const handleAiImport = async (formData: FormData) => {
    try {
      let api = `/dynamic-form/ai-import`;
      let headers = {};
      if (isDynamicForm) {
        headers = {
          Resource: referenceData?.linkResourceName
        };
        formData.append('isDynamicForm', 'true');
        delete referenceData?.linkResourceName;
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
      <ThemeButton buttonType="theme" onClick={() => document.getElementById('ai-import-input')?.click()}>
        AI Import
      </ThemeButton>
    </>
  );
};

export default AiImport;
