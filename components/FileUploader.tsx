
import React from 'react';

interface FileUploaderProps {
  id: string;
  label: string;
  fileName: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ id, label, fileName, onChange }) => {
  return (
    <div className="bg-slate-800 border-2 border-dashed border-slate-600 rounded-xl p-6 text-center transition-colors hover:border-brand-primary">
      <label htmlFor={id} className="cursor-pointer flex flex-col items-center justify-center">
        <svg className="w-12 h-12 mb-3 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
        </svg>
        <span className="text-xl font-semibold text-slate-300">{label}</span>
        <p className="text-sm text-slate-400 mt-1">Clique para selecionar o arquivo .json</p>
        <input id={id} type="file" className="hidden" accept=".json" onChange={onChange} />
      </label>
      {fileName && (
        <div className="mt-4 text-sm text-brand-secondary font-medium truncate" title={fileName}>
          {fileName}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
