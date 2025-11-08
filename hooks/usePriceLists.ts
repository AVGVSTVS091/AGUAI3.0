import { useState, useEffect, useCallback } from 'react';
import { PriceList, PriceListType, Product } from '../types';

const STORAGE_KEY = 'crm_pricelists';

const getInitialPriceLists = (): PriceList[] => {
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error('Error reading price lists from localStorage', error);
    return [];
  }
};

export const usePriceLists = () => {
  const [priceLists, setPriceLists] = useState<PriceList[]>(getInitialPriceLists);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(priceLists));
    } catch (error) {
      console.error('Error writing price lists to localStorage', error);
    }
  }, [priceLists]);

  const addOrUpdateList = useCallback((type: PriceListType, products: Product[], fileName: string) => {
    const newList: PriceList = {
      type,
      products,
      fileName,
      uploadDate: new Date().toISOString(),
    };
    setPriceLists(prev => {
      const existing = prev.find(l => l.type === type);
      if (existing) {
        return prev.map(l => l.type === type ? newList : l);
      }
      return [...prev, newList];
    });
  }, []);
  
  const getListByType = useCallback((type: PriceListType): PriceList | undefined => {
      return priceLists.find(l => l.type === type);
  }, [priceLists]);

  const deleteList = useCallback((type: PriceListType) => {
    setPriceLists(prev => prev.filter(l => l.type !== type));
  }, []);

  return { priceLists, addOrUpdateList, getListByType, deleteList };
};
