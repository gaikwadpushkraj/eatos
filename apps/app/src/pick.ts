import * as DocumentPicker from 'expo-document-picker';

/** Lets the person choose a text file (.ics, .csv, .xml, .txt) and returns its text. */
export async function pickTextFile(): Promise<{ name: string; text: string } | undefined> {
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  const asset = res.assets?.[0];
  if (res.canceled || !asset) return undefined;
  const text = await (await fetch(asset.uri)).text();
  return { name: asset.name, text };
}
