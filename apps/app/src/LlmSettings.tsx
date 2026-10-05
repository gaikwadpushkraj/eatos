import { useEffect, useState } from 'react';
import { defaultLlmConfig, DEFAULT_MODEL, llmReady, loadLlmConfig, saveLlmConfig } from './llm';
import type { LlmConfig } from './llm';
import { Btn, Card, Field, Row, Toggle, Txt } from './ui';

/** Optional: let Claude read free-text requests. Off by default; the on-device parser always works. */
export function LlmSettings() {
  const [config, setConfig] = useState<LlmConfig>(defaultLlmConfig);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadLlmConfig().then(setConfig);
  }, []);

  const update = (c: LlmConfig) => {
    setConfig(c);
    setSaved(false);
  };
  const save = async () => {
    await saveLlmConfig(config);
    setSaved(true);
  };

  return (
    <Card>
      <Txt v="h3">Smarter Ask (optional)</Txt>
      <Txt v="small">
        Let Claude read free-text requests like "something cosy but not heavy, I'm tired". Only the sentence you type is sent to Anthropic, with your own API key. Your profile, allergies, pantry and health data are never sent, and allergies and diets are always enforced on this device. If Claude can't be reached, EatOS uses its on-device reader.
      </Txt>
      <Toggle label="Use Claude for Ask" value={config.enabled} onChange={(enabled) => update({ ...config, enabled })} />
      {config.enabled ? (
        <>
          <Field label="Your Anthropic API key" value={config.apiKey} onChangeText={(apiKey) => update({ ...config, apiKey })} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="sk-ant-…" />
          <Field label="Model" value={config.model} onChangeText={(model) => update({ ...config, model })} autoCapitalize="none" autoCorrect={false} placeholder={DEFAULT_MODEL} />
          <Txt v="small" color="warnText">
            The key is stored on this device. On the web it lives in your browser, so only use a key you can revoke.
          </Txt>
        </>
      ) : null}
      <Row>
        <Btn small label={saved ? 'Saved' : 'Save'} onPress={save} />
        <Txt v="small">{llmReady(config) ? 'Claude will be used for Ask.' : 'On-device reader will be used.'}</Txt>
      </Row>
    </Card>
  );
}
