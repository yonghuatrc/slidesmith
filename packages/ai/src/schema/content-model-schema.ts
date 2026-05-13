/**
 * JSON Schema for structured output from AI providers.
 * Maps to ContentModel types for function-calling / JSON mode.
 */
export const CONTENT_MODEL_JSON_SCHEMA = {
  type: 'object',
  properties: {
    slides: {
      type: 'array',
      description: 'Array of slides in the presentation',
      items: {
        type: 'object',
        properties: {
          layout: {
            type: 'string',
            enum: [
              'cover',
              'hero-top',
              'three-column',
              'symmetric',
              'waterfall',
              'comparison',
              'quote',
              'section-divider',
            ],
            description: 'Layout type for the slide',
          },
          blocks: {
            type: 'array',
            description: 'Content blocks for the slide',
            items: {
              type: 'object',
              oneOf: [
                {
                  // Text block
                  properties: {
                    type: { type: 'string', enum: ['text'] },
                    style: { type: 'string', enum: ['heading', 'body', 'list-item'] },
                    content: { type: 'string', minLength: 1 },
                    level: { type: 'integer', enum: [1, 2, 3, 4] },
                    listType: { type: 'string', enum: ['unordered', 'ordered'] },
                  },
                  required: ['type', 'style', 'content'],
                  additionalProperties: false,
                },
                {
                  // Table block
                  properties: {
                    type: { type: 'string', enum: ['table'] },
                    headers: { type: 'array', items: { type: 'string' } },
                    rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
                    caption: { type: 'string' },
                  },
                  required: ['type', 'headers', 'rows'],
                  additionalProperties: false,
                },
                {
                  // Code block
                  properties: {
                    type: { type: 'string', enum: ['code'] },
                    language: { type: 'string' },
                    code: { type: 'string' },
                    caption: { type: 'string' },
                  },
                  required: ['type', 'language', 'code'],
                  additionalProperties: false,
                },
                {
                  // Image block
                  properties: {
                    type: { type: 'string', enum: ['image'] },
                    src: { type: 'string', minLength: 1 },
                    alt: { type: 'string' },
                    caption: { type: 'string' },
                  },
                  required: ['type', 'src', 'alt'],
                  additionalProperties: false,
                },
                {
                  // Quote block
                  properties: {
                    type: { type: 'string', enum: ['quote'] },
                    text: { type: 'string', minLength: 1 },
                    attribution: { type: 'string' },
                  },
                  required: ['type', 'text'],
                  additionalProperties: false,
                },
                {
                  // Two-column block
                  properties: {
                    type: { type: 'string', enum: ['two-column'] },
                    leftHeader: { type: 'string' },
                    leftItems: { type: 'array', items: { type: 'string' } },
                    rightHeader: { type: 'string' },
                    rightItems: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['type', 'leftHeader', 'leftItems', 'rightHeader', 'rightItems'],
                  additionalProperties: false,
                },
              ],
            },
          },
          speakerNotes: {
            type: 'string',
            description: 'Optional speaker notes for the slide',
          },
          subtitle: {
            type: 'string',
            description: 'Optional subtitle for the slide',
          },
          footer: {
            type: 'string',
            description: 'Optional footer text for the slide',
          },
          background: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['color', 'image'] },
              value: { type: 'string', minLength: 1 },
              opacity: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['type', 'value'],
          },
        },
        required: ['layout', 'blocks'],
        additionalProperties: false,
      },
    },
  },
  required: ['slides'],
  additionalProperties: false,
};
