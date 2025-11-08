import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import PriceLists from './PriceLists';
import NewBudget from './NewBudget';
import { Client, Budget } from '../types';
import { CalculatorIcon, ChevronLeftIcon } from './Icons';

interface BudgetsPageProps {
  clients: Client[];
  onSaveBudget: (clientId: string, budgetData: Omit<Budget, 'id'>) => void;
  addClient: (clientData: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate' | 'isPaused' | 'pausedTimeLeft' | 'status' | 'budgets' | 'clientType'>) => Client;
  initialClientId?: string | null;
  initialTab?: 'lists' | 'new';
}

const BudgetsPage: React.FC<BudgetsPageProps> = ({ clients, onSaveBudget, addClient, initialClientId, initialTab }) => {
  const [activeTab, setActiveTab] = useState<'lists' | 'new'>(initialTab || 'lists');
  const { t } = useTranslation();

  const tabs = [
    { id: 'lists', label: t('budgets.lists') },
    { id: 'new', label: t('budgets.new') },
  ];

  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-gray-900">
      <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6">
        <nav className="flex space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6 self-center md:self-start">
            {tabs.map(tab => (
                 <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as 'lists' | 'new')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md focus:outline-none transition-colors ${activeTab === tab.id ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-indigo-400 shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                    {tab.label}
                 </button>
            ))}
         </nav>
        {activeTab === 'lists' && <PriceLists />}
        {activeTab === 'new' && <NewBudget clients={clients} onSaveBudget={onSaveBudget} addClient={addClient} initialClientId={initialClientId} />}
      </main>
    </div>
  );
};

export default BudgetsPage;