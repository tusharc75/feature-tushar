import api from './axios'

export const GetProductCategory = async () => {
    const { data } = await api().get(`/productcategory`);
    return data;
};

export const GetOneProductCategory = async (id) => {
    const { data } = await api().get(`/productcategory/` + id);
    return data;
};

export const CreateProductCategory = async (inputData) => {
    const { data } = await api().post("/productcategory", inputData);
    return data;
};

export const UpdateProductCategory = async (inputData) => {
    const { data } = await api().put("/productcategory", inputData);
    return data;
};

export const DeleteProductCategory = async (id) => {
    const { data } = await api().delete(`/productcategory/` + id);
    return data;
};
