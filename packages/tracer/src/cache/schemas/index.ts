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
  result: z.array(
    z.object({
      SourceCode: z.string(),
      ABI: z.string(),
      ContractName: z.string(),
      CompilerVersion: z.string(),
      OptimizationUsed: z.string(),
      Runs: z.string(),
      ConstructorArguments: z.string(),
      EVMVersion: z.string(),
      Library: z.string(),
      LicenseType: z.string(),
      Proxy: z.string(),
      Implementation: z.string(),
      SwarmSource: z.string(),
      SimilarMatch: z.string(),
    }),
  ),
})

export const openChainAbiSchema = z.object({
  result: z.object({
    function: z.record(z.string(), z.array(z.object({ name: z.string() })).nullable()),
  }),
})
