import type { Address } from 'viem'

export class AddressSet extends Set<Address> {
  constructor(values?: readonly Address[] | null) {
    super(values?.map((value) => value.toLowerCase() as Address))
  }

  override add(value: Address): this {
    super.add(value.toLowerCase() as Address)
    return this
  }

  override delete(value: Address): boolean {
    return super.delete(value.toLowerCase() as Address)
  }

  override has(value: Address): boolean {
    return super.has(value.toLowerCase() as Address)
  }
}
