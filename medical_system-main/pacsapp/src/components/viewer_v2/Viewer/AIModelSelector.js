// // /home/medical_system/pacsapp/src/components/viewer_v2/Viewer/AIModelSelector.js

// import React from 'react';
// import { ChevronLeft, ChevronRight } from 'lucide-react';
// import './Viewer.css';

// const AIModelSelector = ({ selectedAIModel, setSelectedAIModel, onRunModel }) => {
//   const aiModels = ['yolov8', 'ssd', 'simclr'];
//   const modelColors = {
//     yolov8: '#3b82f6',
//     ssd: '#ef4444', 
//     simclr: '#22c55e'
//   };

//   const handlePrevModel = () => {
//     const currentIndex = aiModels.indexOf(selectedAIModel);
//     const prevIndex = currentIndex > 0 ? currentIndex - 1 : aiModels.length - 1;
//     setSelectedAIModel(aiModels[prevIndex]);
//   };

//   const handleNextModel = () => {
//     const currentIndex = aiModels.indexOf(selectedAIModel);
//     const nextIndex = (currentIndex + 1) % aiModels.length;
//     setSelectedAIModel(aiModels[nextIndex]);
//   };

//   return (
//     <div className="mv-ai-model-selector">
//       <button
//         onClick={handlePrevModel}
//         className="mv-model-nav-btn"
//       >
//         <ChevronLeft size={16} />
//       </button>
      
//       <button
//         onClick={() => onRunModel(selectedAIModel)}
//         className="mv-model-run-btn"
//         style={{ backgroundColor: modelColors[selectedAIModel] }}
//         title={`${selectedAIModel} 모델 실행`}
//       >
//         {selectedAIModel.toUpperCase()}
//       </button>
      
//       <button
//         onClick={handleNextModel}
//         className="mv-model-nav-btn"
//       >
//         <ChevronRight size={16} />
//       </button>
//     </div>
//   );
// };

// export default AIModelSelector;

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './AIModelSelector.css'; // 🔥 개별 CSS import

const AIModelSelector = ({ selectedAIModel, setSelectedAIModel, onRunModel }) => {
  const aiModels = ['yolov8', 'ssd', 'simclr'];
  const modelColors = {
    yolov8: '#3b82f6',
    ssd: '#ef4444', 
    simclr: '#22c55e'
  };

  const handlePrevModel = () => {
    const currentIndex = aiModels.indexOf(selectedAIModel);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : aiModels.length - 1;
    setSelectedAIModel(aiModels[prevIndex]);
  };

  const handleNextModel = () => {
    const currentIndex = aiModels.indexOf(selectedAIModel);
    const nextIndex = (currentIndex + 1) % aiModels.length;
    setSelectedAIModel(aiModels[nextIndex]);
  };

  return (
    <div className="mv-ai-model-selector">
      <button
        onClick={handlePrevModel}
        className="mv-model-nav-btn"
      >
        <ChevronLeft size={16} />
      </button>
      
      <button
        onClick={() => onRunModel(selectedAIModel)}
        className={`mv-model-run-btn mv-${selectedAIModel}`}
        style={{ backgroundColor: modelColors[selectedAIModel] }}
        title={`${selectedAIModel} 모델 실행`}
      >
        {selectedAIModel.toUpperCase()}
      </button>
      
      <button
        onClick={handleNextModel}
        className="mv-model-nav-btn"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default AIModelSelector;