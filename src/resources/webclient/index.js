import axios from 'axios';

const environment = import.meta.env.MODE;
const webclient = async (url, opts) => {
    if (environment === 'development') {
        axios.interceptors.request.use((request) => {
            console.trace(`Made request to ${request.url}`, JSON.stringify(request, null, 2));
            return request;
        });

        axios.interceptors.response.use((response) => {
            console.trace(`Received response from ${response.config.url}`, JSON.stringify(response, null, 2));
            return response;
        });
    }

    const response = await axios(url, opts);
    return response.data;
};

export default webclient;
