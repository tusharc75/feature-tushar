import React, { useEffect } from 'react';
import Layout from "../../components/Layout";
import { GetContacts } from '../../axios/index';

export default function Contact() {

    useEffect(() => {
        getContacts();
        // if (state) {
        //     getEntiy(state.entityId);
        // }

        // getEntityCount();

        // return () => setSelectedEntity(null);
        // eslint-disable-next-line
    }, []);

    const getContacts = () => {
        GetContacts().then(({ data }) => {
            debugger
        });
    };

    return (
        <Layout>
            Contacts
        </Layout>
    )
}
