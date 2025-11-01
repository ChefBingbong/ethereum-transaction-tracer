import { type Address, padHex } from 'viem'

export enum PrecompileId {
  Ecrecover = 'Ecrecover',
  Sha256 = 'Sha256',
  Ripemd160 = 'Ripemd160',
  Identity = 'Identity',
  // TO-DO

  //   ModExp = 'ModExp',
  //   Bn128Add = 'Bn128Add',
  //   Bn128Mul = 'Bn128Mul',
  //   Bn128Pairing = 'Bn128Pairing',
  //   Blake2f = 'Blake2f',
  //   KzgPointEvaluation = 'KzgPointEvaluation',
}

export const PRECOMPILE_ADDRESS: Record<PrecompileId, Address> = {
  [PrecompileId.Ecrecover]: padHex('0x1', { size: 20 }),
  [PrecompileId.Sha256]: padHex('0x2', { size: 20 }),
  [PrecompileId.Ripemd160]: padHex('0x3', { size: 20 }),
  [PrecompileId.Identity]: padHex('0x4', { size: 20 }),
  // TO-DO

  //   [PrecompileId.ModExp]: padHex('0x5', { size: 20 }),
  //   [PrecompileId.Bn128Add]: padHex('0x6', { size: 20 }),
  //   [PrecompileId.Bn128Mul]: padHex('0x7', { size: 20 }),
  //   [PrecompileId.Bn128Pairing]: padHex('0x8', { size: 20 }),
  //   [PrecompileId.Blake2f]: padHex('0x9', { size: 20 }),
  //   [PrecompileId.KzgPointEvaluation]: padHex('0xA', { size: 20 }),
}

export const PRECOMPILE_NAME: Record<PrecompileId, string> = {
  [PrecompileId.Ecrecover]: 'ecrecover',
  [PrecompileId.Sha256]: 'sha256',
  [PrecompileId.Ripemd160]: 'ripemd160',
  [PrecompileId.Identity]: 'dataCopy',
  // TO-DO

  //   [PrecompileId.ModExp]: 'modexp',
  //   [PrecompileId.Bn128Add]: 'alt_bn128_add',
  //   [PrecompileId.Bn128Mul]: 'alt_bn128_mul',
  //   [PrecompileId.Bn128Pairing]: 'alt_bn128_pairing',
  //   [PrecompileId.Blake2f]: 'blake2f',
  //   [PrecompileId.KzgPointEvaluation]: 'kzg_point_evaluation',
}

export const ALL_PRECOMPILE_ADDRESSES: Address[] =
  Object.values(PRECOMPILE_ADDRESS)

export function isPrecompileSource(addr: Address) {
  return ALL_PRECOMPILE_ADDRESSES.includes(addr)
}
