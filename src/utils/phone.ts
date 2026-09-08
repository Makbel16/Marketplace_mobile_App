/**
 * Ethiopian Phone Number Validation and Formatting Utilities
 * Supports:
 * - Ethio Telecom (09... / +251 9...)
 * - Safaricom Ethiopia (07... / +251 7...)
 */

export const isValidEthiopianPhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  const ethRegex = /^(?:\+251|00251|251|0)?([97]\d{8})$/;
  return ethRegex.test(cleaned);
};

export const normalizeEthiopianPhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  const match = cleaned.match(/^(?:\+251|00251|251|0)?([97]\d{8})$/);
  if (!match) return phone.trim();
  const nationalNumber = match[1]; // 9 digits: e.g. 911234567
  return `+251 ${nationalNumber.slice(0, 2)} ${nationalNumber.slice(2, 5)} ${nationalNumber.slice(5)}`;
};

export const formatLocalEthiopianPhone = (phone: string): string => {
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  const match = cleaned.match(/^(?:\+251|00251|251|0)?([97]\d{8})$/);
  if (!match) return phone.trim();
  const nationalNumber = match[1]; // 9 digits: e.g. 911234567
  return `0${nationalNumber.slice(0, 2)} ${nationalNumber.slice(2, 5)} ${nationalNumber.slice(5)}`;
};
