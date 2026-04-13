import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppState {
  rawData: any[] | null;
  cleanedData: any[] | null;
  columns: string[];
  currentModel: {
    id: string;
    status: 'idle' | 'training' | 'ready';
    trainLoss?: number;
  } | null;
  trainingProgress: {
    epoch: number;
    totalEpochs: number;
    loss: number;
  } | null;
}

interface AppContextType extends AppState {
  setRawData: (data: any[] | null) => void;
  setCleanedData: (data: any[] | null) => void;
  setColumns: (columns: string[]) => void;
  setCurrentModel: (model: AppState['currentModel']) => void;
  setTrainingProgress: (progress: AppState['trainingProgress']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [rawData, setRawData] = useState<any[] | null>(null);
  const [cleanedData, setCleanedData] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState<AppState['currentModel']>(null);
  const [trainingProgress, setTrainingProgress] = useState<AppState['trainingProgress']>(null);

  return (
    <AppContext.Provider
      value={{
        rawData,
        cleanedData,
        columns,
        currentModel,
        trainingProgress,
        setRawData,
        setCleanedData,
        setColumns,
        setCurrentModel,
        setTrainingProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
