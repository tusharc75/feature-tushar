import { BulkActionContainer } from 'src/components/CustomReactTable/GridHeader';
import { MATERIAL_TYPE } from 'src/constants/helpers';

const ServicesBulkActionItems = ({ selectedServices, onClickCompleteServices }) => {
  return (
    <BulkActionContainer>
      <BulkActionContainer.Button
        id={'complete-services'}
        onClick={() => {
          onClickCompleteServices(selectedServices?.filter(e => e?.type === MATERIAL_TYPE.service)?.map(e => ({ service: e?._id, uniqueId: e?.uniqueId })))
        }}
      >
        Complete Services
      </BulkActionContainer.Button>
    </BulkActionContainer>
  );
};

export default ServicesBulkActionItems;
