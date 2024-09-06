import NoDataCell from 'src/components/Helpers/NoDataCell';

const SwitchCell = ({ field, original }) => {
  if (typeof original[field?.fieldName] === 'undefined')
    // early return
    return (
      <div>
        <h5 className="text-truncate capitalize">
          <NoDataCell />
        </h5>
      </div>
    );

  return (
    <div>
      <h5 className="text-truncate capitalize">{original[field?.fieldName] ? 'Yes' : 'No'}</h5>
    </div>
  );
};

export default SwitchCell;
