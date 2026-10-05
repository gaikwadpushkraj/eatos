import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import type { PhotoImage } from '@eatos/core';

const MAX_SIDE = 1568;

/** Shrinks a photo to what the model reads well and returns JPEG base64. The photo itself is never stored. */
export async function preparePhoto(uri: string, width?: number, height?: number): Promise<PhotoImage> {
  const long = Math.max(width ?? 0, height ?? 0);
  const actions: ImageManipulator.Action[] = long > MAX_SIDE ? [{ resize: width! >= height! ? { width: MAX_SIDE } : { height: MAX_SIDE } }] : [];
  const out = await ImageManipulator.manipulateAsync(uri, actions, { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true });
  if (!out.base64) throw new Error('That photo could not be read.');
  return { mediaType: 'image/jpeg', base64: out.base64 };
}

/** Opens the camera (or the file chooser with the camera on the web). Undefined if cancelled. */
export async function takePhoto(): Promise<PhotoImage | undefined> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error('Camera access is off. Allow it in settings, or choose a photo instead.');
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  const a = res.assets?.[0];
  return res.canceled || !a ? undefined : preparePhoto(a.uri, a.width, a.height);
}

/** Lets the person choose a photo from their library or files. Undefined if cancelled. */
export async function choosePhoto(): Promise<PhotoImage | undefined> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  const a = res.assets?.[0];
  return res.canceled || !a ? undefined : preparePhoto(a.uri, a.width, a.height);
}

/** Web: prepares a dropped or pasted image file. */
export async function photoFromFile(file: Blob): Promise<PhotoImage> {
  if (!file.type.startsWith('image/')) throw new Error('That is not a photo. Drop a JPEG, PNG or WebP image.');
  const uri = URL.createObjectURL(file);
  try {
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const im = new (globalThis as any).Image();
      im.onload = () => resolve({ w: im.naturalWidth, h: im.naturalHeight });
      im.onerror = () => resolve({ w: 0, h: 0 });
      im.src = uri;
    });
    return await preparePhoto(uri, dims.w, dims.h);
  } finally {
    URL.revokeObjectURL(uri);
  }
}
