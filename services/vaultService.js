/**
 * Crypta Workspace - Vault Service
 * 
 * Manages zero-knowledge encrypted vault storage in local storage.
 */

(function() {
    const LOCAL_VAULT_KEY = 'crypta_local_vault_items';

    function getLocalVault() {
        try {
            const items = JSON.parse(localStorage.getItem(LOCAL_VAULT_KEY) || '[]');
            if (!Array.isArray(items)) {
                throw new Error('Local vault data is not a list.');
            }
            return items;
        } catch (e) {
            throw new Error(`Could not read the local vault: ${e.message}`);
        }
    }

    function saveLocalVault(items) {
        localStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(items));
    }

    function encodeBase64(bytes) {
        let binary = '';
        const chunkSize = 0x8000;
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
        }
        return btoa(binary);
    }

    const CryptaVault = {
        async saveItem({ itemType, title, algorithm, encryptedData, fileSize, metadata = {} }) {
            const user = await window.CryptaAuth.getCurrentUser();
            if (!user) {
                throw new Error('Please sign in or continue as guest to use the Vault.');
            }

            if (typeof encryptedData !== 'string' || !encryptedData) {
                throw new Error('Encrypted vault data must be a non-empty string.');
            }

            const items = getLocalVault();
            const newItem = {
                id: 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                user_id: user.id,
                item_type: itemType,
                title: title || `${itemType.toUpperCase()} item - ${new Date().toLocaleTimeString()}`,
                algorithm: algorithm || 'AES-256-GCM',
                encrypted_data: encryptedData,
                file_size: fileSize ?? encryptedData.length,
                metadata: metadata,
                created_at: new Date().toISOString()
            };
            items.unshift(newItem);
            saveLocalVault(items);

            return {
                id: newItem.id,
                source: 'local',
                item: newItem
            };
        },

        async saveEncryptedPng({ itemType, title, algorithm, bytes, fileName, metadata = {} }) {
            if (!(bytes instanceof Uint8Array) || bytes.length === 0) {
                throw new Error('Encrypt an asset before saving it to the vault.');
            }

            return this.saveItem({
                itemType,
                title,
                algorithm,
                encryptedData: encodeBase64(bytes),
                fileSize: bytes.byteLength,
                metadata: {
                    ...metadata,
                    fileName: fileName || `crypta-encrypted-${itemType}.png`,
                    contentType: 'image/png'
                }
            });
        },

        async listItems({ itemType } = {}) {
            const user = await window.CryptaAuth.getCurrentUser();
            if (!user) return [];

            let items = getLocalVault();
            if (itemType) {
                items = items.filter(i => i.item_type === itemType);
            }
            return items.map(i => ({ ...i, source: 'local' }));
        },

        async getItem(id) {
            const user = await window.CryptaAuth.getCurrentUser();
            if (!user) throw new Error('Not authenticated.');

            const items = getLocalVault();
            const found = items.find(i => i.id === id);
            if (!found) throw new Error('Vault item not found.');
            return { ...found, source: 'local' };
        },

        async deleteItem(id) {
            const user = await window.CryptaAuth.getCurrentUser();
            if (!user) throw new Error('Not authenticated.');

            let items = getLocalVault();
            items = items.filter(i => i.id !== id);
            saveLocalVault(items);
            return true;
        }
    };

    window.CryptaVault = CryptaVault;
})();
