import Anthropic from '@anthropic-ai/sdk';
import { getSecret, setSecret } from './secure';
import type { LlmCompleter, PhotoCompleter } from '@eatos/core';

export interface LlmConfig {
  enabled: boolean;
  /** The person's own Anthropic API key. Stored on this device only. */
  apiKey: string;
  model: string;
}

export const DEFAULT_MODEL = 'claude-sonnet-5-5';
export const defaultLlmConfig: LlmConfig = { enabled: false, apiKey: '', model: DEFAULT_MODEL };

const KEY = 'eatos.llm.config';

export async function loadLlmConfig(): Promise<LlmConfig> {
  return { ...defaultLlmConfig, ...(await getSecret<Partial<LlmConfig>>(KEY, {})) };
}

export async function saveLlmConfig(c: LlmConfig): Promise<void> {
  await setSecret(KEY, c);
}

export function llmReady(c: LlmConfig): boolean {
  return c.enabled && c.apiKey.trim().length > 10;
}

/**
 * Sends only the person's question to Claude and asks for the strict JSON
 * query the kernel expects. Low effort and a short output: this is a
 * tiny classification step, not a conversation. A refusal or any error
 * makes the caller fall back to the on-device parser.
 */
export function makeCompleter(config: LlmConfig): LlmCompleter | undefined {
  if (!llmReady(config)) return undefined;
  // The key is the person's own and never leaves their device except to Anthropic.
  const client = new Anthropic({ apiKey: config.apiKey.trim(), dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 10_000 });
  return async ({ system, user, schema }) => {
    const response = await client.messages.create({
      model: config.model || DEFAULT_MODEL,
      max_tokens: 400,
      system,
      messages: [{ role: 'user', content: user }],
      output_config: { effort: 'low', format: { type: 'json_schema', schema: schema as unknown as Record<string, unknown> } },
    });
    if (response.stop_reason === 'refusal') throw new Error('The model declined this request');
    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') throw new Error('The model returned no text');
    return block.text;
  };
}

/**
 * Photo add: sends one resized photo to Claude with the user's own key and
 * asks for the strict JSON the kernel validates. Only the photo and a fixed
 * instruction are sent: no profile, allergies, pantry or history.
 */
export function makePhotoCompleter(config: LlmConfig): PhotoCompleter | undefined {
  if (!llmReady(config)) return undefined;
  const client = new Anthropic({ apiKey: config.apiKey.trim(), dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 35_000 });
  return async ({ system, user, schema, image }) => {
    const response = await client.messages.create({
      model: config.model || DEFAULT_MODEL,
      max_tokens: 1500,
      system,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: image.mediaType as 'image/jpeg', data: image.base64 } },
            { type: 'text', text: user },
          ],
        },
      ],
      output_config: { effort: 'low', format: { type: 'json_schema', schema: schema as unknown as Record<string, unknown> } },
    });
    if (response.stop_reason === 'refusal') throw new Error('The model declined to read this photo.');
    const block = response.content.find((b) => b.type === 'text');
    if (!block || block.type !== 'text') throw new Error('The model returned no text.');
    return block.text;
  };
}
