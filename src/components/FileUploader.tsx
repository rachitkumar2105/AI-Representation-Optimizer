import React, { useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useData } from "../context/DataContext";
import { useTheme } from "../hooks/useTheme";



export default function FileUploader() {

  const { ingestData, setError, resetData } = useData();
  const { theme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === "dark";

  const handleFile = (file: File) => {
    setFiles((prev) => [...prev, file.name]);
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "csv") {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        worker: true,
        complete: (results) => {
          ingestData(results.data);
          setError(null);
        },
        error: (err) => setError(`CSV Parse Error: ${err.message}`),
      });

    } else if (extension === "xlsx" || extension === "xls") {


      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          ingestData(jsonData);
          setError(null);
        } catch (err: any) {
          setError(`Excel Parse Error: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError("Unsupported file format. Please upload .csv or .xlsx");
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const uploadedFiles = Array.from(e.dataTransfer.files);
    uploadedFiles.forEach(handleFile);
  };

  return (
    <div className="w-full space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files) {
            Array.from(e.target.files).forEach(handleFile);
          }
        }}
        accept=".csv,.xlsx,.xls"
        multiple
        className="hidden"
      />
      
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 transition-all cursor-pointer ${
          isDragging
            ? "border-brand-primary bg-brand-primary/10"
            : isDark
            ? "border-slate-700 bg-slate-900/40 hover:border-slate-500"
            : "border-slate-300 bg-slate-50 hover:border-slate-400"
        }`}
      >
        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-premium-gradient shadow-lg`}>
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        
        <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
          {files.length > 0 ? `${files.length} Files Loaded` : "Ingest Dataset"}
        </h3>
        <p className={`mt-2 text-center text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {files.length > 0 
            ? "Upload another file to merge datasets (e.g. Behavior + Metadata)" 
            : "Drag & drop .csv or .xlsx files here, or click to browse."}
        </p>

        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-brand-primary/20 backdrop-blur-sm">
            <p className="text-xl font-bold text-brand-primary">Drop to analyze</p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((name, i) => (
            <div key={i} className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold ${
              isDark ? "border-slate-700 bg-slate-800 text-slate-300" : "border-slate-200 bg-slate-100 text-slate-600"
            }`}>
              <svg className="h-3 w-3 text-brand-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              {name}
            </div>
          ))}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setFiles([]);
              resetData();
            }}
            className="text-[10px] font-bold text-rose-500 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
