import type { Address } from 'viem'
import { toAddr } from './utils'

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
  [PrecompileId.Ecrecover]: toAddr(1),
  [PrecompileId.Sha256]: toAddr(2),
  [PrecompileId.Ripemd160]: toAddr(3),
  [PrecompileId.Identity]: toAddr(4),
  // TO-DO

  //   [PrecompileId.ModExp]: toAddr(5),
  //   [PrecompileId.Bn128Add]: toAddr(6),
  //   [PrecompileId.Bn128Mul]: toAddr(7),
  //   [PrecompileId.Bn128Pairing]: toAddr(8),
  //   [PrecompileId.Blake2f]: toAddr(9),
  //   [PrecompileId.KzgPointEvaluation]: toAddr(10),
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

export const ALL_PRECOMPILE_ADDRESSES: Address[] = Object.values(PRECOMPILE_ADDRESS)

export function isPrecompileSource(addr: Address) {
  return ALL_PRECOMPILE_ADDRESSES.includes(addr)
}
