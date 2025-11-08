import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { AgendaIcon, DocumentTextIcon, CogIcon, PlusCircleIcon, PencilIcon, CameraIcon, QrCodeIcon, UserGroupIcon, UploadIcon, CloudUploadIcon } from './Icons';
import ThemeToggle from './ThemeToggle';

interface TopNavProps {
  currentView: 'clients' | 'budgets';
  setCurrentView: (view: 'clients' | 'budgets') => void;
  onOpenSettings: () => void;
  onOpenForm: () => void;
  onOpenMultiForm: () => void;
  onTriggerExcelImport: () => void;
  onTriggerDriveImport: () => void;
  onOpenCameraScanner: () => void;
  onOpenQrScanner: () => void;
}

const AddActionsMenu: React.FC<Omit<TopNavProps, 'currentView' | 'setCurrentView' | 'onOpenSettings'> & { onClose: () => void }> = ({
  onOpenForm,
  onOpenMultiForm,
  onTriggerExcelImport,
  onTriggerDriveImport,
  onOpenCameraScanner,
  onOpenQrScanner,
  onClose
}) => {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const actions = [
    { label: t('addContact.manual'), icon: <PencilIcon className="w-5 h-5" />, action: onOpenForm },
    { label: t('addContact.camera'), icon: <CameraIcon className="w-5 h-5" />, action: onOpenCameraScanner },
    { label: t('addContact.qr'), icon: <QrCodeIcon className="w-5 h-5" />, action: onOpenQrScanner },
    { label: t('sidebar.addMultiple'), icon: <UserGroupIcon className="w-5 h-5" />, action: onOpenMultiForm },
    { label: t('sidebar.fromExcel'), icon: <UploadIcon className="w-5 h-5" />, action: onTriggerExcelImport },
    { label: t('sidebar.fromDrive'), icon: <CloudUploadIcon className="w-5 h-5" />, action: onTriggerDriveImport },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-gray-200 ring-opacity-50 dark:ring-black dark:ring-opacity-5 focus:outline-none z-50"
    >
      <div className="py-1">
        {actions.map((item, index) => (
          <button
            key={index}
            onClick={() => { item.action(); onClose(); }}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="mr-3">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};


export const TopNav: React.FC<TopNavProps> = (props) => {
    const { currentView, setCurrentView, onOpenSettings } = props;
    const { t } = useTranslation();
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

    const NavButton: React.FC<{ view: 'clients' | 'budgets'; children: React.ReactNode }> = ({ view, children }) => (
         <button
            onClick={() => setCurrentView(view)}
            className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === view
                ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50'
            }`}
            aria-pressed={currentView === view}
        >
            {children}
        </button>
    );

    return (
        <header className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <NavButton view="clients">
                <AgendaIcon className="w-5 h-5" />
                <span className="hidden md:inline ml-2">{t('agenda.title')}</span>
            </NavButton>
            <NavButton view="budgets">
                <DocumentTextIcon className="w-5 h-5" />
                <span className="hidden md:inline ml-2">{t('budgets.title')}</span>
            </NavButton>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative hidden md:inline-block text-left">
              <button
                onClick={() => setIsAddMenuOpen(prev => !prev)}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                {t('sidebar.addContact')}
              </button>
              {isAddMenuOpen && <AddActionsMenu {...props} onClose={() => setIsAddMenuOpen(false)} />}
            </div>

            <button onClick={onOpenSettings} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
              <CogIcon className="w-5 h-5" />
            </button>
            <ThemeToggle />
          </div>
        </header>
    );
}