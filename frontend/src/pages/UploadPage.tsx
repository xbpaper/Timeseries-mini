import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { uploadCSV } from '../services/api';
import { useAppContext } from '../context/AppContext';

interface UploadPageProps {
  onNext: () => void;
}

const UploadPage: React.FC<UploadPageProps> = ({ onNext }) => {
  const { setRawData, setColumns } = useAppContext();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [rows, setRows] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('请选择文件');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await uploadCSV(file);
      setRawData(result.preview);
      setColumns(result.columns);
      setPreview(result.preview);
      setRows(result.rows);
    } catch (err: any) {
      setError(err.response?.data?.detail || '上传失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        数据上传
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="contained" component="span">
                选择 CSV 文件
              </Button>
            </label>
            {file && (
              <Typography sx={{ ml: 2, display: 'inline' }}>
                {file.name}
              </Typography>
            )}
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!file || loading}
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : '上传'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {preview.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                数据预览 (共 {rows} 行)
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
                    {preview.slice(0, 10).map((row, index) => (
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
                下一步：数据清洗
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UploadPage;
