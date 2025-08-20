import z from 'zod'

export const fourByteSchema = z.object({
  results: z.array(
    z.object({
      id: z.number(),
      createdAt: z.string(),
      textSignature: z.string(),
      hexSignature: z.string(),
      bytesSignature: z.string(),
    }),
  ),
})

export const etherscanAbiSchema = z.object({
  status: z.string(),
  result: z.string(),
})

export const openChainAbiSchema = z.object({
  result: z.object({
    function: z.record(z.string(), z.array(z.object({ name: z.string() })).nullable()),
  }),
})
