import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Client } from './types';
import { useClients } from './hooks/useClients';
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';
import Chatbot from './components/Chatbot';
import { ExcelImporter } from './components/ExcelImporter';
import ClientForm from './components/ClientForm';
import { PlusCircleIcon, UserGroupIcon, CogIcon, UploadIcon, CloudUploadIcon, XMarkIcon, CameraIcon, QrCodeIcon, PencilIcon, AgendaIcon } from './components/Icons';
import ThemeToggle from './components/ThemeToggle';
import { GoogleDriveImporter } from './components/GoogleDriveImporter';
import MultiClientForm from './components/MultiClientForm';
import { useTranslation } from './hooks/useTranslation';
import SettingsModal from './components/SettingsModal';
import CameraScanner from './components/CameraScanner';
import BudgetsPage from './components/BudgetsPage';
import { TopNav } from './components/TopNav';

interface MobileAddActionsProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOpenForm: () => void;
  onOpenMultiForm: () => void;
  onTriggerExcelImport: () => void;
  onTriggerDriveImport: () => void;
  onOpenCameraScanner: () => void;
  onOpenQrScanner: () => void;
}

const MobileAddActions: React.FC<MobileAddActionsProps> = ({
  isOpen,
  onOpen,
  onClose,
  onOpenForm,
  onOpenMultiForm,
  onTriggerExcelImport,
  onTriggerDriveImport,
  onOpenCameraScanner,
  onOpenQrScanner
}) => {
  const { t } = useTranslation();

  const actions = [
    { label: t('addContact.manual'), icon: <PencilIcon className="w-7 h-7" />, action: onOpenForm },
    { label: t('addContact.camera'), icon: <CameraIcon className="w-7 h-7" />, action: onOpenCameraScanner },
    { label: t('addContact.qr'), icon: <QrCodeIcon className="w-7 h-7" />, action: onOpenQrScanner },
    { label: t('sidebar.addMultiple'), icon: <UserGroupIcon className="w-7 h-7" />, action: onOpenMultiForm },
    { label: t('sidebar.fromExcel'), icon: <UploadIcon className="w-7 h-7" />, action: onTriggerExcelImport },
    { label: t('sidebar.fromDrive'), icon: <CloudUploadIcon className="w-7 h-7" />, action: onTriggerDriveImport },
  ];

  return (
    <>
      <div className="fixed bottom-6 left-6 z-30">
        <button
          onClick={onOpen}
          className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-110"
          aria-label={t('sidebar.addContact')}
        >
          <PlusCircleIcon className="w-8 h-8" />
        </button>
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${isOpen ? 'bg-opacity-50 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      ></div>

      {/* Slide-up Panel */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl p-4 shadow-2xl z-50 transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-contact-heading"
      >
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
        <h2 id="add-contact-heading" className="sr-only">{t('sidebar.addContact')}</h2>
        <div className="grid grid-cols-3 gap-4 pt-2">
          {actions.map((item, index) => (
            <button
              key={index}
              onClick={() => { item.action(); onClose(); }}
              className="flex flex-col items-center justify-center space-y-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {item.icon}
              <span className="text-sm font-medium text-center text-gray-700 dark:text-gray-200">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};


const App: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, importClients, addBudgetToClient, deleteBudgetFromClient } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMultiClientFormOpen, setIsMultiClientFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { t } = useTranslation();
  const excelInputRef = useRef<HTMLInputElement>(null);
  const driveInputRef = useRef<HTMLInputElement>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState<'card' | 'qr'>('card');
  const [currentView, setCurrentView] = useState<'clients' | 'budgets'>('clients');
  const [initialBudgetInfo, setInitialBudgetInfo] = useState<{clientId: string, tab: 'new'} | null>(null);
  
  const isMainScreen = currentView === 'clients' && !selectedClientId;
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clientIdFromUrl = params.get('clientId');
    if (clientIdFromUrl && clients.some(c => c.id === clientIdFromUrl)) {
      setSelectedClientId(clientIdFromUrl);
    }
     if (selectedClientId && !clients.some(c => c.id === selectedClientId)) {
      setSelectedClientId(null);
    }
  }, [clients, selectedClientId]);

  // Effect for handling push notifications and suspended clients
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    const showNotification = (client: Client) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(t('notifications.followUp.title'), {
          body: t('notifications.followUp.body', { clientName: client.companyName }),
          tag: `followup-${client.id}`
        });
        
        notification.onclick = () => {
          window.open(`${window.location.pathname}?clientId=${client.id}`, '_blank');
        };
      }
    };

    const checkFollowUps = () => {
      const NOTIFIED_KEY = 'notified_followups_due';
      const notifiedFollowUpIds: string[] = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]');
      const updatedNotifiedIds = [...notifiedFollowUpIds];
      let hasChanges = false;
      const now = new Date();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      clients.forEach(client => {
        if (!client.nextFollowUpDate) return;
        
        const dueDate = new Date(client.nextFollowUpDate);
        
        // Notification logic
        if (!notifiedFollowUpIds.includes(client.id) && now >= dueDate) {
          showNotification(client);
          updatedNotifiedIds.push(client.id);
          hasChanges = true;
        }

        // Suspended logic
        const timeSinceDue = now.getTime() - dueDate.getTime();
        if (timeSinceDue > oneDayInMs && client.status !== 'suspended' && !client.isPaused) {
            updateClient(client.id, { status: 'suspended' });
        }
      });
      
      const activeFollowUpIds = new Set(clients.filter(c => c.nextFollowUpDate && new Date(c.nextFollowUpDate) > now).map(c => c.id));
      const finalNotifiedIds = updatedNotifiedIds.filter(id => !activeFollowUpIds.has(id));

      if (hasChanges || finalNotifiedIds.length !== updatedNotifiedIds.length) {
        localStorage.setItem(NOTIFIED_KEY, JSON.stringify(finalNotifiedIds));
      }
    };
    
    const intervalId = setInterval(checkFollowUps, 60 * 1000); // Check every minute
    const initialCheckTimeout = setTimeout(checkFollowUps, 3000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(initialCheckTimeout);
    };
  }, [clients, t, updateClient]);

  const handleSelectClient = useCallback((id: string) => {
    setSelectedClientId(id);
    setCurrentView('clients');
  }, []);
  
  const handleOpenForm = (client: Client | null = null) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };
  
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingClient(null);
  };

  const handleOpenMultiClientForm = () => setIsMultiClientFormOpen(true);
  const handleCloseMultiClientForm = () => setIsMultiClientFormOpen(false);

  const handleOpenCameraScanner = () => {
    setScanMode('card');
    setIsScannerOpen(true);
  };

  const handleOpenQrScanner = () => {
    setScanMode('qr');
    setIsScannerOpen(true);
  };
  
  const handleSaveClient = (clientData: Omit<Client, 'id' | 'nextFollowUpDate' | 'budgets' | 'clientType'> | Client) => {
    if ('id' in clientData) {
      updateClient(clientData.id, clientData);
    } else {
      addClient(clientData);
    }
    handleCloseForm();
  };

  const handleScanComplete = (data: Partial<Omit<Client, 'id'>>) => {
      setEditingClient(data as Client); // Pre-fill form
      setIsFormOpen(true);
  };

  const handleDeleteClient = (id: string) => {
    if (window.confirm(t('alerts.confirmDelete'))) {
        deleteClient(id);
    }
  };

  const handleGenerateBudget = (clientId: string) => {
    setInitialBudgetInfo({ clientId, tab: 'new' });
    setCurrentView('budgets');
  };
  
  const handleSetCurrentView = (view: 'clients' | 'budgets') => {
    if (view === 'clients') {
        setInitialBudgetInfo(null);
    }
    setCurrentView(view);
  };

  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId) ?? null;
  }, [clients, selectedClientId]);

  const renderClientView = () => (
     <>
        <aside className={`w-full md:w-1/3 h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${selectedClientId ? 'hidden md:flex' : 'flex'}`}>
        <ClientList 
          clients={clients} 
          selectedClientId={selectedClientId}
          onSelectClient={handleSelectClient}
          updateClient={updateClient}
          onGenerateBudgetForClient={handleGenerateBudget}
        />
      </aside>

      <main className={`w-full md:w-2/3 h-full overflow-y-auto ${selectedClientId ? 'flex' : 'hidden md:flex'}`}>
        {selectedClient ? (
          <ClientDetail 
            key={selectedClient.id}
            client={selectedClient} 
            updateClient={updateClient}
            onEdit={() => handleOpenForm(selectedClient)}
            onDelete={handleDeleteClient}
            onBack={() => setSelectedClientId(null)}
            deleteBudget={(budgetId) => deleteBudgetFromClient(selectedClient.id, budgetId)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <h2 className="text-2xl font-semibold">{t('clientDetail.noClientSelected')}</h2>
              <p className="mt-2">{t('clientDetail.selectOrAdd')}</p>
            </div>
          </div>
        )}
      </main>
    </>
  );

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 font-sans">
      <TopNav
        currentView={currentView}
        setCurrentView={handleSetCurrentView}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenForm={() => handleOpenForm()}
        onOpenMultiForm={handleOpenMultiClientForm}
        onTriggerExcelImport={() => excelInputRef.current?.click()}
        onTriggerDriveImport={() => driveInputRef.current?.click()}
        onOpenCameraScanner={handleOpenCameraScanner}
        onOpenQrScanner={handleOpenQrScanner}
      />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {currentView === 'clients' ? renderClientView() : <BudgetsPage clients={clients} onSaveBudget={addBudgetToClient} addClient={addClient} initialClientId={initialBudgetInfo?.clientId} initialTab={initialBudgetInfo?.tab} />}
      </div>

      <Chatbot clients={clients} addClient={addClient} isMainScreen={isMainScreen} currentView={currentView} />

      {isFormOpen && (
        <ClientForm 
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onSave={handleSaveClient}
          client={editingClient}
        />
      )}

      {isMultiClientFormOpen && (
        <MultiClientForm
          isOpen={isMultiClientFormOpen}
          onClose={handleCloseMultiClientForm}
          clients={clients}
          addClient={addClient}
          updateClient={updateClient}
        />
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      <CameraScanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanComplete={handleScanComplete}
        scanMode={scanMode}
      />

      <div className="md:hidden">
        {isMainScreen && (
            <MobileAddActions
                isOpen={isAddMenuOpen}
                onOpen={() => setIsAddMenuOpen(true)}
                onClose={() => setIsAddMenuOpen(false)}
                onOpenForm={() => handleOpenForm()}
                onOpenMultiForm={handleOpenMultiClientForm}
                onOpenCameraScanner={handleOpenCameraScanner}
                onOpenQrScanner={handleOpenQrScanner}
                onTriggerExcelImport={() => excelInputRef.current?.click()}
                onTriggerDriveImport={() => driveInputRef.current?.click()}
            />
        )}
        {isMainScreen && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
                <button
                    onClick={() => {
                        setCurrentView('clients');
                        setSelectedClientId(null);
                    }}
                    className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-transform transform hover:scale-110"
                    aria-label={t('agenda.title')}
                >
                    <AgendaIcon className="w-8 h-8" />
                </button>
            </div>
        )}
      </div>
       {/* Render hidden importers to make their file inputs available for both TopNav and MobileAddActions */}
      <div className="hidden">
        <ExcelImporter onImport={importClients} inputRef={excelInputRef} />
        <GoogleDriveImporter onImport={importClients} inputRef={driveInputRef} />
      </div>
    </div>
  );
};

export default App;