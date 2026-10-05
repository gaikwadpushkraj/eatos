import { useState } from 'react';
import { View } from 'react-native';
import { VaultError } from '@eatos/core';
import { useLock } from './kernel';
import { Btn, Card, Field, Screen, Txt } from './ui';

/** Shown instead of the app while device protection is on and the passphrase has not been entered. */
export function Unlock() {
  const { unlock, eraseLocked } = useLock();
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmErase, setConfirmErase] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await unlock(passphrase);
    } catch (e) {
      setError(e instanceof VaultError && e.code === 'wrong-passphrase' ? 'That passphrase is not right.' : 'Could not unlock. Try again.');
      setBusy(false);
    }
  };

  return (
    <Screen maxWidth={480}>
      <View style={{ gap: 6, paddingTop: 40 }}>
        <Txt v="mono">EATOS · LOCKED</Txt>
        <Txt v="h1">Enter your passphrase</Txt>
        <Txt v="body" color="muted">Your meals, pantry and health data are encrypted on this device.</Txt>
      </View>
      <Field label="Passphrase" value={passphrase} onChangeText={setPassphrase} secureTextEntry autoCapitalize="none" autoCorrect={false} onSubmitEditing={submit} autoFocus />
      {error ? <Txt v="small" color="danger">{error}</Txt> : null}
      <Btn label={busy ? 'Unlocking…' : 'Unlock'} disabled={!passphrase || busy} onPress={submit} />
      <Card tone="soft">
        <Txt v="h3">Forgot it?</Txt>
        <Txt v="small">There is no way to recover an encrypted device without the passphrase. You can erase this device and start over, or restore from a backup afterwards.</Txt>
        {confirmErase ? <Btn kind="primary" label="Yes, erase this device" onPress={() => eraseLocked()} /> : <Btn kind="outline" label="Erase this device" onPress={() => setConfirmErase(true)} />}
      </Card>
    </Screen>
  );
}
