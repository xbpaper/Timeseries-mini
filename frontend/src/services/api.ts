import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const uploadCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const cleanData = async (params: {
  missing_strategy: string;
  outlier_method: string;
  resample_freq?: string;
  selected_columns?: string[];
}) => {
  const response = await axios.post(`${API_BASE_URL}/clean`, params);
  return response.data;
};

export const trainModel = async (params: {
  target_column: string;
  lookback: number;
  forecast_steps: number;
  epochs: number;
  learning_rate: number;
}) => {
  const response = await axios.post(`${API_BASE_URL}/train`, params);
  return response.data;
};

export const finetuneModel = async (params: {
  model_id: string;
  new_data: any[];
  epochs: number;
}) => {
  const response = await axios.post(`${API_BASE_URL}/finetune`, params);
  return response.data;
};

export const predict = async (params: {
  model_id: string;
  input_data: number[][];
}) => {
  const response = await axios.post(`${API_BASE_URL}/predict`, params);
  return response.data;
};

export const getColumns = async () => {
  const response = await axios.get(`${API_BASE_URL}/columns`);
  return response.data;
};

export const getModels = async () => {
  const response = await axios.get(`${API_BASE_URL}/models`);
  return response.data;
};

export const getAgentInfo = async (modelId: string) => {
  const response = await axios.get(`${API_BASE_URL}/agent/${modelId}`);
  return response.data;
};

export const getModelFit = async (modelId: string) => {
  const response = await axios.get(`${API_BASE_URL}/model/${modelId}/fit`);
  return response.data;
};

export const numericData = async () => {
  const response = await axios.post(`${API_BASE_URL}/numeric`);
  return response.data;
};
