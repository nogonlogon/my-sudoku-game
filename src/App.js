import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // 초기 스도쿠 퍼즐 (0은 빈 칸)
  const initialPuzzle = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  ];

  const solution = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
  ];

  const [board, setBoard] = useState(initialPuzzle.map(row => [...row]));
  const [selectedCell, setSelectedCell] = useState(null);
  const [conflicts, setConflicts] = useState(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [bestTime, setBestTime] = useState(() => {
    const saved = localStorage.getItem('sudoku-best-time');
    return saved ? parseInt(saved) : null;
  });

  // 시간 포맷팅 함수
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 타이머 업데이트
  useEffect(() => {
    let interval;
    if (!isPaused && !isComplete) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, isPaused, isComplete]);

  // 숫자가 유효한지 확인하는 함수
  const isValidMove = (board, row, col, num) => {
    // 행 검사
    for (let j = 0; j < 9; j++) {
      if (j !== col && board[row][j] === num) return false;
    }

    // 열 검사
    for (let i = 0; i < 9; i++) {
      if (i !== row && board[i][col] === num) return false;
    }

    // 3x3 박스 검사
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        if ((i !== row || j !== col) && board[i][j] === num) return false;
      }
    }

    return true;
  };

  // 충돌 찾기
  const findConflicts = (board) => {
    const conflicts = new Set();
    
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] !== 0 && !isValidMove(board, i, j, board[i][j])) {
          conflicts.add(`${i}-${j}`);
        }
      }
    }
    
    return conflicts;
  };

  // 게임 완료 확인
  const checkCompletion = (board) => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) return false;
      }
    }
    return findConflicts(board).size === 0;
  };

  // 셀 클릭 핸들러
  const handleCellClick = (row, col) => {
    if (initialPuzzle[row][col] === 0 && !isPaused) {
      setSelectedCell([row, col]);
    }
  };

  // 숫자 입력 핸들러
  const handleNumberInput = (num) => {
    if (!selectedCell || isPaused) return;
    
    const [row, col] = selectedCell;
    if (initialPuzzle[row][col] !== 0) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = num;
    
    setBoard(newBoard);
    setConflicts(findConflicts(newBoard));
    
    if (checkCompletion(newBoard)) {
      setIsComplete(true);
      const finalTime = elapsedTime;
      if (!bestTime || finalTime < bestTime) {
        setBestTime(finalTime);
        localStorage.setItem('sudoku-best-time', finalTime.toString());
      }
    }
  };

  // 지우기
  const handleClear = () => {
    if (!selectedCell || isPaused) return;
    
    const [row, col] = selectedCell;
    if (initialPuzzle[row][col] !== 0) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = 0;
    
    setBoard(newBoard);
    setConflicts(findConflicts(newBoard));
    setIsComplete(false);
  };

  // 새 게임
  const handleNewGame = () => {
    setBoard(initialPuzzle.map(row => [...row]));
    setSelectedCell(null);
    setConflicts(new Set());
    setIsComplete(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setIsPaused(false);
  };

  // 일시정지/재시작
  const handlePause = () => {
    if (isPaused) {
      setStartTime(Date.now() - elapsedTime * 1000);
      setIsPaused(false);
    } else {
      setIsPaused(true);
    }
  };

  // 힌트 (정답 보기)
  const handleHint = () => {
    if (!selectedCell || isPaused) return;
    
    const [row, col] = selectedCell;
    if (initialPuzzle[row][col] !== 0) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = solution[row][col];
    
    setBoard(newBoard);
    setConflicts(findConflicts(newBoard));
    
    if (checkCompletion(newBoard)) {
      setIsComplete(true);
      const finalTime = elapsedTime;
      if (!bestTime || finalTime < bestTime) {
        setBestTime(finalTime);
        localStorage.setItem('sudoku-best-time', finalTime.toString());
      }
    }
  };

  // 키보드 입력 처리
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!selectedCell || isPaused) return;
      
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        handleNumberInput(num);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleClear();
      } else if (e.key === ' ') {
        e.preventDefault();
        handlePause();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedCell, board, isPaused]);

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">🧩 스도쿠 게임</h1>
      
      {/* 타이머와 최고 기록 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex items-center justify-between min-w-80">
        <div className="text-center">
          <p className="text-sm text-gray-600">현재 시간</p>
          <p className="text-2xl font-mono font-bold text-blue-600">
            {formatTime(elapsedTime)}
          </p>
        </div>
        
        <button
          onClick={handlePause}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            isPaused 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-yellow-500 text-white hover:bg-yellow-600'
          }`}
          disabled={isComplete}
        >
          {isPaused ? '▶️ 재시작' : '⏸️ 일시정지'}
        </button>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">최고 기록</p>
          <p className="text-xl font-mono font-bold text-green-600">
            {bestTime ? formatTime(bestTime) : '--:--'}
          </p>
        </div>
      </div>

      {isComplete && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded mb-4 text-center">
          <p className="text-lg font-semibold">🎉 축하합니다! 퍼즐을 완성했습니다!</p>
          <p className="text-sm mt-1">완료 시간: {formatTime(elapsedTime)}</p>
          {bestTime === elapsedTime && (
            <p className="text-sm mt-1 font-bold text-green-800">🏆 새로운 최고 기록!</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-4 mb-6 relative">
        {/* 일시정지 오버레이 */}
        {isPaused && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center rounded-lg z-10">
            <div className="text-center text-white">
              <p className="text-2xl mb-2">⏸️</p>
              <p className="text-lg font-semibold">게임이 일시정지되었습니다</p>
              <button
                onClick={handlePause}
                className="mt-4 px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                계속하기
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-9 gap-1 mb-4">
          {board.map((row, i) => 
            row.map((cell, j) => {
              const isInitial = initialPuzzle[i][j] !== 0;
              const isSelected = selectedCell && selectedCell[0] === i && selectedCell[1] === j;
              const hasConflict = conflicts.has(`${i}-${j}`);
              const isInSameBox = selectedCell && 
                Math.floor(i / 3) === Math.floor(selectedCell[0] / 3) && 
                Math.floor(j / 3) === Math.floor(selectedCell[1] / 3);
              const isInSameRowCol = selectedCell && (i === selectedCell[0] || j === selectedCell[1]);

              return (
                <button
                  key={`${i}-${j}`}
                  onClick={() => handleCellClick(i, j)}
                  className={`
                    w-12 h-12 text-lg font-semibold border-2 transition-all
                    ${isInitial ? 'bg-gray-100 text-gray-900' : 'bg-white text-blue-600'}
                    ${isSelected ? 'bg-blue-200 border-blue-500' : 'border-gray-300'}
                    ${hasConflict ? 'bg-red-100 text-red-600' : ''}
                    ${isInSameBox && !isSelected ? 'bg-blue-50' : ''}
                    ${isInSameRowCol && !isSelected ? 'bg-yellow-50' : ''}
                    ${(i + 1) % 3 === 0 && i !== 8 ? 'border-b-4 border-b-gray-600' : ''}
                    ${(j + 1) % 3 === 0 && j !== 8 ? 'border-r-4 border-r-gray-600' : ''}
                    hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300
                    disabled:cursor-not-allowed
                  `}
                  disabled={isPaused}
                >
                  {cell === 0 ? '' : cell}
                </button>
              );
            })
          )}
        </div>

        {/* 숫자 입력 버튼 */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedCell || isPaused}
            >
              {num}
            </button>
          ))}
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedCell || isPaused}
          >
            🗑️ 지우기
          </button>
          <button
            onClick={handleHint}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedCell || isPaused}
          >
            💡 힌트
          </button>
          <button
            onClick={handlePause}
            className={`px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 ${
              isPaused 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
            disabled={isComplete}
          >
            {isPaused ? '▶️ 재시작' : '⏸️ 일시정지'}
          </button>
          <button
            onClick={handleNewGame}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            🔄 새 게임
          </button>
        </div>
      </div>

      <div className="text-center text-gray-600 max-w-md">
        <p className="mb-2">🎯 <strong>게임 방법:</strong></p>
        <p>• 빈 칸을 클릭하고 1-9 숫자를 입력하세요</p>
        <p>• 각 행, 열, 3×3 박스에 1-9가 한 번씩만 나와야 합니다</p>
        <p>• 키보드 숫자키나 Delete/Backspace로도 조작할 수 있습니다</p>
        <p>• 스페이스바로 일시정지할 수 있습니다</p>
      </div>
    </div>
  );
}

export default App;