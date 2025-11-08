import * as XLSX from 'xlsx';
import { Product } from '../types';

const PRICE_HEADERS = ['precio', 'price', 'valor', 'value'];
const NAME_HEADERS = ['nombre', 'name', 'producto', 'product', 'descripción', 'description'];
const CODE_HEADERS = ['código', 'codigo', 'code', 'sku', 'id'];

const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    return headers.findIndex(header => possibleNames.includes(header.toLowerCase().trim()));
}

const parseExcel = (data: ArrayBuffer): Product[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (json.length < 2) return [];

    const headers = json[0].map(h => String(h));
    const priceIndex = findColumnIndex(headers, PRICE_HEADERS);
    const nameIndex = findColumnIndex(headers, NAME_HEADERS);
    const codeIndex = findColumnIndex(headers, CODE_HEADERS);

    if (priceIndex === -1 || nameIndex === -1 || codeIndex === -1) {
        throw new Error('Could not identify required columns (code, name, price) in Excel file.');
    }

    const products: Product[] = [];
    for (let i = 1; i < json.length; i++) {
        const row = json[i];
        const price = parseFloat(String(row[priceIndex]).replace(/[^0-9.,]/g, '').replace(',', '.'));
        const name = String(row[nameIndex]);
        const code = String(row[codeIndex]);

        if (!isNaN(price) && name && code) {
            products.push({ id: code, code, name, price });
        }
    }
    return products;
}

const parseCSV_TXT = (text: string): Product[] => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    
    const separator = [',', ';', '\t'].sort((a,b) => lines[0].split(b).length - lines[0].split(a).length)[0];
    const headers = lines[0].split(separator).map(h => h.trim());

    const priceIndex = findColumnIndex(headers, PRICE_HEADERS);
    const nameIndex = findColumnIndex(headers, NAME_HEADERS);
    const codeIndex = findColumnIndex(headers, CODE_HEADERS);

    if (priceIndex === -1 || nameIndex === -1 || codeIndex === -1) {
        throw new Error('Could not identify required columns (code, name, price) in text file.');
    }

    const products: Product[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(separator);
        const price = parseFloat(String(values[priceIndex]).replace(/[^0-9.,]/g, '').replace(',', '.'));
        const name = String(values[nameIndex]);
        const code = String(values[codeIndex]);

        if (!isNaN(price) && name && code) {
            products.push({ id: code, code, name, price });
        }
    }
    return products;
}


export const parsePriceListFile = (file: File): Promise<Product[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    const products = parseExcel(event.target?.result as ArrayBuffer);
                    resolve(products);
                } else if (file.type.includes('csv') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                    const products = parseCSV_TXT(event.target?.result as string);
                    resolve(products);
                } else {
                    reject(new Error('Unsupported file type for price list.'));
                }
            } catch (e) {
                reject(e);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file.'));
        
        if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    });
};
