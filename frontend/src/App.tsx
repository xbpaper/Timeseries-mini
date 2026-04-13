import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import UploadPage from './pages/UploadPage';
import CleanPage from './pages/CleanPage';
import TrainPage from './pages/TrainPage';
import FinetunePage from './pages/FinetunePage';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material';

const steps = ['上传数据', '数据清洗', '模型训练', '微调与推理'];

function App() {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <UploadPage onNext={handleNext} />;
      case 1:
        return <CleanPage onNext={handleNext} />;
      case 2:
        return <TrainPage onNext={handleNext} />;
      case 3:
        return <FinetunePage />;
      default:
        return <UploadPage onNext={handleNext} />;
    }
  };

  return (
    <AppProvider>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              时序模型 - 迷你版
            </Typography>
            <Button color="inherit">帮助</Button>
          </Toolbar>
        </AppBar>

        <Container sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          <Box sx={{ mb: 2 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              上一步
            </Button>
          </Box>

          {renderStep()}
        </Container>
      </Box>
    </AppProvider>
  );
}

export default App;
