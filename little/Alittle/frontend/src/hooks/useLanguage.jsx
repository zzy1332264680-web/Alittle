import { useContext } from 'react';
import { LanguageContext } from './language-context.js';

export const useLanguage = () => useContext(LanguageContext);
