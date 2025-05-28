import { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';

export const useSanitizedInput = (initialValue = '', options = {}) => {
  const [value, setValue] = useState(initialValue);
  
  const sanitizeValue = useCallback((input) => {
    if (typeof input !== 'string') return '';
    
    // Remove any HTML tags by default
    let sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
    
    // Apply additional sanitization based on options
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }
    
    if (options.allowedChars) {
      const regex = new RegExp(`[^${options.allowedChars}]`, 'g');
      sanitized = sanitized.replace(regex, '');
    }
    
    if (options.trim) {
      sanitized = sanitized.trim();
    }
    
    return sanitized;
  }, [options]);
  
  const handleChange = useCallback((e) => {
    const newValue = e.target ? e.target.value : e;
    setValue(sanitizeValue(newValue));
  }, [sanitizeValue]);
  
  return [value, handleChange, setValue];
};