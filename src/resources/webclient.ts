import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { camelizeKeys } from 'humps';

const environment: string = import.meta.env.MODE ?? 'development';
const webclient = async (url: string, opts: any): Promise<any> => {
    if (environment === 'development') {
        axios.interceptors.request.use((request: InternalAxiosRequestConfig) => {
            console.trace(`Made request to ${request.url}`, JSON.stringify(request, null, 2));
            return request;
        });

        axios.interceptors.response.use((response: AxiosResponse) => {
            if (response.data && response.headers['content-type'] === 'application/json') {
                response.data = camelizeKeys(response.data);
            }

            return response;
        });
    }

    axios.interceptors.response.use((response: AxiosResponse) => {
        console.trace(`Received response from ${response.config.url}`, JSON.stringify(response, null, 2));
        return response;
    });

    const response: AxiosResponse<any, any> = await axios(url, opts);
    return response.data;
};

export default webclient;
