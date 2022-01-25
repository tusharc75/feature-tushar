import DetailsPage from '../../../components/Shared/DetailsPage';

const ProductSummary = ({ data }) => {

    const { values, fields } = data;

    return (fields.length > 0 && <DetailsPage data={values} fields={fields.map((d) => { return { fieldData: { ...d, sectionName: "Product Summary" } } })} />);
};

export default ProductSummary;
