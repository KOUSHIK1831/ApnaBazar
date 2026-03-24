import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function compressImage(file: File, maxDimension: number = 800, initialQuality: number = 0.6): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const getBlob = (q: number): Promise<Blob> => {
        return new Promise((res) => {
          canvas.toBlob((b) => res(b!), 'image/jpeg', q);
        });
      };

      // Try initial quality, if still > 150KB, try lower quality
      getBlob(initialQuality).then(async (blob) => {
        if (blob.size > 150 * 1024 && initialQuality > 0.3) {
          const secondBlob = await getBlob(0.3);
          resolve(secondBlob);
        } else {
          resolve(blob);
        }
      });
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      console.error('Image loading failed in compressImage:', err);
      reject(new Error('Image loading failed'));
    };

    img.src = objectUrl;
  });
}
