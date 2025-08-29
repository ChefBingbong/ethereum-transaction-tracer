import type { Address } from 'viem'
import { toLowerCaseAddress } from './utils'

export class AddressMap<T> extends Map<Address, T> {
  constructor(values?: [Address, T][] | null) {
    super(
      values?.map(([address, value]) => [toLowerCaseAddress(address), value]),
    )
  }

  override set(value: Address, data: T): this {
    super.set(toLowerCaseAddress(value), data)
    return this
  }

  override delete(value: Address): boolean {
    return super.delete(toLowerCaseAddress(value))
  }

  override has(value: Address): boolean {
    return super.has(toLowerCaseAddress(value))
  }

  override get(value: Address): T | undefined {
    return super.get(toLowerCaseAddress(value))
  }
}
