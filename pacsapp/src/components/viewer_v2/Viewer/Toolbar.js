// // /home/medical_system/pacsapp/src/components/viewer_v2/Viewer/Toolbar.js

// import React from 'react';
// import { 
//   Contrast, ZoomIn, Move, Ruler, Square, Circle, RotateCw, 
//   FlipHorizontal, Eye, RotateCcw, Download, ChevronLeft 
// } from 'lucide-react';
// import './Viewer.css';

// const Toolbar = ({ selectedTool, setSelectedTool, showLeftPanel, setShowLeftPanel }) => {
//   const tools = [
//     { id: 'wwwc', icon: Contrast, label: 'Window/Level' },
//     { id: 'zoom', icon: ZoomIn, label: 'Zoom' },
//     { id: 'pan', icon: Move, label: 'Pan' },
//     { id: 'length', icon: Ruler, label: 'Length' },
//     { id: 'rectangle', icon: Square, label: 'Rectangle ROI' },
//     { id: 'circle', icon: Circle, label: 'Circle ROI' },
//     { id: 'rotate', icon: RotateCw, label: 'Rotate' },
//     { id: 'flip', icon: FlipHorizontal, label: 'Flip' },
//     { id: 'invert', icon: Eye, label: 'Invert' },
//     { id: 'reset', icon: RotateCcw, label: 'Reset' },
//     { id: 'load-results', icon: Download, label: 'Load AI Results' }
//   ];

//   return (
//     <div className="mv-toolbar">
//       <div className="mv-toolbar-tools">
//         {tools.map((tool) => {
//           const Icon = tool.icon;
//           return (
//             <button
//               key={tool.id}
//               onClick={() => setSelectedTool(tool.id)}
//               className={`mv-tool-btn ${selectedTool === tool.id ? 'mv-active' : ''}`}
//               title={tool.label}
//             >
//               <Icon size={20} />
//             </button>
//           );
//         })}
//       </div>

//       <button
//         onClick={() => setShowLeftPanel(!showLeftPanel)}
//         className="mv-panel-toggle"
//       >
//         <ChevronLeft size={16} />
//       </button>
//     </div>
//   );
// };

// export default Toolbar;

// Toolbar.js - CSS import 추가
import React from 'react';
import { 
  Contrast, ZoomIn, Move, Ruler, Square, Circle, RotateCw, 
  FlipHorizontal, Eye, RotateCcw, Download, ChevronLeft 
} from 'lucide-react';
import './Toolbar.css'; // 🔥 개별 CSS import

const Toolbar = ({ selectedTool, setSelectedTool, showLeftPanel, setShowLeftPanel }) => {
  const tools = [
    { id: 'wwwc', icon: Contrast, label: 'Window/Level' },
    { id: 'zoom', icon: ZoomIn, label: 'Zoom' },
    { id: 'pan', icon: Move, label: 'Pan' },
    { id: 'length', icon: Ruler, label: 'Length' },
    { id: 'rectangle', icon: Square, label: 'Rectangle ROI' },
    { id: 'circle', icon: Circle, label: 'Circle ROI' },
    { id: 'rotate', icon: RotateCw, label: 'Rotate' },
    { id: 'flip', icon: FlipHorizontal, label: 'Flip' },
    { id: 'invert', icon: Eye, label: 'Invert' },
    { id: 'reset', icon: RotateCcw, label: 'Reset' },
    { id: 'load-results', icon: Download, label: 'Load AI Results' }
  ];

  return (
    <div className="mv-toolbar">
      <div className="mv-toolbar-tools">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`mv-tool-btn ${selectedTool === tool.id ? 'mv-active' : ''}`}
              title={tool.label}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setShowLeftPanel(!showLeftPanel)}
        className="mv-panel-toggle"
      >
        <ChevronLeft size={16} />
      </button>
    </div>
  );
};

export default Toolbar;