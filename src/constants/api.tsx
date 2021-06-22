export const opportunityBaseApi = "/opportunity";
export const projectSalesBaseApi = "/project-sales"
export const productBaseApi = "/product";
export const quoteBuilderBaseApi = "/quote-builder";
export const productBuilderBaseApi = "/productbuilder";

const api = {
    supplerAccountApi: {

    },

    supplerContactApi: {

    },

    customerAccountApi: {

    },

    customerContactApi: {

    },

    leadApi: {

    },

    productApi: {
        base: productBaseApi
    },

    opportunityApi: {
        base: opportunityBaseApi,
        addCustomerContact: `${opportunityBaseApi}/add-customer-contacts`
    },

    projectSalesApi: {
        base: projectSalesBaseApi,
    },

    quotesApi: {

    },

    quoteBuilderApi: {
        base: quoteBuilderBaseApi
    },

    productBuilderApi: {
        base: productBuilderBaseApi
    }
}

export default api;