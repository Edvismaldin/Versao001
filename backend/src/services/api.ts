import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://192.168.188.136:3001',
  timeout: 30000,
});
