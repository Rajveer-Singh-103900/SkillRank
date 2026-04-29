import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Search, Trophy, Loader2, AlertCircle, Sparkles, CheckCircle2, Trash2 } from 'lucide-react';
import axios from 'axios';

// Binary Search implementation
const binarySearchByName = (arr, targetName) => {
  let left = 0;
  let right = arr.length - 1;
  const target = targetName.toLowerCase();

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midName = arr[mid].filename.toLowerCase();
    
    if (midName.includes(target)) {
      return arr[mid];
    }
    
    if (midName < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return null;
};

// Max-Heap Implementation
class MaxHeap {
  constructor() {
    this.heap = [];
  }
  push(val) {
    this.heap.push(val);
    this.bubbleUp(this.heap.length - 1);
  }
  pop() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();
    const max = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.sinkDown(0);
    return max;
  }
  bubbleUp(idx) {
    const element = this.heap[idx];
    while (idx > 0) {
      let parentIdx = Math.floor((idx - 1) / 2);
      let parent = this.heap[parentIdx];
      if (element.score <= parent.score) break;
      this.heap[parentIdx] = element;
      this.heap[idx] = parent;
      idx = parentIdx;
    }
  }
  sinkDown(idx) {
    const length = this.heap.length;
    const element = this.heap[idx];
    while (true) {
      let leftChildIdx = 2 * idx + 1;
      let rightChildIdx = 2 * idx + 2;
      let leftChild, rightChild;
      let swap = null;
      if (leftChildIdx < length) {
        leftChild = this.heap[leftChildIdx];
        if (leftChild.score > element.score) swap = leftChildIdx;
      }
      if (rightChildIdx < length) {
        rightChild = this.heap[rightChildIdx];
        if ((swap === null && rightChild.score > element.score) || 
            (swap !== null && rightChild.score > leftChild.score)) {
          swap = rightChildIdx;
        }
      }
      if (swap === null) break;
      this.heap[idx] = this.heap[swap];
      this.heap[swap] = element;
      idx = swap;
    }
  }
}

