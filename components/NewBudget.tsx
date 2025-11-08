import React, { useState, useMemo, useEffect, KeyboardEvent } from 'react';
import { Client, PriceListType, Product, BudgetItem, Budget } from '../types';
import { usePriceLists } from '../hooks/usePriceLists';
import { useTranslation } from '../hooks/useTranslation';
import { TrashIcon } from './Icons';
import { generateBudgetPDF } from './BudgetPDF';
import { useSettings } from '../hooks/useSettings';
import { CountryCodeSelector } from './CountryCodeSelector';

interface NewBudgetProps {
  clients: Client[];
  onSaveBudget: (clientId: string, budgetData: Omit<Budget, 'id'>) => void;
  addClient: (clientData: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate' | 'isPaused' | 'pausedTimeLeft' | 'status' | 'budgets' | 'clientType'>) => Client;
  initialClientId?: string | null;
}

const NewBudget: React.FC<NewBudgetProps> = ({ clients, onSaveBudget, addClient, initialClientId }) => {
  const { t } = useTranslation();
  const { getListByType, priceLists } = usePriceLists();
  const { settings } = useSettings();

  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || '');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  
  const [selectedListType, setSelectedListType] = useState<PriceListType | ''>('');
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [tempDiscount, setTempDiscount] = useState<string>(String(discount));
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // For adding a new client
  const [newClientName, setNewClientName] = useState<string | null>(null);
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientCountryCode, setNewClientCountryCode] = useState('+54');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);

  useEffect(() => {
    if (initialClientId) {
        const client = clients.find(c => c.id === initialClientId);
        if (client) {
            setSelectedClientId(client.id);
            setClientSearchTerm(client.companyName);
        }
    }
  }, [initialClientId, clients]);

  useEffect(() => {
    if (selectedClient?.clientType) {
        const typeMap: Record<NonNullable<Client['clientType']>, PriceListType> = {
            'A': 'distributor',
            'B': 'company',
            'C': 'consumer',
            'D': 'cost',
        };
        const suggestedListType = typeMap[selectedClient.clientType];
        
        // Only set the list type if a list of that type has been uploaded
        if (priceLists.some(list => list.type === suggestedListType)) {
            setSelectedListType(suggestedListType);
        } else {
            // If the suggested list doesn't exist, don't select any list.
            setSelectedListType('');
        }
    } else if (!selectedClient) {
        // When client is deselected, reset the price list
        setSelectedListType('');
    }
  }, [selectedClient, priceLists]);

  useEffect(() => {
    const client = clients.find(c => c.id === selectedClientId);
    if (client && client.companyName !== clientSearchTerm) {
        setClientSearchTerm(client.companyName);
    }
  }, [selectedClientId, clients, clientSearchTerm]);

  const clientSuggestions = useMemo(() => {
    if (!clientSearchTerm) return [];
    return clients.filter(c => 
        c.companyName.toLowerCase().includes(clientSearchTerm.toLowerCase())
    ).slice(0, 5);
  }, [clientSearchTerm, clients]);

  const isNewClientEntry = useMemo(() => {
      if (!clientSearchTerm.trim()) return false;
      return !clients.some(c => c.companyName.toLowerCase() === clientSearchTerm.trim().toLowerCase());
  }, [clientSearchTerm, clients]);

  const handleAddNewClient = (name: string) => {
    setNewClientName(name);
    setShowClientSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleSaveNewClient = () => {
    if (!newClientName || !newClientPhone.trim()) {
      alert(t('budgets.addClientModal.phoneRequired'));
      return;
    }
    const newClient = addClient({
      companyName: newClientName,
      countryCode: newClientCountryCode,
      phoneNumber: newClientPhone.trim(),
      industry: '',
      rating: 0,
      followUps: [],
      quotes: [],
      invoices: [],
      notes: [],
    });

    setSelectedClientId(newClient.id);
    setClientSearchTerm(newClient.companyName);

    setNewClientName(null);
    setNewClientPhone('');
    setNewClientCountryCode('+54');
  };

  const productList = useMemo(() => {
    if (!selectedListType) return [];
    const list = getListByType(selectedListType);
    return list ? list.products : [];
  }, [selectedListType, getListByType]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return productList.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [searchTerm, productList]);
  
  const addProductToBudget = (product: Product) => {
    setBudgetItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSearchTerm('');
    setIsSearching(false);
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    const newQuantity = Math.max(0, quantity);
    setBudgetItems(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: newQuantity } : item));
  };
  
  const removeItem = (productId: string) => {
    setBudgetItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const { subtotal, total } = useMemo(() => {
    const sub = budgetItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    const total = sub * (1 - discount / 100);
    return { subtotal: sub, total };
  }, [budgetItems, discount]);
  
  const handleFinishBudget = () => {
    if (!selectedClientId || budgetItems.length === 0) {
      alert(t('budgets.alert.selectClientAndProducts'));
      return;
    }
    const clientToUse = clients.find(c => c.id === selectedClientId);
    if (!clientToUse) return;

    const budgetData: Omit<Budget, 'id'> = {
      clientId: selectedClientId,
      clientName: clientToUse.companyName,
      date: new Date().toISOString(),
      items: budgetItems,
      discount,
      subtotal,
      total,
    };
    onSaveBudget(selectedClientId, budgetData);
    alert(t('budgets.saved'));
    
    generateBudgetPDF({ ...budgetData, id: '' }, clientToUse, settings, 'preview');

    setSelectedClientId('');
    setClientSearchTerm('');
    setSelectedListType('');
    setBudgetItems([]);
    setDiscount(0);
  };

  const handleClientKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const totalOptions = clientSuggestions.length + (isNewClientEntry ? 1 : 0);
    if (!showClientSuggestions || totalOptions === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < clientSuggestions.length) {
        const client = clientSuggestions[highlightedIndex];
        setSelectedClientId(client.id);
        setClientSearchTerm(client.companyName);
        setShowClientSuggestions(false);
      } else if (isNewClientEntry && highlightedIndex === clientSuggestions.length) {
        handleAddNewClient(clientSearchTerm.trim());
      }
    } else if (e.key === 'Escape') {
      setShowClientSuggestions(false);
    }
  };
  
  const listTypeTranslations: Record<PriceListType, string> = {
    distributor: t('priceList.distributor'),
    consumer: t('priceList.consumer'),
    company: t('priceList.company'),
    cost: t('priceList.cost'),
  };

  useEffect(() => { setTempDiscount(String(discount)) }, [discount]);
  useEffect(() => { setHighlightedIndex(-1) }, [clientSearchTerm]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('budgets.selectClient')}</label>
          <div className="relative">
            <input
              type="text"
              value={clientSearchTerm}
              onChange={e => {
                setClientSearchTerm(e.target.value);
                if (selectedClientId) setSelectedClientId('');
                setShowClientSuggestions(true);
              }}
              onFocus={() => setShowClientSuggestions(true)}
              onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}
              onKeyDown={handleClientKeyDown}
              placeholder={t('budgets.searchOrAddClient')}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
              autoComplete="off"
            />
            {showClientSuggestions && clientSearchTerm && (
              <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {clientSuggestions.map((client, index) => (
                  <li
                    key={client.id}
                    onMouseDown={() => {
                      setSelectedClientId(client.id);
                      setClientSearchTerm(client.companyName);
                      setShowClientSuggestions(false);
                    }}
                    className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${highlightedIndex === index ? 'bg-gray-200 dark:bg-gray-700' : ''}`}
                  >
                    {client.companyName}
                  </li>
                ))}
                {isNewClientEntry && (
                  <li
                    onMouseDown={() => handleAddNewClient(clientSearchTerm.trim())}
                    className={`p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50 cursor-pointer ${highlightedIndex === clientSuggestions.length ? 'bg-green-100 dark:bg-green-900/50' : ''}`}
                  >
                    {t('budgets.addNewClient', { name: clientSearchTerm.trim() })}
                  </li>
                )}
                {clientSuggestions.length === 0 && !isNewClientEntry && (
                     <li className="p-2 text-gray-500 italic">{t('budgets.noClientFound')}</li>
                )}
              </ul>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('budgets.selectPriceList')}</label>
          <select value={selectedListType} onChange={e => setSelectedListType(e.target.value as PriceListType)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" disabled={!selectedClientId && !isNewClientEntry}>
            <option value="" disabled>{t('budgets.selectPriceList')}</option>
            {priceLists.map(list => (
                <option key={list.type} value={list.type}>
                    {listTypeTranslations[list.type]}
                </option>
            ))}
          </select>
        </div>
      </div>
      
      {(selectedClientId || isNewClientEntry) && selectedListType && (
        <>
        <div className="relative mb-4">
            <button onClick={() => setIsSearching(true)} className="w-full text-left p-2 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400">
                {t('budgets.searchProduct')}
            </button>
            {isSearching && (
                 <div className="absolute top-0 left-0 w-full z-10">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder={t('budgets.searchProduct')}
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600 focus:ring-2 focus:ring-green-500"
                        autoFocus
                        onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                    />
                    {filteredProducts.length > 0 && (
                        <ul className="absolute w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-b-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredProducts.map(p => (
                                <li key={p.id} onMouseDown={() => addProductToBudget(p)} className="p-2 hover:bg-gray-100 dark:hover:bg-indigo-900/50 cursor-pointer">
                                    <p className="font-medium">{p.name}</p>
                                    <p className="text-sm text-gray-500">{p.code} - ${p.price.toFixed(2)}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-2">{t('budgets.table.product')}</th>
                  <th className="p-2 text-right">{t('budgets.table.price')}</th>
                  <th className="p-2 text-center">{t('budgets.table.quantity')}</th>
                  <th className="p-2 text-right">{t('budgets.table.total')}</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {budgetItems.map(item => (
                  <tr key={item.product.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-2 font-medium">{item.product.name}<br/><span className="text-xs text-gray-500">{item.product.code}</span></td>
                    <td className="p-2 text-right">${item.product.price.toFixed(2)}</td>
                    <td className="p-2 text-center">
                      <input type="number" value={item.quantity} onChange={e => updateQuantity(item.product.id, parseInt(e.target.value) || 0)} className="w-16 p-1 text-center border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600" />
                    </td>
                    <td className="p-2 text-right font-semibold">${(item.product.price * item.quantity).toFixed(2)}</td>
                    <td className="p-2 text-center"><button onClick={() => removeItem(item.product.id)}><TrashIcon className="w-4 h-4 text-red-500"/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between"><span>{t('budgets.subtotal')}:</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between items-center">
                  <button onClick={() => setIsDiscountModalOpen(true)} className="text-green-600 dark:text-indigo-400 hover:underline">{t('budgets.discount')} ({discount}%):</button>
                  <span>-${(subtotal * discount / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 border-gray-300 dark:border-gray-600"><span>{t('budgets.total')}:</span><span>${total.toFixed(2)}</span></div>
            </div>
          </div>
          
          <div className="mt-8 text-right">
            <button onClick={handleFinishBudget} className="px-6 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-green-300" disabled={budgetItems.length === 0 || !selectedClientId}>
              {t('budgets.finish')}
            </button>
          </div>
        </>
      )}

      {newClientName && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h3 className="text-lg font-medium mb-4">{t('budgets.addClientModal.title')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('clientForm.companyName')}</label>
                <input type="text" value={newClientName} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <label htmlFor="newClientPhoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('clientForm.phoneNumber')}</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <CountryCodeSelector value={newClientCountryCode} onChange={setNewClientCountryCode} />
                  <input
                    type="tel"
                    id="newClientPhoneNumber"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="block w-full flex-1 rounded-none rounded-r-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setNewClientName(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">{t('clientForm.cancel')}</button>
              <button onClick={handleSaveNewClient} className="px-4 py-2 bg-green-600 text-white rounded-md">{t('clientForm.save')}</button>
            </div>
          </div>
        </div>
      )}

       {isDiscountModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
                  <h3 className="text-lg font-medium mb-4">{t('budgets.enterDiscount')}</h3>
                  <input type="number" value={tempDiscount} onChange={e => setTempDiscount(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                  <div className="mt-4 flex justify-end gap-2">
                      <button onClick={() => setIsDiscountModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md">{t('clientForm.cancel')}</button>
                      <button onClick={() => { setDiscount(parseFloat(tempDiscount) || 0); setIsDiscountModalOpen(false); }} className="px-4 py-2 bg-green-600 text-white rounded-md">{t('budgets.confirm')}</button>
                  </div>
              </div>
          </div>
       )}
    </div>
  );
};

export default NewBudget;