import React, { useState, useEffect, useCallback } from 'react';
import type { JsonData, ComparisonResult, ResolvedConflicts, Utterance, Conflict, InclusionState } from './types';
import FileUploader from './components/FileUploader';
import ComparisonResultDisplay from './components/ComparisonResultDisplay';

/**
 * Compares two utterance objects, ignoring the 'flows', 'id', and 'parent' properties.
 * @param u1 The first utterance.
 * @param u2 The second utterance.
 * @returns True if the utterances are considered equal, false otherwise.
 */
const areUtterancesEqual = (u1: Utterance, u2: Utterance): boolean => {
    // Create copies to avoid modifying the original objects
    const u1Copy = { ...u1 };
    const u2Copy = { ...u2 };

    // Ignore specified properties during comparison.
    delete (u1Copy as { flows?: any }).flows;
    delete (u2Copy as { flows?: any }).flows;
    delete (u1Copy as { id?: any }).id;
    delete (u2Copy as { id?: any }).id;
    delete (u1Copy as { parent?: any }).parent;
    delete (u2Copy as { parent?: any }).parent;


    // A simple way to deep compare objects. This is prone to key order issues,
    // but is often sufficient for comparing parsed JSON. A more robust deep-equal
    // library could be used here for more complex scenarios.
    return JSON.stringify(u1Copy) === JSON.stringify(u2Copy);
};


