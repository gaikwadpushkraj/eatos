import { useState } from 'react';
import { router } from 'expo-router';
import { VaultError, encryptBackup, makeBackup, readBackup, BackupError } from '@eatos/core';
import { useKernel } from './kernel';
import { saveText } from './files';
import { pickTextFile } from './pick';
import { randomBytes } from './secure';
import { Btn, Card, Field, Row, Section, Txt } from './ui';

const MIN_LENGTH = 8;

type Note = { tone: 'ok' | 'warn'; text: string } | null;

function Result({ note }: { note: Note }) {
  if (!note) return null;
  return (
    <Card tone={note.tone}>
      <Txt v="small" color={note.tone === 'ok' ? 'okText' : 'warnText'}>{note.text}</Txt>
    </Card>
  );
}

/** Encrypt this device with a passphrase. There is no recovery if it is lost. */
export function DeviceProtection() {
  const { security } = useKernel();
  const [passphrase, setPassphrase] = useState('');
  const [again, setAgain] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);

  const run = async (fn: () => Promise<void>, done: string) => {
    setBusy(true);
    setNote(null);
    try {
      await fn();
      setNote({ tone: 'ok', text: done });
      setPassphrase('');
      setAgain('');
      setOpen(false);
    } catch (e) {
      setNote({ tone: 'warn', text: e instanceof VaultError && e.code === 'wrong-passphrase' ? 'That passphrase is not right.' : 'That did not work. Try again.' });
    } finally {
      setBusy(false);
    }
  };

  const tooShort = passphrase.length < MIN_LENGTH;
  const mismatch = passphrase !== again;

  return (
    <Card>
      <Txt v="h3">Protect this device</Txt>
      <Txt v="small">
        {security.encrypted
          ? 'On. Your meal log and saved keys are encrypted on this device and the app asks for your passphrase when it opens.'
          : 'Encrypt your meal log, health data and saved keys with a passphrase. If you lose the passphrase there is no way to recover the data, so keep a backup.'}
      </Txt>
      {security.encrypted ? (
        <>
          <Row wrap>
            <Btn small label="Lock now" onPress={security.lock} />
            <Btn small kind="outline" label={open ? 'Cancel' : 'Turn off protection'} onPress={() => setOpen(!open)} />
          </Row>
          {open ? (
            <>
              <Field label="Passphrase" value={passphrase} onChangeText={setPassphrase} secureTextEntry autoCapitalize="none" autoCorrect={false} />
              <Btn kind="primary" label={busy ? 'Checking…' : 'Turn off'} disabled={!passphrase || busy} onPress={() => run(() => security.disable(passphrase), 'Protection is off.')} />
            </>
          ) : null}
        </>
      ) : open ? (
        <>
          <Field label={`Passphrase (at least ${MIN_LENGTH} characters)`} value={passphrase} onChangeText={setPassphrase} secureTextEntry autoCapitalize="none" autoCorrect={false} />
          <Field label="Repeat passphrase" value={again} onChangeText={setAgain} secureTextEntry autoCapitalize="none" autoCorrect={false} />
          {passphrase && tooShort ? <Txt v="small" color="warnText">{`Use at least ${MIN_LENGTH} characters. A few random words works well.`}</Txt> : null}
          {again && mismatch ? <Txt v="small" color="warnText">The two passphrases do not match.</Txt> : null}
          <Row>
            <Btn kind="outline" label="Cancel" onPress={() => setOpen(false)} style={{ flex: 1 }} />
            <Btn label={busy ? 'Encrypting…' : 'Encrypt'} disabled={tooShort || mismatch || busy} onPress={() => run(() => security.enable(passphrase), 'This device is now encrypted.')} style={{ flex: 1 }} />
          </Row>
        </>
      ) : (
        <Btn label="Turn on protection" onPress={() => setOpen(true)} />
      )}
      <Result note={note} />
    </Card>
  );
}

