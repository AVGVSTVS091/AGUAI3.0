import { useState, useEffect, useCallback } from 'react';
import { Client, Budget } from '../types';

const STORAGE_KEY = 'crm_clients';

const getInitialClients = (): Client[] => {
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    const clients = item ? JSON.parse(item) : [];
    // Backwards compatibility for clients stored before new fields were added
    return clients.map((c: any) => ({
       ...c,
       countryCode: c.countryCode || '+54',
       whatsAppStatus: c.whatsAppStatus || 'unknown',
       nextFollowUpDate: c.nextFollowUpDate || null,
       isPaused: c.isPaused || false,
       pausedTimeLeft: c.pausedTimeLeft || null,
       status: c.status || 'active',
       budgets: c.budgets || [],
       clientType: c.clientType || null,
      }));
  } catch (error) {
    console.error('Error reading from localStorage', error);
    return [];
  }
};

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>(getInitialClients);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    // FIX: Added curly braces to the catch block to fix a syntax error that was causing parsing issues.
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  }, [clients]);

  const addClient = useCallback((clientData: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate' | 'isPaused' | 'pausedTimeLeft' | 'status' | 'budgets' | 'clientType'>) => {
    const newClient: Client = {
      ...clientData,
      id: crypto.randomUUID(),
      rating: clientData.rating || 0,
      followUps: clientData.followUps || [],
      quotes: clientData.quotes || [],
      invoices: clientData.invoices || [],
      notes: clientData.notes || [{ id: crypto.randomUUID(), content: '', lastUpdated: new Date().toISOString() }],
      whatsAppStatus: 'unknown',
      nextFollowUpDate: null,
      isPaused: false,
      pausedTimeLeft: null,
      status: 'active',
      budgets: [],
      clientType: null,
    };
    setClients(prev => [...prev, newClient]);
    return newClient;
  }, []);

  const updateClient = useCallback((id: string, updatedData: Partial<Omit<Client, 'id'>>) => {
    setClients(prev =>
      prev.map(client =>
        client.id === id ? { ...client, ...updatedData } : client
      )
    );
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(client => client.id !== id));
  }, []);

  const importClients = useCallback((importedClients: Omit<Client, 'id' | 'whatsAppStatus' | 'nextFollowUpDate' | 'isPaused' | 'pausedTimeLeft' | 'status' | 'budgets' | 'clientType'>[]) => {
    setClients(prevClients => {
      const existingPhones = new Set(prevClients.map(c => c.countryCode + c.phoneNumber));
      const newClients = importedClients
        .filter(ic => !existingPhones.has(ic.countryCode + ic.phoneNumber))
        .map(ic => ({
            ...ic,
            id: crypto.randomUUID(),
            rating: 0,
            followUps: [],
            quotes: [],
            invoices: [],
            notes: [{ id: crypto.randomUUID(), content: '', lastUpdated: new Date().toISOString() }],
            whatsAppStatus: 'unknown' as const,
            nextFollowUpDate: null,
            isPaused: false,
            pausedTimeLeft: null,
            status: 'active' as const,
            budgets: [],
            clientType: null,
        }));
      return [...prevClients, ...newClients];
    });
  }, []);

  const addBudgetToClient = useCallback((clientId: string, budgetData: Omit<Budget, 'id'>) => {
      const newBudget: Budget = {
          ...budgetData,
          id: `budget-${crypto.randomUUID()}`
      };
      setClients(prev => prev.map(client => {
          if (client.id === clientId) {
              return {
                  ...client,
                  budgets: [...client.budgets, newBudget]
              }
          }
          return client;
      }));
  }, []);

  const deleteBudgetFromClient = useCallback((clientId: string, budgetId: string) => {
      setClients(prev => prev.map(client => {
          if (client.id === clientId) {
              return {
                  ...client,
                  budgets: client.budgets.filter(b => b.id !== budgetId)
              }
          }
          return client;
      }));
  }, []);


  return { clients, addClient, updateClient, deleteClient, importClients, addBudgetToClient, deleteBudgetFromClient };
};