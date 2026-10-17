'use strict';
/* Skin scan on the server: the face photo is sent to Claude, which returns playful, non-medical scores
   and tips as JSON. The photo is never stored. Needs ANTHROPIC_API_KEY and SKIN_SCAN_MODEL; without them
   the app analyses the photo on the phone instead. */
const Engine = require('../public/engine.js');

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['face', 'skinType', 'scores', 'headline', 'summary', 'tips', 'ritual', 'products'],
  properties: {
    face: { type: 'boolean', description: 'True if one human face is clearly visible.' },
    skinType: { type: 'string', enum: ['dry', 'normal', 'combination', 'oily', 'sensitive'] },
    scores: {
      type: 'object',
      additionalProperties: false,
      required: Engine.SCAN_KEYS,
      properties: Object.fromEntries(Engine.SCAN_KEYS.map((k) => [k, { type: 'integer', minimum: 0, maximum: 100 }])),
    },
    headline: { type: 'string', description: 'Up to 8 words, warm and playful.' },
    summary: { type: 'string', description: 'Two short sentences.' },
    tips: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string' } },
    ritual: { type: 'string', enum: Engine.RITUALS.map((r) => r.id) },
    products: { type: 'array', minItems: 1, maxItems: 2, items: { type: 'string' } },
  },
};

function createSkinAnalyzer(env, log = console) {
  if (!env.ANTHROPIC_API_KEY || !env.SKIN_SCAN_MODEL) return null;
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 60_000, maxRetries: 1 });

  return async function analyze(jpeg, { lang, products }) {
    const catalog = products.map((p) => `${p.id}: ${p.name} (${p.sub})`).join('\n');
    const system = `You are the skin coach of Seasonly, a Paris skincare brand. You look at a selfie and give a light, playful, encouraging reading of how the skin looks today.
This is for fun and inspiration only: never diagnose or name a medical condition, never mention age, weight or attractiveness, and stay kind.
Score each dimension from 0 to 100, where higher means it looks better today (calm = little redness).
Pick one ritual and one or two products from the lists below that fit what you see.
Write headline, summary and tips in ${lang === 'en' ? 'English' : 'French'}, addressing the person directly${lang === 'en' ? '' : ' with "vous"'}.
If no single face is clearly visible, set face to false and give neutral scores of 60.

Rituals: ${Engine.RITUALS.map((r) => `${r.id} (${r.name})`).join(', ')}
Products:
${catalog}`;
    const response = await client.beta.messages.create({
      model: env.SKIN_SCAN_MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpeg.toString('base64') } },
          { type: 'text', text: 'Read my skin for today.' },
        ],
      }],
    });
    if (response.stop_reason === 'refusal') throw Object.assign(new Error('refused'), { code: 'refused' });
    const block = response.content.find((b) => b.type === 'text');
    let out;
    try { out = JSON.parse(block ? block.text : ''); } catch { throw Object.assign(new Error('Unreadable scan result.'), { code: 'parse' }); }
    log.info?.(`[skin-scan] ${response.usage ? `${response.usage.input_tokens} in / ${response.usage.output_tokens} out` : 'done'}`);
    return out;
  };
}

module.exports = { createSkinAnalyzer };
