import React, { useState } from 'react';
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
  Slider,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { trainModel } from '../services/api';
import { useAppContext } from '../context/AppContext';

interface TrainPageProps {
  onNext: () => void;
}

const TrainPage: React.FC<TrainPageProps> = ({ onNext }) => {
  const { columns, setCurrentModel } = useAppContext();
  const [targetColumn, setTargetColumn] = useState('');
  const [lookback, setLookback] = useState(24);
  const [forecastSteps, setForecastSteps] = useState(6);
  const [epochs, setEpochs] = useState(50);
  const [learningRate, setLearningRate] = useState(0.001);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleTrain = async () => {
    if (!targetColumn) {
      setError('请选择目标列');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await trainModel({
        target_column: targetColumn,
        lookback,
        forecast_steps: forecastSteps,
        epochs,
        learning_rate: learningRate,
      });

      setCurrentModel({
        id: result.model_id,
        status: 'ready',
        trainLoss: result.train_loss,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || '训练失败');
    } finally {
      setLoading(false);
    }
  };

  const numericColumns = columns.filter(col => 
    col !== 'timestamp' && col !== 'time' && col !== 'date'
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        模型训练
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>目标列（要预测的测点）</InputLabel>
              <Select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                label="目标列（要预测的测点）"
              >
                {numericColumns.map((col) => (
                  <MenuItem key={col} value={col}>
                    {col}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              回看窗口: {lookback} 小时
            </Typography>
            <Slider
              value={lookback}
              onChange={(_, value) => setLookback(value as number)}
              min={12}
              max={48}
              marks
              step={6}
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              预测步数: {forecastSteps} 小时
            </Typography>
            <Slider
              value={forecastSteps}
              onChange={(_, value) => setForecastSteps(value as number)}
              min={1}
              max={24}
              marks
              step={1}
              valueLabelDisplay="auto"
            />
          </Box>

          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <TextField
              label="训练轮数"
              type="number"
              value={epochs}
              onChange={(e) => setEpochs(parseInt(e.target.value))}
              sx={{ width: 150 }}
            />
            <TextField
              label="学习率"
              type="number"
              value={learningRate}
              onChange={(e) => setLearningRate(parseFloat(e.target.value))}
              sx={{ width: 150 }}
              inputProps={{ step: 0.0001 }}
            />
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleTrain}
            disabled={loading || !targetColumn}
          >
            {loading ? <CircularProgress size={24} /> : '开始训练'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              训练完成！模型已保存。
            </Alert>
          )}

          {success && (
            <Button
              variant="contained"
              color="success"
              onClick={onNext}
              sx={{ mt: 2, ml: 2 }}
            >
              下一步：模型微调
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TrainPage;
