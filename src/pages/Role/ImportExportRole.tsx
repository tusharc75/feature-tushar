import { useContext } from "react";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";

const ImportExportRole = ({resource, childrenResource, field, setResource, setChildrenResource, setField, isExport = false, isImport  =false, roleName = ''}) => {
  const toastConfig = useContext(CustomToastContext);
  const handleExportRole = () => {
    const data = [
      {
        importResource: resource,
        importChildrenResource: childrenResource,
        importField: field
      }
    ];
    const jsonData = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const jsonURL = URL.createObjectURL(jsonData);
    const link = document.createElement('a');
    link.href = jsonURL;
    link.download = `${roleName || 'Roles'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleImportRole = (e) => {
    e.preventDefault();
    var files = e.target.files,
      f = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      var data: any = e.target.result;
      const parsedData = JSON.parse(data)
      const { importResource, importChildrenResource, importField  } = parsedData[0];

      if (!importResource || !importField || !importChildrenResource) {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: 'Invalid data'
        });
      }
     const currResource = resource?.map((_resource)=> {
        const matchedResource = importResource?.find((r)=> r.name===_resource.name);
        if(matchedResource){
         return {
          ..._resource,
          isCreate: matchedResource?.isCreate,
          isDelete: matchedResource?.isDelete,
          isHidden: matchedResource?.isHidden,
          isRead: matchedResource?.isRead,
          isUpdate: matchedResource?.isUpdate,
          isCreateDisabled: matchedResource?.isCreateDisabled,
          isDeleteDisabled: matchedResource?.isDeleteDisabled,
          isHiddenDisabled: matchedResource?.isHiddenDisabled,
          isReadDisabled: matchedResource?.isReadDisabled,
          isUpdateDisabled: matchedResource?.isUpdateDisabled
         }
        }else{
          return _resource;
        }
     })
     const currField = field?.map((_field)=> {
      const matchedField = importField?.find((f)=> f.fieldData.fieldName === _field.fieldData.fieldName && f.fieldData.resource === _field.fieldData.resource);
      if(matchedField){
       return {
        ..._field,
        isCreate: matchedField?.isCreate,
        isRead: matchedField?.isRead,
        isUpdate: matchedField?.isUpdate,
        isCreateDisabled: matchedField?.isCreateDisabled,
        isDeleteDisabled: matchedField?.isDeleteDisabled,
        isHiddenDisabled: matchedField?.isHiddenDisabled,
        isReadDisabled: matchedField?.isReadDisabled,
        isUpdateDisabled: matchedField?.isUpdateDisabled
       }
      }else{
        return _field;
      }
   })

   const currChildrenResource = childrenResource?.map((_child)=> {
    const matchedChildResource = importChildrenResource?.find((c)=> c.name===_child.name && c.parentResource===_child.parentResource);
    if(matchedChildResource){
     return {
      ..._child,
      isCreate: matchedChildResource?.isCreate,
      isDelete: matchedChildResource?.isDelete,
      isRead: matchedChildResource?.isRead,
      isHidden: matchedChildResource?.isHidden,
      isUpdate: matchedChildResource?.isUpdate,
      isCreateDisabled: matchedChildResource?.isCreateDisabled,
      isDeleteDisabled: matchedChildResource?.isDeleteDisabled,
      isHiddenDisabled: matchedChildResource?.isHiddenDisabled,
      isReadDisabled: matchedChildResource?.isReadDisabled,
      isUpdateDisabled: matchedChildResource?.isUpdateDisabled
     }
    }else{
      return _child;
    }
 })
 
      setResource(currResource);
      setField(currField);
      setChildrenResource(currChildrenResource);
    };
    reader.readAsBinaryString(f);
  }

  return (
    <div>
      {isImport && (
        <label className={`new-headerbox-button-v1`} style={{ padding: '8px' }} htmlFor="importRole">
          Import Role
          <input
            accept="json"
            onClick={(e: any) => (e.target.value = null)}
            id="importRole"
            name="importRole"
            onChange={handleImportRole}
            style={{
              opacity: '0',
              position: 'absolute',
              zIndex: -1,
              maxWidth:'1px'
            }}
            type="file"
          />
        </label>
      )}
      {isExport && (
        <>
      <label className={`new-headerbox-button-v1`} style={{ padding: '8px' }} onClick={handleExportRole}>
        Export Role
      </label>
      <a id="downloadAnchorElem" style={{ display: 'none' }}></a>
      </>
      )}
    </div>
  );
};

export default ImportExportRole;
