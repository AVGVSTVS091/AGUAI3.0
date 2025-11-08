import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { MagnifyingGlassIcon, PhoneIcon, WhatsAppIcon, DocumentTextIcon } from './Icons';
import Countdown from './Countdown';
import { useLongPress } from '../hooks/useLongPress';
import ContextMenu from './ContextMenu';
import ClientTypeSelector from './ClientTypeSelector';
import { getWhatsAppLink } from '../utils/whatsappUtils';


interface ClientListProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  onGenerateBudgetForClient: (clientId: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, selectedClientId, onSelectClient, updateClient, onGenerateBudgetForClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; client: Client | null }>({
    isOpen: false,
    x: 0,
    y: 0,
    client: null,
  });
  const { t } = useTranslation();

  const { activeClients, suspendedClients } = useMemo(() => {
    const filtered = clients.filter(client =>
      client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phoneNumber.includes(searchTerm)
    );
    return {
        activeClients: filtered.filter(c => c.status === 'active'),
        suspendedClients: filtered.filter(c => c.status === 'suspended')
    };
  }, [clients, searchTerm]);

  const handleLongPress = (event: React.TouchEvent | React.MouseEvent, client: Client) => {
    event.preventDefault();
    const x = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const y = 'touches' in event ? event.touches[0].clientY : event.clientY;
    setContextMenu({ isOpen: true, x, y, client });
  };
  
  const closeContextMenu = () => {
      setContextMenu({ isOpen: false, x: 0, y: 0, client: null });
  };
  
  const contextMenuActions = useMemo(() => {
    if (!contextMenu.client) return [];
    const client = contextMenu.client;
    const fullPhone = `${client.countryCode}${client.phoneNumber}`.replace(/\D/g, '');

    return [
      { label: t('contextMenu.call', {phone: client.phoneNumber}), icon: <PhoneIcon className="w-5 h-5"/>, onClick: () => window.location.href = `tel:${fullPhone}` },
      { label: t('contextMenu.whatsapp'), icon: <WhatsAppIcon className="w-5 h-5 text-green-500"/>, onClick: () => window.open(getWhatsAppLink(client.countryCode, client.phoneNumber), '_blank') },
      { label: t('contextMenu.whatsappCall'), icon: <PhoneIcon className="w-5 h-5 text-green-500"/>, onClick: () => window.location.href = `whatsapp://call?number=${fullPhone}` },
      { label: t('contextMenu.generateBudget'), icon: <DocumentTextIcon className="w-5 h-5"/>, onClick: () => onGenerateBudgetForClient(client.id) },
    ]
  }, [contextMenu.client, onGenerateBudgetForClient, t]);


  const renderClientList = (clientList: Client[]) => {
    return (
        <ul className="overflow-y-auto">
            {clientList.map(client => {
                const longPressProps = useLongPress(
                    (e) => handleLongPress(e, client),
                    () => onSelectClient(client.id)
                );
                
                return (
                    <li key={client.id} {...longPressProps} className={`w-full text-left p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none cursor-pointer ${selectedClientId === client.id ? 'bg-green-50 dark:bg-gray-900 border-r-4 border-green-500' : ''}`}>
                         <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className={`font-semibold text-base mb-1 ${selectedClientId === client.id ? 'text-green-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-100'}`}>{client.companyName}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{client.countryCode} {client.phoneNumber}</p>
                            </div>
                            <div className="flex flex-col items-end space-y-2 ml-2">
                                <ClientTypeSelector client={client} updateClient={updateClient} />
                                {client.nextFollowUpDate && (
                                    <div className="text-xs">
                                    <Countdown 
                                            client={client}
                                            shortFormat={true}
                                            updateClient={updateClient}
                                    />
                                    </div>
                                )}
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <input
                type="text"
                placeholder={t('sidebar.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white hidden md:block"
            />
            <div className="md:hidden">
              {isSearchVisible ? (
                <input
                  type="text"
                  placeholder={t('sidebar.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onBlur={() => setIsSearchVisible(false)}
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                />
              ) : (
                <div className="flex justify-end items-center h-9">
                  <button 
                    onClick={() => setIsSearchVisible(true)} 
                    className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Search"
                  >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            {renderClientList(activeClients)}
            {suspendedClients.length > 0 && (
                <div>
                    <h2 className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 sticky top-0">{t('suspended.title')}</h2>
                    {renderClientList(suspendedClients)}
                </div>
            )}
        </div>
        <ContextMenu 
            isOpen={contextMenu.isOpen}
            position={{ x: contextMenu.x, y: contextMenu.y }}
            actions={contextMenuActions}
            onClose={closeContextMenu}
        />
    </div>
  );
};

export default ClientList;