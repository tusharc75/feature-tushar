import History from './../../ProductInventory/History/index';

const InventoryHistory = ({ id }) => {
    return (
        <History product={id} warehouse={null} />
    )
}

export default InventoryHistory;