function App() {
  const [file1Data, setFile1Data] = useState<JsonData | null>(null);
  const [file2Data, setFile2Data] = useState<JsonData | null>(null);
  const [file1Name, setFile1Name] = useState<string>('');
  const [file2Name, setFile2Name] = useState<string>('');

  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [resolvedConflicts, setResolvedConflicts] = useState<ResolvedConflicts>({});
  const [inclusionState, setInclusionState] = useState<InclusionState>({});

  const [error, setError] = useState<string>('');

  const handleFileChange = (file: File | null, setFileData: React.Dispatch<React.SetStateAction<JsonData | null>>, setFileName: React.Dispatch<React.SetStateAction<string>>) => {
    setError('');
    if (!file) {
      setFileData(null);
      setFileName('');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("Failed to read file content.");
        }
        const data = JSON.parse(text) as JsonData;
        if (!data.utterances || !Array.isArray(data.utterances)) {
          throw new Error("Invalid JSON format. 'utterances' array not found.");
        }
        setFileData(data);
      } catch (err) {
        if (err instanceof Error) {
            setError(`Error parsing ${file.name}: ${err.message}`);
        } else {
            setError(`An unknown error occurred while parsing ${file.name}.`);
        }
        setFileData(null);
      }
    };
    reader.onerror = () => {
        setError(`Failed to read file: ${file.name}`);
    }
    reader.readAsText(file);
  };

  useEffect(() => {
    if (!file1Data || !file2Data) {
      setComparisonResult(null);
      return;
    }

    const map1 = new Map(file1Data.utterances.map(u => [u.condition, u]));
    const map2 = new Map(file2Data.utterances.map(u => [u.condition, u]));

    const file1Only: Utterance[] = [];
    const file2Only: Utterance[] = [];
    const conflicts: Conflict[] = [];
    const identical: Utterance[] = [];
    const initialResolutions: ResolvedConflicts = {};
    const initialInclusions: InclusionState = {};

    for (const [condition, utterance1] of map1.entries()) {
      const utterance2 = map2.get(condition);
      if (!utterance2) {
        file1Only.push(utterance1);
      } else {
        if (!areUtterancesEqual(utterance1, utterance2)) {
          conflicts.push({ condition, version1: utterance1, version2: utterance2 });
          // No default resolution, user must choose.
        } else {
          identical.push(utterance1);
        }
      }
    }

    for (const [condition, utterance2] of map2.entries()) {
      if (!map1.has(condition)) {
        file2Only.push(utterance2);
      }
    }
    
    // Sort for consistent display
    conflicts.sort((a, b) => a.condition.localeCompare(b.condition));
    file1Only.sort((a, b) => a.condition.localeCompare(b.condition));
    file2Only.sort((a, b) => a.condition.localeCompare(b.condition));
    identical.sort((a, b) => a.condition.localeCompare(b.condition));
    
    // By default, all non-conflict utterances are included
    [...file1Only, ...file2Only, ...identical].forEach(u => {
        initialInclusions[u.condition] = true;
    });

    setComparisonResult({ file1Only, file2Only, conflicts, identical });
    setResolvedConflicts(initialResolutions);
    setInclusionState(initialInclusions);
  }, [file1Data, file2Data]);
  
  const handleResolveConflict = useCallback((condition: string, version: 'version1' | 'version2') => {
    setResolvedConflicts(prev => ({ ...prev, [condition]: version }));
  }, []);

  const handleInclusionToggle = useCallback((condition: string) => {
    setInclusionState(prev => ({ ...prev, [condition]: !prev[condition] }));
  }, []);

  const handleResolveAllConflicts = useCallback((version: 'version1' | 'version2') => {
    if (!comparisonResult) return;
    const newResolutions: ResolvedConflicts = { ...resolvedConflicts };
    comparisonResult.conflicts.forEach(conflict => {
        newResolutions[conflict.condition] = version;
    });
    setResolvedConflicts(newResolutions);
  }, [comparisonResult, resolvedConflicts]);

  const handleToggleAllInclusion = useCallback((conditions: string[]) => {
      if (conditions.length === 0) return;
      const allCurrentlyIncluded = conditions.every(condition => inclusionState[condition]);
      
      setInclusionState(prev => {
          const newState = { ...prev };
          conditions.forEach(condition => {
              newState[condition] = !allCurrentlyIncluded;
          });
          return newState;
      });
  }, [inclusionState]);


  const generateFinalJson = () => {
    if (!file1Data || !file2Data || !comparisonResult) return;

    const finalUtterancesMap = new Map<string, Utterance>();

    // Add identical items if included
    comparisonResult.identical.forEach(u => {
      if (inclusionState[u.condition]) {
        finalUtterancesMap.set(u.condition, u);
      }
    });

    // Add unique from file 1 if included
    comparisonResult.file1Only.forEach(u => {
      if (inclusionState[u.condition]) {
        finalUtterancesMap.set(u.condition, u);
      }
    });

    // Add unique from file 2 if included
    comparisonResult.file2Only.forEach(u => {
      if (inclusionState[u.condition]) {
        finalUtterancesMap.set(u.condition, u);
      }
    });

    // Add resolved conflicts (always included)
    comparisonResult.conflicts.forEach(conflict => {
        const chosenVersion = resolvedConflicts[conflict.condition];
        if (chosenVersion === 'version1') {
            finalUtterancesMap.set(conflict.condition, conflict.version1);
        } else if (chosenVersion === 'version2') {
            finalUtterancesMap.set(conflict.condition, conflict.version2);
        }
    });

    const finalUtterances = Array.from(finalUtterancesMap.values()).sort((a, b) => a.condition.localeCompare(b.condition));
    
    // Simple merge of trains, can be improved based on requirements
    const combinedTrains = [...(file1Data.trains || []), ...(file2Data.trains || [])];
    const uniqueTrains = Array.from(new Set(combinedTrains.map(t => JSON.stringify(t)))).map(t => JSON.parse(t));

    const finalObject = {
        utterances: finalUtterances,
        trains: uniqueTrains,
    };

    const finalJsonString = JSON.stringify(finalObject, null, 2);
    const blob = new Blob([finalJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged-utterances.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-brand-primary">JSON Utterance Comparator</h1>
          <p className="mt-2 text-lg text-slate-400">Importe dois arquivos JSON para comparar e mesclar.</p>
        </header>
        
        {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FileUploader
            id="file1"
            label="Arquivo JSON 1"
            fileName={file1Name}
            onChange={(e) => handleFileChange(e.target.files?.[0] || null, setFile1Data, setFile1Name)}
          />
          <FileUploader
            id="file2"
            label="Arquivo JSON 2"
            fileName={file2Name}
            onChange={(e) => handleFileChange(e.target.files?.[0] || null, setFile2Data, setFile2Name)}
          />
        </div>
        
        {comparisonResult && (
            <>
                <ComparisonResultDisplay
                    results={comparisonResult}
                    file1Name={file1Name}
                    file2Name={file2Name}
                    resolvedConflicts={resolvedConflicts}
                    onResolveConflict={handleResolveConflict}
                    inclusionState={inclusionState}
                    onInclusionToggle={handleInclusionToggle}
                    onResolveAllConflicts={handleResolveAllConflicts}
                    onToggleAllInclusion={handleToggleAllInclusion}
                />
                <div className="mt-8 text-center">
                    <button
                        onClick={generateFinalJson}
                        className="bg-brand-primary hover:bg-teal-500 disabled:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={comparisonResult.conflicts.length > 0 && Object.keys(resolvedConflicts).length !== comparisonResult.conflicts.length}
                    >
                        Download JSON Final
                    </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
}

export default App;