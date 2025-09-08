import React, { useState } from 'react';
import type { ComparisonResult, ResolvedConflicts, InclusionState } from '../types';
import { diffLines } from 'diff';

interface ComparisonResultDisplayProps {
  results: ComparisonResult;
  file1Name: string;
  file2Name: string;
  resolvedConflicts: ResolvedConflicts;
  onResolveConflict: (condition: string, version: 'version1' | 'version2') => void;
  inclusionState: InclusionState;
  onInclusionToggle: (condition:string) => void;
  onResolveAllConflicts: (version: 'version1' | 'version2') => void;
  onToggleAllInclusion: (conditions: string[]) => void;
}

const UtteranceCard: React.FC<{ 
    utterance: any, 
    title: string, 
    idSuffix: string, 
    className?: string,
    isIncluded?: boolean,
    onInclusionToggle?: () => void,
}> = ({ utterance, title, idSuffix, className, isIncluded, onInclusionToggle }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    // Sanitize suffix to be a valid ID
    const uniqueId = `utterance-content-${idSuffix.replace(/[^a-zA-Z0-9-_]/g, '')}`;

    // Safely process flows which could be strings or objects like {id, name}
    const displayFlows = utterance.flows?.map((flow: any, index: number) => {
        if (typeof flow === 'string') {
            return { key: flow, name: flow };
        }
        if (typeof flow === 'object' && flow !== null && typeof flow.name === 'string') {
            // Use id for key if available, otherwise name, finally index
            const key = flow.id || flow.name || index;
            return { key: key, name: flow.name };
        }
        return null; // Invalid flow format
    }).filter((flow: any): flow is { key: string | number; name: string } => {
        // Filter out nulls and __GENERAL flows
        return flow !== null && flow.name !== '__GENERAL';
    }) || [];

    return (
        <div className={`bg-slate-800 rounded-lg p-4 overflow-hidden ${className}`}>
            <div className="flex justify-between items-start border-b border-slate-700 pb-2 mb-2 gap-2">
                <div className="flex items-start gap-2 min-w-0">
                    {onInclusionToggle && (
                         <label className="flex items-center cursor-pointer flex-shrink-0 pt-1" title="Incluir no JSON final">
                            <input 
                                type="checkbox" 
                                checked={isIncluded} 
                                onChange={onInclusionToggle}
                                className="sr-only peer"
                            />
                            <div className="relative w-9 h-5 bg-slate-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
                            <span className="sr-only">Incluir no JSON final</span>
                        </label>
                    )}
                    <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-300 truncate" title={title}>{title}</h4>
                         {displayFlows.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {displayFlows.map((flow) => (
                                    <span key={flow.key} className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                                        {flow.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    className="flex-shrink-0 text-xs text-brand-primary hover:text-teal-300 whitespace-nowrap px-2 py-1 rounded hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    aria-expanded={isExpanded}
                    aria-controls={uniqueId}
                >
                    {isExpanded ? 'Esconder' : 'Mostrar'}
                </button>
            </div>
            {isExpanded && (
                <div className="pt-2">
                    <pre id={uniqueId} className="text-xs text-slate-300 bg-slate-900 p-3 rounded-md overflow-x-auto animate-fade-in">
                        {JSON.stringify(utterance, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

// --- New Diff Viewer ---

const LineByLineDiffViewer: React.FC<{ obj1: any; obj2: any }> = ({ obj1, obj2 }) => {
    // Ignore specified properties for a cleaner diff.
    const cleanObj1 = { ...obj1 };
    const cleanObj2 = { ...obj2 };
    delete (cleanObj1 as any).flows;
    delete (cleanObj2 as any).flows;
    delete (cleanObj1 as any).id;
    delete (cleanObj2 as any).id;
    delete (cleanObj1 as any).parent;
    delete (cleanObj2 as any).parent;

    const str1 = JSON.stringify(cleanObj1, null, 2);
    const str2 = JSON.stringify(cleanObj2, null, 2);

    const parts = diffLines(str1, str2);

    return (
        <pre className="text-xs font-mono">
            <code>
                {parts.map((part, partIndex) => {
                    const lines = part.value.split('\n');
                    // diffLines includes a final empty string if the part ends with a newline.
                    if (lines[lines.length - 1] === '') {
                        lines.pop();
                    }

                    return lines.map((line, lineIndex) => {
                        if (part.added) {
                            return (
                                <div key={`${partIndex}-${lineIndex}`} className="bg-green-900/30">
                                    <span className="text-green-400 select-none pl-2 pr-2">+</span>
                                    <span className="text-green-300">{line}</span>
                                </div>
                            );
                        }
                        if (part.removed) {
                            return (
                                <div key={`${partIndex}-${lineIndex}`} className="bg-red-900/30">
                                    <span className="text-red-400 select-none pl-2 pr-2">-</span>
                                    <span className="text-red-300">{line}</span>
                                </div>
                            );
                        }
                        return (
                             <div key={`${partIndex}-${lineIndex}`}>
                                <span className="text-slate-500 select-none pl-2 pr-2"> </span>
                                <span className="text-slate-400">{line}</span>
                            </div>
                        )
                    });
                })}
            </code>
        </pre>
    );
};


const ConflictCard: React.FC<{
  conflict: ComparisonResult['conflicts'][0];
  file1Name: string;
  file2Name: string;
  resolvedConflicts: ResolvedConflicts;
  onResolveConflict: (condition: string, version: 'version1' | 'version2') => void;
}> = ({ conflict, file1Name, file2Name, resolvedConflicts, onResolveConflict }) => {
    const [isDiffVisible, setIsDiffVisible] = useState(false);
    const selection = resolvedConflicts[conflict.condition];
    const isResolved = !!selection;
    const diffId = `diff-${conflict.condition.replace(/[^a-zA-Z0-9-_]/g, '')}`;

    return (
        <div className={`bg-slate-800/50 border rounded-lg p-4 mb-4 transition-colors ${
            isResolved ? 'border-slate-700' : 'border-yellow-500/60'
        }`}>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-brand-secondary">Conflito: <span className="font-mono text-yellow-300">{conflict.condition}</span></h3>
                <button
                    onClick={() => setIsDiffVisible(!isDiffVisible)}
                    className="text-xs text-brand-primary hover:text-teal-300 whitespace-nowrap px-2 py-1 rounded hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    aria-expanded={isDiffVisible}
                    aria-controls={diffId}
                >
                    {isDiffVisible ? 'Esconder Diferenças' : 'Mostrar Diferenças'}
                </button>
            </div>
            
            {isDiffVisible && (
                <div id={diffId} className="bg-slate-900 rounded-md p-4 mb-4 text-xs overflow-x-auto animate-fade-in">
                    <div className="flex items-center gap-2 text-sm mb-3 border-b border-slate-700 pb-2 font-bold">
                        <span className="text-red-400">- {file1Name}</span>
                        <span className="text-green-400">+ {file2Name}</span>
                    </div>
                    <LineByLineDiffViewer obj1={conflict.version1} obj2={conflict.version2} />
                </div>
            )}

            {!isResolved && (
                <div className="text-center text-yellow-400 text-sm mb-3 bg-yellow-900/30 p-2 rounded-md animate-fade-in">
                    Selecione a versão que deseja manter.
                </div>
            )}

             <div className="flex items-center justify-center gap-4 bg-slate-900/50 p-3 rounded-md">
                <span className="font-semibold text-slate-300">Manter versão de:</span>
                <button
                    onClick={() => onResolveConflict(conflict.condition, 'version1')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
                        selection === 'version1'
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                    {file1Name}
                </button>
                <button
                    onClick={() => onResolveConflict(conflict.condition, 'version2')}
                     className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
                        selection === 'version2'
                        ? 'bg-green-600 text-white ring-2 ring-green-400'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                    {file2Name}
                </button>
            </div>
        </div>
    );
};


const Section: React.FC<{ title: string; count: number; children: React.ReactNode; headerActions?: React.ReactNode }> = ({ title, count, children, headerActions }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="bg-slate-800 rounded-xl shadow-lg mb-6">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left p-4 flex justify-between items-center bg-slate-700/50 rounded-t-xl hover:bg-slate-700">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-200">{title}</h2>
                    <span className="bg-brand-primary text-white text-xs font-bold px-2 py-1 rounded-full">{count}</span>
                </div>
                <div className="flex items-center gap-4">
                    {headerActions}
                    <svg className={`w-6 h-6 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </button>
            {isOpen && <div className="p-4 md:p-6">{children}</div>}
        </div>
    );
};


const ComparisonResultDisplay: React.FC<ComparisonResultDisplayProps> = ({ 
    results, 
    file1Name, 
    file2Name, 
    resolvedConflicts, 
    onResolveConflict, 
    inclusionState, 
    onInclusionToggle,
    onResolveAllConflicts,
    onToggleAllInclusion,
}) => {
  return (
    <div className="mt-8">
        {results.conflicts.length > 0 && (
             <Section 
                title="Conflitos para Resolver" 
                count={results.conflicts.length}
                headerActions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onResolveAllConflicts('version1'); }}
                            className="text-xs font-semibold bg-slate-600 hover:bg-slate-500 text-slate-200 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
                            title={`Manter todas as versões de ${file1Name}`}
                        >
                            Manter Todos de {file1Name}
                        </button>
                         <button
                            onClick={(e) => { e.stopPropagation(); onResolveAllConflicts('version2'); }}
                            className="text-xs font-semibold bg-slate-600 hover:bg-slate-500 text-slate-200 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
                            title={`Manter todas as versões de ${file2Name}`}
                        >
                            Manter Todos de {file2Name}
                        </button>
                    </div>
                }
             >
                 {results.conflicts.map(conflict => (
                    <ConflictCard 
                        key={conflict.condition}
                        conflict={conflict}
                        file1Name={file1Name}
                        file2Name={file2Name}
                        resolvedConflicts={resolvedConflicts}
                        onResolveConflict={onResolveConflict}
                    />
                ))}
             </Section>
        )}

        {results.file1Only.length > 0 && (
            (() => {
                const conditions = results.file1Only.map(u => u.condition);
                const allIncluded = conditions.length > 0 && conditions.every(c => inclusionState[c]);
                return (
                    <Section 
                        title={`Apenas em ${file1Name}`} 
                        count={results.file1Only.length}
                        headerActions={
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleAllInclusion(conditions); }}
                                className="text-xs font-semibold bg-slate-600 hover:bg-slate-500 text-slate-200 px-3 py-1.5 rounded-md transition-colors"
                            >
                                {allIncluded ? 'Deselecionar Todos' : 'Selecionar Todos'}
                            </button>
                        }
                    >
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results.file1Only.map(utterance => (
                                <UtteranceCard 
                                    key={utterance.condition} 
                                    utterance={utterance} 
                                    title={utterance.condition} 
                                    idSuffix={`${utterance.condition}-f1`}
                                    isIncluded={inclusionState[utterance.condition]}
                                    onInclusionToggle={() => onInclusionToggle(utterance.condition)}
                                />
                            ))}
                         </div>
                    </Section>
                );
            })()
        )}

        {results.file2Only.length > 0 && (
             (() => {
                const conditions = results.file2Only.map(u => u.condition);
                const allIncluded = conditions.length > 0 && conditions.every(c => inclusionState[c]);
                return (
                    <Section 
                        title={`Apenas em ${file2Name}`} 
                        count={results.file2Only.length}
                        headerActions={
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleAllInclusion(conditions); }}
                                className="text-xs font-semibold bg-slate-600 hover:bg-slate-500 text-slate-200 px-3 py-1.5 rounded-md transition-colors"
                            >
                                {allIncluded ? 'Deselecionar Todos' : 'Selecionar Todos'}
                            </button>
                        }
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results.file2Only.map(utterance => (
                                <UtteranceCard 
                                    key={utterance.condition} 
                                    utterance={utterance} 
                                    title={utterance.condition} 
                                    idSuffix={`${utterance.condition}-f2`}
                                    isIncluded={inclusionState[utterance.condition]}
                                    onInclusionToggle={() => onInclusionToggle(utterance.condition)}
                                />
                            ))}
                        </div>
                    </Section>
                );
            })()
        )}

        {results.identical.length > 0 && (
            (() => {
                const conditions = results.identical.map(u => u.condition);
                const allIncluded = conditions.length > 0 && conditions.every(c => inclusionState[c]);
                return (
                    <Section 
                        title="Idênticas em Ambos os Arquivos" 
                        count={results.identical.length}
                        headerActions={
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggleAllInclusion(conditions); }}
                                className="text-xs font-semibold bg-slate-600 hover:bg-slate-500 text-slate-200 px-3 py-1.5 rounded-md transition-colors"
                            >
                                {allIncluded ? 'Deselecionar Todos' : 'Selecionar Todos'}
                            </button>
                        }
                    >
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results.identical.map(utterance => (
                                <UtteranceCard 
                                    key={utterance.condition} 
                                    utterance={utterance} 
                                    title={utterance.condition} 
                                    idSuffix={`${utterance.condition}-identical`}
                                    isIncluded={inclusionState[utterance.condition]}
                                    onInclusionToggle={() => onInclusionToggle(utterance.condition)}
                                />
                            ))}
                         </div>
                    </Section>
                );
            })()
        )}

        {results.conflicts.length === 0 && results.file1Only.length === 0 && results.file2Only.length === 0 && (
            <div className="bg-green-900/50 border border-green-500 text-green-300 p-6 rounded-lg text-center">
                <h2 className="text-2xl font-bold">Arquivos Idênticos!</h2>
                <p className="mt-2">Nenhuma diferença encontrada nas 'utterances' dos dois arquivos.</p>
            </div>
        )}
    </div>
  );
};

export default ComparisonResultDisplay;