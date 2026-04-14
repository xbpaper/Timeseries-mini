import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { finetuneModel, getModels, getAgentInfo, getModelFit, deleteModel } from '../services/api';
import { useAppContext } from '../context/AppContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const FinetunePage: React.FC = () => {
  const { currentModel } = useAppContext();
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [epochs, setEpochs] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [fitData, setFitData] = useState<any>(null);
  const [loadingFit, setLoadingFit] = useState(false);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    loadModels();
    if (currentModel?.id) {
      setSelectedModel(currentModel.id);
    }
  }, [currentModel]);

  const loadModels = async () => {
    try {
      const result = await getModels();
      // 按创建时间排序，只显示最新的10个模型
      const sortedModels = result.models.sort((a: any, b: any) => b.created - a.created).slice(0, 10);
      setModels(sortedModels);
    } catch (err) {
      console.error('加载模型列表失败', err);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (window.confirm('确定要删除这个模型吗？')) {
      try {
        await deleteModel(modelId);
        loadModels();
        if (selectedModel === modelId) {
          setSelectedModel('');
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || '删除模型失败');
      }
    }
  };

  const handleFinetune = async () => {
    if (!selectedModel) {
      setError('请选择模型');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await finetuneModel({
        model_id: selectedModel,
        new_data: [],
        epochs,
      });

      setSuccess(true);
      loadModels();
      await handleGetFitData();
    } catch (err: any) {
      setError(err.response?.data?.detail || '微调失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGetFitData = async () => {
    if (!selectedModel) {
      return;
    }

    setLoadingFit(true);
    try {
      const data = await getModelFit(selectedModel);
      setFitData(data);
    } catch (err: any) {
      console.error('获取拟合数据失败', err);
    } finally {
      setLoadingFit(false);
    }
  };

  const handleDownloadChart = () => {
    // 查找拟合图的canvas元素
    const cardContent = document.querySelector('.css-46bh2p-MuiCardContent-root');
    if (cardContent) {
      const canvas = cardContent.querySelector('canvas');
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `fit_comparison_${fitData?.target_column || 'unknown'}.png`;
        link.href = url;
        link.click();
      }
    }
  };

  const handleGenerateAgent = async () => {
    if (!selectedModel) {
      setError('请选择模型');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const info = await getAgentInfo(selectedModel);
      setAgentInfo(info);
    } catch (err: any) {
      setError(err.response?.data?.detail || '生成智能体失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        模型微调与智能体生成
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>选择模型</InputLabel>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                label="选择模型"
              >
                {models.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>{model.id}</span>
                      <Button
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModel(model.id);
                        }}
                      >
                        删除
                      </Button>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mb: 3 }}>
            <TextField
              label="微调轮数"
              type="number"
              value={epochs}
              onChange={(e) => setEpochs(parseInt(e.target.value))}
              sx={{ width: 150 }}
            />
          </Box>

          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleFinetune}
              disabled={loading || !selectedModel}
            >
              {loading ? <CircularProgress size={24} /> : '微调模型'}
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={handleGenerateAgent}
              disabled={loading || !selectedModel}
            >
              生成智能体
            </Button>

            <Button
              variant="contained"
              color="info"
              onClick={handleGetFitData}
              disabled={loadingFit || !selectedModel}
            >
              {loadingFit ? <CircularProgress size={24} /> : '数据拟合'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              微调完成！
            </Alert>
          )}

          {agentInfo && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                工业智能体信息
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Typography>
                    <strong>模型 ID:</strong> {agentInfo.model_id}
                  </Typography>
                  <Typography>
                    <strong>目标列:</strong> {agentInfo.target_column}
                  </Typography>
                  <Typography>
                    <strong>回看窗口:</strong> {agentInfo.lookback}
                  </Typography>
                  <Typography>
                    <strong>预测步数:</strong> {agentInfo.forecast_steps}
                  </Typography>
                  <Typography sx={{ mt: 2 }}>
                    <strong>API 端点:</strong>
                  </Typography>
                  <Chip
                    label={agentInfo.api_endpoint}
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                  <Typography sx={{ mt: 2 }}>
                    <strong>使用方法:</strong>
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      p: 2,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      overflow: 'auto',
                    }}
                  >
                    {JSON.stringify(agentInfo.usage, null, 2)}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {fitData && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  模型拟合效果
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleDownloadChart}
                >
                  下载图表
                </Button>
              </Box>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ height: 400 }}>
                    <Line
                      ref={chartRef}
                      data={{
                        labels: fitData.timestamps && fitData.timestamps.length > 0 ? fitData.timestamps : Array.from({ length: fitData.actual.length }, (_, i) => i + 1),
                        datasets: [
                          {
                            label: '实际值',
                            data: fitData.actual,
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.4,
                          },
                          {
                            label: '预测值',
                            data: fitData.predicted,
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          title: {
                            display: true,
                            text: `${fitData.target_column} 拟合对比`,
                          },
                          legend: {
                            position: 'top' as const,
                          },
                        },
                        scales: {
                          x: {
                            title: {
                              display: true,
                              text: '时间',
                            },
                          },
                          y: {
                            beginAtZero: false,
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {loadingFit && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={40} />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FinetunePage;
