import { useState } from 'react';
import { View } from 'react-native';
import { useKernel } from './kernel';
import { validCode } from './sync';
import { Btn, Card, Field, Row, Toggle, Txt } from './ui';
import { timeLabel } from './format';

function randomCode(): string {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);
}

/** Sync across devices: off by default, data stays local until turned on. */
export function SyncSettings({ joining }: { joining?: boolean }) {
  const { kernel, sync } = useKernel();
  const [url, setUrl] = useState(sync.config.url || 'http://localhost:8787');
  const [code, setCode] = useState(sync.config.code || (joining ? '' : randomCode()));
  const valid = /^https?:\/\/.+/.test(url.trim()) && validCode(code.trim());
  const on = sync.config.enabled;
  const s = sync.status;

  const enable = async () => {
    await sync.setConfig({ enabled: true, url: url.trim(), code: code.trim() });
  };

  return (
    <Card>
      <Txt v="h3">Sync across devices</Txt>
      <Txt v="small">
        {joining
          ? 'Enter the server and sync code shown in Profile on your other device.'
          : 'Off by default. When on, your event log is copied to your EatOS server so your phone and computer stay in step. Use the same code on each device.'}
      </Txt>
      {on && !joining ? (
        <View style={{ gap: 8 }}>
          <Txt v="mono">{`SERVER ${sync.config.url}`}</Txt>
          <Txt v="mono">{`CODE ${sync.config.code}`}</Txt>
          <Txt v="small" color={s.state === 'error' ? 'danger' : 'muted'}>
            {s.state === 'syncing' ? 'Syncing…' : s.state === 'error' ? `Could not sync: ${s.message}` : s.lastSyncAt ? `Last synced ${timeLabel(kernel, s.lastSyncAt)}. ${s.message ?? ''}` : 'Waiting for first sync'}
          </Txt>
          <Row wrap>
            <Btn small label="Sync now" onPress={() => sync.now()} />
            <Btn small kind="ghost" label="Turn off" onPress={() => sync.setConfig({ ...sync.config, enabled: false })} />
          </Row>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Field label="Server address" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} placeholder="http://192.168.1.20:8787" />
          <Field label="Sync code" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} placeholder="At least 4 letters or numbers" />
          {joining && s.state === 'error' ? <Txt v="small" color="danger">{`Could not sync: ${s.message}`}</Txt> : null}
          {joining && s.state === 'syncing' ? <Txt v="small">Syncing…</Txt> : null}
          <Btn label={joining ? 'Connect' : 'Turn on sync'} disabled={!valid} onPress={enable} />
        </View>
      )}
      {!joining ? <Toggle label="Sync is on" value={on} onChange={(v) => (v ? valid && enable() : sync.setConfig({ ...sync.config, enabled: false }))} /> : null}
    </Card>
  );
}
