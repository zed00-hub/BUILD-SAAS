
import { HistoryItem, HistoryToolType } from "../types";

const STORAGE_KEY = 'creakits_history_v1';
const MAX_ITEMS_PER_TOOL = 8; // Limit to prevent localStorage quota issues with Base64 images

export const getHistory = (tool: HistoryToolType): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    
    const allHistory: HistoryItem[] = JSON.parse(raw);
    // Filter by tool and sort by date descending
    return allHistory
      .filter(item => item.tool === tool)
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveHistoryItem = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let allHistory: HistoryItem[] = raw ? JSON.parse(raw) : [];
    
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    // Add new item to top
    allHistory.unshift(newItem);
    
    // Clean up old items for this specific tool to save space
    const toolItems = allHistory.filter(i => i.tool === item.tool);
    if (toolItems.length > MAX_ITEMS_PER_TOOL) {
       const itemsToKeep = toolItems.slice(0, MAX_ITEMS_PER_TOOL);
       const otherItems = allHistory.filter(i => i.tool !== item.tool);
       allHistory = [...itemsToKeep, ...otherItems];
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allHistory));
    return newItem;
  } catch (e) {
    console.error("Failed to save history", e);
    // Likely QuotaExceededError if images are huge
    alert("History storage full. Old items might be removed automatically.");
    return null;
  }
};

export const deleteHistoryItem = (id: string) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    
    let allHistory: HistoryItem[] = JSON.parse(raw);
    allHistory = allHistory.filter(item => item.id !== id);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allHistory));
  } catch (e) {
    console.error("Failed to delete history item", e);
  }
};
