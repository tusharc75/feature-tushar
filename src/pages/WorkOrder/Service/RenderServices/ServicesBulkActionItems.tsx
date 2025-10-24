import { BulkActionContainer } from 'src/components/CustomReactTable/GridHeader';

const ServicesBulkActionItems = ({ selectedServices }) => {
  return (
    <BulkActionContainer>
      <BulkActionContainer.Button
        id={'test-button-1'} // Use a meaningful ID when modifying the button.
        onClick={() => {
          console.log(selectedServices);
        }}
      >
        Test 1 button
      </BulkActionContainer.Button>
      <BulkActionContainer.Button
        buttonType="red"
        id={'test-button-2'} // Use a meaningful ID when modifying the button.
        onClick={() => {
          console.log(selectedServices);
        }}
      >
        Test 2 button
      </BulkActionContainer.Button>
    </BulkActionContainer>
  );
};

export default ServicesBulkActionItems;
