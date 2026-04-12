import { useState } from 'react';
import { Card } from '../engine/types';

interface UseCardSelectionReturn {
  selectedCards: Card[];
  toggleCard(card: Card): void;
  clearSelection(): void;
}

export function useCardSelection(): UseCardSelectionReturn {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);

  function toggleCard(card: Card): void {
    setSelectedCards(prev => {
      const isSelected = prev.includes(card);
      return isSelected ? prev.filter(c => c !== card) : [...prev, card];
    });
  }

  function clearSelection(): void {
    setSelectedCards([]);
  }

  return { selectedCards, toggleCard, clearSelection };
}
