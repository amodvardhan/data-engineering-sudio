import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.REACT_APP_CRYPTO_SECRET;

export const secureStorage = {
    setItem(key: string, value: string) {
        const ciphertext = CryptoJS.AES.encrypt(value, SECRET_KEY!).toString();
        localStorage.setItem(key, ciphertext);
    },
    getItem(key: string) {
        const ciphertext = localStorage.getItem(key);
        if (!ciphertext) return null;
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY!);
        return bytes.toString(CryptoJS.enc.Utf8);
    },
};
