import {
    ref,
    uploadString,
    getDownloadURL,
    deleteObject,
    listAll,
    getMetadata
} from 'firebase/storage';
import {
    doc,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { storage, db } from '../firebase';
import { WalletService } from './walletService';

// Storage limits per plan
export const STORAGE_LIMITS = {
    trial: { maxDesigns: 0, maxSizeMB: 0 },      // No storage for trial
    basic: { maxDesigns: 15, maxSizeMB: 100 },   // 15 designs, 100MB max
    pro: { maxDesigns: 40, maxSizeMB: 300 },     // 40 designs, 300MB max
    elite: { maxDesigns: 100, maxSizeMB: 1000 }  // 100 designs, 1GB max
};

export type DesignType = 'social' | 'ad' | 'landing' | 'quick-edit';

export interface SavedDesign {
    id: string;
    userId: string;
    type: DesignType;
    name: string;
    thumbnailUrl: string;
    imageUrls: string[];
    storagePaths: string[];
    createdAt: Timestamp;
    sizeBytes: number;
    metadata?: {
        prompt?: string;
        slideCount?: number;
        [key: string]: any;
    };
}

export interface StorageQuota {
    used: number;        // Number of designs saved
    limit: number;       // Max designs allowed
    usedSizeMB: number;  // Size used in MB
    limitSizeMB: number; // Max size in MB
    canSave: boolean;    // Whether user can save more
    planType: string;    // Current plan
}

const DESIGNS_COLLECTION = 'saved_designs';

export class CloudStorageService {
    /**
     * Get user's storage quota based on their plan
     */
    static async getStorageQuota(uid: string): Promise<StorageQuota> {
        try {
            const userProfile = await WalletService.getUserProfile(uid);

            // Determine plan type
            let planKey: 'trial' | 'basic' | 'pro' | 'elite' = 'trial';
            if (userProfile?.accountType === 'paid') {
                if (userProfile.planType === 'pro') planKey = 'pro';
                else if (userProfile.planType === 'elite') planKey = 'elite';
                else planKey = 'basic';
            }

            const limits = STORAGE_LIMITS[planKey];

            // Count existing designs
            const designsQuery = query(
                collection(db, DESIGNS_COLLECTION),
                where('userId', '==', uid)
            );
            const snapshot = await getDocs(designsQuery);

            let totalSizeBytes = 0;
            snapshot.docs.forEach(doc => {
                totalSizeBytes += doc.data().sizeBytes || 0;
            });

            const usedSizeMB = totalSizeBytes / (1024 * 1024);
            const used = snapshot.size;

            return {
                used,
                limit: limits.maxDesigns,
                usedSizeMB: Math.round(usedSizeMB * 100) / 100,
                limitSizeMB: limits.maxSizeMB,
                canSave: used < limits.maxDesigns && usedSizeMB < limits.maxSizeMB,
                planType: planKey
            };
        } catch (error) {
            console.error('Error getting storage quota:', error);
            return {
                used: 0,
                limit: 0,
                usedSizeMB: 0,
                limitSizeMB: 0,
                canSave: false,
                planType: 'trial'
            };
        }
    }

    /**
     * Save a design to cloud storage (for paid users only)
     */
    static async saveDesign(
        uid: string,
        type: DesignType,
        name: string,
        images: string[], // Base64 images
        metadata?: Record<string, any>
    ): Promise<{ success: boolean; designId?: string; error?: string }> {
        try {
            // Check quota first
            const quota = await this.getStorageQuota(uid);

            if (quota.planType === 'trial') {
                return {
                    success: false,
                    error: 'TRIAL_NO_STORAGE'
                };
            }

            if (!quota.canSave) {
                return {
                    success: false,
                    error: 'QUOTA_EXCEEDED'
                };
            }

            const storagePaths: string[] = [];
            const imageUrls: string[] = [];
            let totalSize = 0;

            // Upload each image to Firebase Storage
            for (let i = 0; i < images.length; i++) {
                const base64Data = images[i];
                const timestamp = Date.now();
                const path = `designs/${uid}/${type}/${timestamp}_${i}.webp`;

                const storageRef = ref(storage, path);

                // Upload base64 string (removing data URL prefix if present)
                const base64Content = base64Data.includes('base64,')
                    ? base64Data.split('base64,')[1]
                    : base64Data;

                await uploadString(storageRef, base64Content, 'base64', {
                    contentType: 'image/webp'
                });

                // Get download URL
                const downloadUrl = await getDownloadURL(storageRef);

                // Get file size
                const fileMetadata = await getMetadata(storageRef);
                totalSize += fileMetadata.size;

                storagePaths.push(path);
                imageUrls.push(downloadUrl);
            }

            // Save metadata to Firestore
            const designData: Omit<SavedDesign, 'id'> = {
                userId: uid,
                type,
                name,
                thumbnailUrl: imageUrls[0],
                imageUrls,
                storagePaths,
                createdAt: Timestamp.now(),
                sizeBytes: totalSize,
                metadata
            };

            const docRef = await addDoc(collection(db, DESIGNS_COLLECTION), designData);

            return { success: true, designId: docRef.id };

        } catch (error: any) {
            console.error('Error saving design:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all saved designs for a user
     */
    static async getUserDesigns(
        uid: string,
        type?: DesignType,
        maxResults: number = 50
    ): Promise<SavedDesign[]> {
        try {
            let designsQuery;

            if (type) {
                designsQuery = query(
                    collection(db, DESIGNS_COLLECTION),
                    where('userId', '==', uid),
                    where('type', '==', type),
                    orderBy('createdAt', 'desc'),
                    limit(maxResults)
                );
            } else {
                designsQuery = query(
                    collection(db, DESIGNS_COLLECTION),
                    where('userId', '==', uid),
                    orderBy('createdAt', 'desc'),
                    limit(maxResults)
                );
            }

            const snapshot = await getDocs(designsQuery);

            return snapshot.docs.map(docSnap => {
                const data = docSnap.data() as Omit<SavedDesign, 'id'>;
                return {
                    id: docSnap.id,
                    ...data
                } as SavedDesign;
            });

        } catch (error) {
            console.error('Error fetching user designs:', error);
            return [];
        }
    }

    /**
     * Delete a saved design
     */
    static async deleteDesign(uid: string, designId: string): Promise<boolean> {
        try {
            // Get design data first
            const designsQuery = query(
                collection(db, DESIGNS_COLLECTION),
                where('userId', '==', uid)
            );
            const snapshot = await getDocs(designsQuery);
            const designDoc = snapshot.docs.find(d => d.id === designId);

            if (!designDoc) {
                console.error('Design not found or unauthorized');
                return false;
            }

            const designData = designDoc.data() as SavedDesign;

            // Delete files from Storage
            for (const path of designData.storagePaths) {
                try {
                    const storageRef = ref(storage, path);
                    await deleteObject(storageRef);
                } catch (e) {
                    console.warn('Could not delete file:', path, e);
                }
            }

            // Delete Firestore document
            await deleteDoc(doc(db, DESIGNS_COLLECTION, designId));

            return true;

        } catch (error) {
            console.error('Error deleting design:', error);
            return false;
        }
    }

    /**
     * Compress image before upload (reduces storage costs)
     */
    static async compressImage(base64Image: string, maxWidth: number = 1200, quality: number = 0.8): Promise<string> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Scale down if too large
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    // Convert to WebP for better compression
                    resolve(canvas.toDataURL('image/webp', quality));
                } else {
                    resolve(base64Image);
                }
            };
            img.onerror = () => resolve(base64Image);
            img.src = base64Image;
        });
    }

    /**
     * Bulk delete old designs (for cleanup)
     */
    static async deleteOldestDesigns(uid: string, count: number): Promise<number> {
        try {
            const designsQuery = query(
                collection(db, DESIGNS_COLLECTION),
                where('userId', '==', uid),
                orderBy('createdAt', 'asc'),
                limit(count)
            );

            const snapshot = await getDocs(designsQuery);
            let deleted = 0;

            for (const designDoc of snapshot.docs) {
                const success = await this.deleteDesign(uid, designDoc.id);
                if (success) deleted++;
            }

            return deleted;

        } catch (error) {
            console.error('Error deleting old designs:', error);
            return 0;
        }
    }
}