export default function Dashboard() {
  const [jobDescription, setJobDescription] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedCandidate, setSearchedCandidate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await axios.get('/candidates');
        const dbCandidates = response.data;
        
        if (dbCandidates.length > 0) {
          const heap = new MaxHeap();
          dbCandidates.forEach(c => heap.push(c));
          
          const rankedCandidates = [];
          let rank = 1;
          while(heap.heap.length > 0) {
            const c = heap.pop();
            c.rank = rank++;
            rankedCandidates.push(c);
          }
          setCandidates(rankedCandidates);
        }
      } catch (err) {
        console.error('Could not fetch existing candidates', err);
      }
    };
    fetchCandidates();
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!jobDescription.trim()) {
      setError('Target job description is required prior to analysis.');
      return;
    }
    setError('');
    setIsProcessing(true);

    try {
      const results = [];
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('job_description', jobDescription);
        formData.append('file', file);

        try {
          const response = await axios.post('/rank-resumes', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          results.push(response.data);
        } catch (err) {
          console.error(`Error processing ${file.name}:`, err);
          
          // Extract detailed error from FastAPI if available
          let serverError = err.message;
          if (err.response && err.response.data) {
            if (typeof err.response.data === 'string') {
              serverError = err.response.data; // Handle plain text 500 errors
            } else if (err.response.data.detail) {
              // Handle JSON formatted FastAPI errors
              serverError = typeof err.response.data.detail === 'string' 
                ? err.response.data.detail 
                : JSON.stringify(err.response.data.detail);
            }
          }
          
          setError(prev => {
            const newError = `Failed to process ${file.name}: ${serverError}`;
            return prev ? `${prev} | ${newError}` : newError;
          });
        }
      }

      const heap = new MaxHeap();
      [...candidates, ...results].forEach(c => heap.push(c));
      
      const rankedCandidates = [];
      let rank = 1;
      while(heap.heap.length > 0) {
        const c = heap.pop();
        c.rank = rank++;
        rankedCandidates.push(c);
      }
      setCandidates(rankedCandidates);
    } catch (err) {
      setError('System encountered a failure during resume ingestion.');
    } finally {
      setIsProcessing(false);
    }
  }, [jobDescription, candidates]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] }
  });

  const sortedByName = useMemo(() => {
    return [...candidates].sort((a, b) => a.filename.localeCompare(b.filename));
  }, [candidates]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 1) {
      const found = binarySearchByName(sortedByName, query);
      setSearchedCandidate(found);
    } else {
      setSearchedCandidate(null);
    }
  };

  const handleClear = async () => {
    try {
      await axios.delete('/candidates');
      setCandidates([]);
      setSearchedCandidate(null);
      setSearchQuery('');
    } catch (err) {
      console.error('Could not clear candidates', err);
      setError('Failed to clear leaderboard.');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* Left Column - Input & Upload */}
      <div className="xl:col-span-4 space-y-6">
        
        {/* Job Description Card */}
        <div className="glass-panel rounded-2xl p-6 relative group transition-all duration-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] hover:border-indigo-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Target Profile
            </h2>
          </div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full h-32 bg-[#0A0B10] border border-white/5 rounded-xl p-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/30 resize-none transition-all shadow-inner"
            placeholder="Paste the job description or required skills here..."
          />
        </div>

        {/* Upload Zone */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              Ingestion Hub
            </h2>
          </div>
          
          <div 
            {...getRootProps()} 
            className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] bg-[#0A0B10]/50
              ${isDragActive ? 'border-indigo-400 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]' : 'border-white/10 hover:border-indigo-500/40 hover:bg-[#0A0B10]'}
              ${!jobDescription.trim() ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            {isProcessing ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-300 animate-pulse" />
                </div>
                <p className="text-indigo-300 text-sm font-medium tracking-wide">AI Engine Processing...</p>
              </motion.div>
            ) : (
              <>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors duration-300 ${isDragActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-gray-500 group-hover:bg-indigo-500/10 group-hover:text-indigo-400'}`}>
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-gray-200 font-medium mb-1 text-sm">
                  {isDragActive ? "Release to analyze" : "Drag & drop resumes"}
                </p>
                <p className="text-gray-500 text-xs">PDF format only</p>
              </>
            )}
          </div>
          {error && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </div>
      </div>

      {/* Right Column - Leaderboard */}
      <div className="xl:col-span-8">
        <div className="glass-panel rounded-2xl p-6 min-h-[600px] flex flex-col relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-white/5 pb-6">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-indigo-400" />
                Candidate Leaderboard
              </h2>
              <p className="text-gray-500 text-sm mt-1">Sorted via Max-Heap algorithms</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Binary search by name..."
                  className="w-full bg-[#0A0B10] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                />
              </div>
              <button 
                onClick={handleClear}
                disabled={candidates.length === 0}
                className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative"
                title="Clear Leaderboard"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="grid grid-cols-12 gap-4 px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-2">Rank</div>
              <div className="col-span-6">Candidate Profile</div>
              <div className="col-span-4 text-right">Match Score</div>
            </div>

            <div className="flex-1 overflow-y-auto mt-2 space-y-3 pr-2 custom-scrollbar pb-4">
              <AnimatePresence mode="popLayout">
                {candidates.length === 0 && !isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="flex flex-col items-center justify-center h-full text-gray-500 mt-24"
                  >
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                      <Trophy className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-gray-400 font-medium">No candidates in database</p>
                    <p className="text-sm text-gray-600 mt-1">Upload resumes to generate rankings</p>
                  </motion.div>
                )}

                {isProcessing && candidates.length === 0 && (
                  [1, 2, 3].map(i => (
                    <motion.div 
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-20 bg-[#0A0B10]/50 border border-white/5 rounded-xl animate-pulse"
                    />
                  ))
                )}

                {candidates.map((candidate) => {
                  const isHighlighted = searchedCandidate && searchedCandidate.filename === candidate.filename;
                  
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      key={candidate.filename}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 items-center rounded-xl transition-all duration-300 cursor-default
                        ${isHighlighted 
                          ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                          : 'bg-[#0A0B10]/60 hover:bg-[#0A0B10] border-white/5 hover:border-white/10'} border`}
                    >
                      <div className="col-span-2 flex items-center">
                        {candidate.rank === 1 ? (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 p-[1px] shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                            <div className="w-full h-full bg-[#11131A] rounded-full flex items-center justify-center font-bold text-yellow-500 text-sm">#1</div>
                          </div>
                        ) : candidate.rank === 2 ? (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 p-[1px]">
                            <div className="w-full h-full bg-[#11131A] rounded-full flex items-center justify-center font-bold text-gray-300 text-sm">#2</div>
                          </div>
                        ) : candidate.rank === 3 ? (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-300 to-orange-700 p-[1px]">
                            <div className="w-full h-full bg-[#11131A] rounded-full flex items-center justify-center font-bold text-orange-400 text-sm">#3</div>
                          </div>
                        ) : (
                          <span className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-gray-500 text-sm bg-white/5 border border-white/5">
                            #{candidate.rank}
                          </span>
                        )}
                      </div>
                      
                      <div className="col-span-6 flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="truncate font-medium text-gray-200 text-sm">
                            {candidate.filename.replace('.pdf', '')}
                          </span>
                          <span className="text-xs text-gray-500">
                            Processed Identity
                          </span>
                        </div>
                      </div>
                      
                      <div className="col-span-4 text-right flex items-center justify-end gap-4">
                        <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden hidden md:block">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${candidate.score}%` }}
                            transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              candidate.score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                              candidate.score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                              'bg-gradient-to-r from-rose-500 to-rose-400'
                            }`}
                          />
                        </div>
                        <span className={`font-bold tracking-wide w-12 text-right ${
                          candidate.score >= 80 ? 'text-emerald-400' :
                          candidate.score >= 60 ? 'text-yellow-400' :
                          'text-rose-400'
                        }`}>
                          {candidate.score}%
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