/** Export, encrypted export, restore and delete. */
export function BackupAndDelete({ joining }: { joining?: boolean }) {
  const { kernel, restore, wipe, now } = useKernel();
  const [exportPass, setExportPass] = useState('');
  const [restorePass, setRestorePass] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [note, setNote] = useState<Note>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const exportPlain = () => saveText('eatos-backup.json', JSON.stringify(makeBackup(kernel.events, now), null, 2));
  const exportEncrypted = async () => {
    setBusy(true);
    try {
      const text = await encryptBackup(kernel.events, exportPass, randomBytes, now);
      await saveText('eatos-backup.encrypted.json', text);
      setExportPass('');
      setNote({ tone: 'ok', text: 'Encrypted backup saved. Keep the passphrase safe: it cannot be recovered.' });
    } finally {
      setBusy(false);
    }
  };

  const tryRestore = async (text: string, passphrase?: string) => {
    setBusy(true);
    try {
      const events = await readBackup(text, passphrase);
      const added = restore(events);
      setPending(null);
      setRestorePass('');
      setNote({ tone: 'ok', text: added ? `Restored ${added} records.` : 'Already up to date. Nothing new in that backup.' });
    } catch (e) {
      if (e instanceof BackupError && e.code === 'needs-passphrase') {
        setPending(text);
        setNote({ tone: 'warn', text: 'This backup is encrypted. Enter its passphrase to restore it.' });
      } else {
        setNote({ tone: 'warn', text: e instanceof BackupError ? e.message : 'Could not read that file.' });
      }
    } finally {
      setBusy(false);
    }
  };

  const choose = async () => {
    const f = await pickTextFile().catch(() => undefined);
    if (f) await tryRestore(f.text);
  };

  if (joining) {
    return (
      <Card>
        <Txt v="h3">Restore from a backup</Txt>
        <Txt v="small">Choose a backup file you exported earlier, encrypted or not.</Txt>
        <Btn small label="Choose backup file" onPress={choose} />
        {pending ? (
          <>
            <Field label="Backup passphrase" value={restorePass} onChangeText={setRestorePass} secureTextEntry autoCapitalize="none" autoCorrect={false} />
            <Btn small label={busy ? 'Opening…' : 'Restore'} disabled={!restorePass || busy} onPress={() => tryRestore(pending, restorePass)} />
          </>
        ) : null}
        <Result note={note} />
      </Card>
    );
  }

  return (
    <Section title="Your data">
      <Txt v="small">{`${kernel.events.length} events stored on this device.`}</Txt>
      <Card>
        <Txt v="h3">Back up</Txt>
        <Row wrap>
          <Btn small kind="outline" label="Export backup" onPress={exportPlain} />
        </Row>
        <Field label="Passphrase for an encrypted backup" value={exportPass} onChangeText={setExportPass} secureTextEntry autoCapitalize="none" autoCorrect={false} />
        <Btn small kind="outline" label={busy ? 'Encrypting…' : 'Export encrypted backup'} disabled={exportPass.length < MIN_LENGTH || busy} onPress={exportEncrypted} />
        <Txt v="h3" style={{ paddingTop: 8 }}>Restore</Txt>
        <Btn small kind="outline" label="Restore from backup" onPress={choose} />
        {pending ? (
          <>
            <Field label="Backup passphrase" value={restorePass} onChangeText={setRestorePass} secureTextEntry autoCapitalize="none" autoCorrect={false} />
            <Btn small label={busy ? 'Opening…' : 'Restore'} disabled={!restorePass || busy} onPress={() => tryRestore(pending, restorePass)} />
          </>
        ) : null}
        <Result note={note} />
      </Card>
      <Card>
        <Txt v="h3">Delete</Txt>
        <Txt v="small">Erases everything EatOS stored on this device, and on your sync server if sync is on. This cannot be undone.</Txt>
        {confirm ? (
          <Btn
            kind="primary"
            label={busy ? 'Deleting…' : 'Yes, delete everything'}
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              await wipe();
              setBusy(false);
              setConfirm(false);
              router.replace('/onboarding');
            }}
          />
        ) : (
          <Btn kind="ghost" label="Delete all data" onPress={() => setConfirm(true)} />
        )}
      </Card>
    </Section>
  );
}
