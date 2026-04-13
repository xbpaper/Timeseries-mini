import React, { useState } from 'react';
import { SelectChangeEvent } from '@mui/material/Select';
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
  Checkbox,
  ListItemText,
  OutlinedInput,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { cleanData } from '../services/api';
import { useAppContext } from '../context/AppContext';

interface CleanPageProps {
  onNext: () => void;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const CleanPage: React.FC<CleanPageProps> = ({ onNext }) => {
  const { columns, setCleanedData } = useAppContext();
  const [missingStrategy, setMissingStrategy] = useState('ffill');
  const [outlierMethod, setOutlierMethod] = useState('3sigma');
  const [resampleFreq, setResampleFreq] = useState('none');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleanedRows, setCleanedRows] = useState(0);
  const [preview, setPreview] = useState<any[]>([]);

  const handleColumnChange = (event: SelectChangeEvent<string[]>, value: string[]) => {
    setSelectedColumns(value);
  };

  const handleClean = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        missing_strategy: missingStrategy,
        outlier_method: outlierMethod,
      };

      if (resampleFreq !== 'none') {
        params.resample_freq = resampleFreq;
      }

      if (selectedColumns.length > 0) {
        params.selected_columns = selectedColumns;
      }

      const result = await cleanData(params);
      setCleanedData(result.data);
      setCleanedRows(result.cleaned_rows);
      setPreview(result.data.slice(0, 10));
    } catch (err: any) {
      setError(err.response?.data?.detail || '清洗失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        数据清洗
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>缺失值处理</InputLabel>
              <Select
                value={missingStrategy}
                onChange={(e) => setMissingStrategy(e.target.value)}
                label="缺失值处理"
              >
                <MenuItem value="ffill">前向填充</MenuItem>
                <MenuItem value="mean">均值填充</MenuItem>
                <MenuItem value="drop">删除缺失值</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>异常值处理</InputLabel>
              <Select
                value={outlierMethod}
                onChange={(e) => setOutlierMethod(e.target.value)}
                label="异常值处理"
              >
                <MenuItem value="3sigma">3σ 原则</MenuItem>
                <MenuItem value="iqr">IQR 方法</MenuItem>
                <MenuItem value="none">不处理</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>重采样</InputLabel>
              <Select
                value={resampleFreq}
                onChange={(e) => setResampleFreq(e.target.value)}
                label="重采样"
              >
                <MenuItem value="none">不重采样</MenuItem>
                <MenuItem value="1min">1 分钟</MenuItem>
                <MenuItem value="5min">5 分钟</MenuItem>
                <MenuItem value="1h">1 小时</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <FormControl sx={{ width: '100%', mb: 3 }}>
            <InputLabel>选择列（可选）</InputLabel>
            <Select
              multiple
              value={selectedColumns}
              onChange={handleColumnChange}
              input={<OutlinedInput label="选择列（可选）" />}
              renderValue={(selected) => (selected as string[]).join(', ')}
              MenuProps={MenuProps}
            >
              {columns.map((col) => (
                <MenuItem key={col} value={col}>
                  <Checkbox checked={selectedColumns.indexOf(col) > -1} />
                  <ListItemText primary={col} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            onClick={handleClean}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '应用清洗'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {preview.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                清洗后数据 (共 {cleanedRows} 行)
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {Object.keys(preview[0]).map((key) => (
                        <TableCell key={key}>{key}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).map((value, i) => (
                          <TableCell key={i}>
                            {String(value).substring(0, 20)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Button
                variant="contained"
                color="success"
                onClick={onNext}
                sx={{ mt: 2 }}
              >
                下一步：模型训练
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CleanPage;
