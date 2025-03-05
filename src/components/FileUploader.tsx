import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, AlertCircle, FileSpreadsheet } from 'lucide-react';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';

interface FileUploaderProps {
  projectId: string;
  campaignId?: string;
  onUploadComplete: () => void;
  type?: 'knowledge' | 'contacts';
}

const FileUploader: React.FC<FileUploaderProps> = ({ projectId, campaignId, onUploadComplete, type = 'knowledge' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    // Filter files by type and size
    const validFiles = newFiles.filter(file => {
      const validTypes = type === 'contacts' 
        ? ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
        : ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv'];
      const validSize = file.size <= 10 * 1024 * 1024; // 10MB max
      
      return validTypes.includes(file.type) && validSize;
    });
    
    if (validFiles.length !== newFiles.length) {
      setError(type === 'contacts'
        ? 'Some files were rejected. Only Excel and CSV files under 10MB are allowed.'
        : 'Some files were rejected. Only PDF, DOCX, TXT, CSV files under 10MB are allowed.');
    } else {
      setError(null);
    }
    
    setFiles(prevFiles => [...prevFiles, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      if (type === 'contacts' && campaignId) {
        // Process contact files
        for (const file of files) {
          const contacts = await processContactFile(file);
          
          // Insert contacts into call_targets table
          const { error } = await supabase
            .from('call_targets')
            .insert(contacts.map(contact => ({
              campaign_id: campaignId,
              ...contact
            })));
            
          if (error) throw error;
        }
      } else {
        // Upload each file to knowledge_sources table
        for (const file of files) {
          const { error } = await supabase
            .from('knowledge_sources')
            .insert({
              project_id: projectId,
              name: file.name,
              type: 'document',
              status: 'processing',
              content: `Sample content from ${file.name}`
            });
            
          if (error) throw error;
        }
      }
      
      // Clear files after successful upload
      setFiles([]);
      onUploadComplete();
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const processContactFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'text/csv') {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            const validContacts = results.data
              .filter(contact => contact.phone_number || contact.mobile || contact.phone)
              .map(contact => ({
                phone_number: contact.phone_number || contact.mobile || contact.phone,
                name: contact.name || contact.contact_name || contact.full_name,
                company: contact.company || contact.organization,
                email: contact.email || contact.email_address,
                additional_data: contact
              }));
            resolve(validContacts);
          },
          error: (error) => reject(error)
        });
      } else {
        const workbook = new ExcelJS.Workbook();
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const buffer = e.target?.result as ArrayBuffer;
            await workbook.xlsx.load(buffer);
            
            const worksheet = workbook.worksheets[0];
            const contacts = [];
            
            worksheet.eachRow({ includeEmpty: false, headers: true }, (row, rowNumber) => {
              if (rowNumber === 1) return; // Skip header row
              
              const contact = {
                phone_number: row.getCell('phone_number').value || row.getCell('mobile').value || row.getCell('phone').value,
                name: row.getCell('name').value || row.getCell('contact_name').value || row.getCell('full_name').value,
                company: row.getCell('company').value || row.getCell('organization').value,
                email: row.getCell('email').value || row.getCell('email_address').value,
                additional_data: row.values
              };
              
              if (contact.phone_number) {
                contacts.push(contact);
              }
            });
            
            resolve(contacts);
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-2">
            Drag and drop files here, or click to select files
          </p>
          <p className="text-xs text-gray-400">
            {type === 'contacts'
              ? 'Supports Excel and CSV files (max 10MB per file)'
              : 'Supports PDF, DOCX, TXT, CSV (max 10MB per file)'}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Select Files
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            accept={type === 'contacts' ? '.xlsx,.csv' : '.pdf,.docx,.txt,.csv'}
            className="hidden"
          />
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files</h4>
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
            {files.map((file, index) => (
              <li key={index} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-gray-900">{file.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={uploadFiles}
              disabled={uploading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;