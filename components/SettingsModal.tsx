import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { XMarkIcon, UploadIcon } from './Icons';
import { useSettings } from '../hooks/useSettings';
import { fileToBase64 } from '../utils/fileUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogoUploader: React.FC = () => {
    const { settings, setLogo } = useSettings();
    const { t } = useTranslation();

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const base64 = await fileToBase64(file);
            setLogo(`data:${file.type};base64,${base64}`);
        }
    };

    return (
        <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('settings.branding')}</h3>
            <div className="flex items-center space-x-4">
                {settings.logo ? (
                    <img src={settings.logo} alt="Company Logo" className="w-16 h-16 object-contain rounded-md bg-gray-100 dark:bg-gray-600" />
                ) : (
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-400">
                        <UploadIcon className="w-8 h-8" />
                    </div>
                )}
                <div>
                    <label htmlFor="logo-upload" className="cursor-pointer text-sm font-medium text-green-600 dark:text-indigo-400 hover:text-green-500">
                        {settings.logo ? t('priceList.replace') : t('fileUpload.selectFile')}
                    </label>
                    <input id="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoChange} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('settings.logoHelp')}</p>
                </div>
            </div>
        </div>
    );
};


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useTranslation();

  const languages = {
    en: 'English',
    es: 'Español',
    pt: 'Português',
    it: 'Italiano',
    de: 'Deutsch'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 dark:bg-black dark:bg-opacity-70 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-gray-100">{t('settings.title')}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Appearance Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('settings.appearance')}</h3>
            <div className="flex space-x-2 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`w-full rounded-md py-2 text-sm font-medium transition-colors focus:outline-none ${
                    theme === mode
                      ? 'bg-white dark:bg-gray-900 text-green-700 dark:text-indigo-400 shadow'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-600'
                  }`}
                >
                  {t(`settings.${mode}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Language Section */}
          <div>
            <label htmlFor="language-select" className="block text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
              {t('settings.language')}
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as keyof typeof languages)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            >
              {Object.entries(languages).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>
          
          <LogoUploader />
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;