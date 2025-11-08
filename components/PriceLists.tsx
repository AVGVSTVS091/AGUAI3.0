import React, { useState, useRef, useCallback, DragEvent } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { usePriceLists } from '../hooks/usePriceLists';
import { parsePriceListFile } from '../utils/priceListParser';
import { PriceList, PriceListType, Product } from '../types';
import { UploadIcon, DocumentIcon, TrashIcon, ArrowPathIcon, EyeIcon, CloudUploadIcon } from './Icons';
import { GoogleDriveImporter } from './GoogleDriveImporter';

interface PriceListSlotProps {
  listType: PriceListType;
  list: PriceList | undefined;
  onUpload: (type: PriceListType, products: Product[], fileName: string) => Promise<void>;
  onDelete: (type: PriceListType) => void;
}

const PriceListSlot: React.FC<PriceListSlotProps> = ({ listType, list, onUpload, onDelete }) => {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const driveInputRef = useRef<HTMLInputElement>(null);

  const listTypeTranslations: Record<PriceListType, string> = {
    distributor: t('priceList.distributor'),
    consumer: t('priceList.consumer'),
    company: t('priceList.company'),
    cost: t('priceList.cost'),
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const products = await parsePriceListFile(file);
      await onUpload(listType, products, file.name);
    } catch (error) {
      console.error(error);
      alert(t('priceList.parseError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onDriveImport = (clients: any[]) => {
      // This is a workaround since GoogleDriveImporter is designed for clients
      // We need a proper file handler here.
      // For now, this will not work as expected and needs a dedicated file picker for drive
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-3">{listTypeTranslations[listType]}</h3>
      {list ? (
        <div>
          <div className="flex items-start p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
            <DocumentIcon className="w-6 h-6 text-green-500 dark:text-indigo-400 mt-1 flex-shrink-0" />
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 break-all">{list.fileName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('priceList.uploadedOn')} {new Date(list.uploadDate).toLocaleDateString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{list.products.length} products</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-3">
            <button onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-green-600 hover:text-green-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"><ArrowPathIcon className="w-4 h-4"/>{t('priceList.replace')}</button>
            <button onClick={() => onDelete(listType)} className="text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"><TrashIcon className="w-4 h-4"/>{t('priceList.delete')}</button>
          </div>
        </div>
      ) : (
        <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center transition-colors ${isDragOver ? 'border-green-500 bg-green-50 dark:bg-indigo-900/20' : ''}`}
        >
          {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('priceList.processing')}</p>
              </>
          ) : (
            <>
              <UploadIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('priceList.upload')}</p>
              <div className="mt-4 flex justify-center gap-2">
                 <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
                    {t('priceList.device')}
                </button>
                 {/* <button onClick={() => driveInputRef.current?.click()} className="px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
                    {t('priceList.drive')}
                </button> */}
              </div>
            </>
          )}
        </div>
      )}
       <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls, .csv, .txt" />
       {/* <div className="hidden"><GoogleDriveImporter onImport={onDriveImport} inputRef={driveInputRef} /></div> */}
    </div>
  );
};

const PriceLists: React.FC = () => {
  const { priceLists, addOrUpdateList, deleteList } = usePriceLists();
  
  const handleUpload = async (type: PriceListType, products: Product[], fileName: string) => {
    addOrUpdateList(type, products, fileName);
  };
  
  const listTypes: PriceListType[] = ['distributor', 'consumer', 'company', 'cost'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {listTypes.map(type => (
        <PriceListSlot
          key={type}
          listType={type}
          list={priceLists.find(l => l.type === type)}
          onUpload={handleUpload}
          onDelete={deleteList}
        />
      ))}
    </div>
  );
};

export default PriceLists;