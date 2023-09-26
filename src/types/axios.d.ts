import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

declare module 'axios' {
	interface AxiosInstance {
		down: any;
	}
}

export default axios;
