import { Platform, Share } from 'react-native';

/** Saves text as a file on the web, or opens the share sheet on phones. */
export async function saveText(filename: string, text: string): Promise<void> {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    return;
  }
  await Share.share({ message: text, title: filename });
}
