import CryptoJS from 'crypto-js';

// Encrypts a string using AES encryption
export const encrypt = (payloadObj) => {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) throw new Error('JWT_SECRET environment variable is not set');

  const timestamp = Date.now();
  const data = `${JSON.stringify(payloadObj)}|${timestamp}`;
  return CryptoJS.AES.encrypt(data, secretKey).toString();
};

// Decrypts a string using AES decryption
export const decrypt = (encrypted) => {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) throw new Error('JWT_SECRET environment variable is not set');

  const decrypted = CryptoJS.AES.decrypt(encrypted, secretKey).toString(CryptoJS.enc.Utf8);
  const [payloadStr, timestampStr] = decrypted.split('|');

  return {
    payload: JSON.parse(payloadStr),
    timestamp: Number(timestampStr),
  };
};
