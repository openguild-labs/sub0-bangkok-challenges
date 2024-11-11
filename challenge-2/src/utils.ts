import { decodeAddress } from 'dedot/utils';
/**
 * Format on=chain balance
 *
 * @param balance
 * @param decimal
 */
export const formatBalance = (balance: bigint, decimal: number = 12): string => {
  return (parseFloat(balance.toString()) / Math.pow(10, decimal)).toString();
};

export const parseAmount = (amount: number, decimals: number): bigint => {
  return BigInt(amount) * BigInt(Math.pow(10, decimals));
}; 
/**
 * Validate a Polkadot address
 *
 * @param addressToCheck
 */
export const validateAddress = (addressToCheck: string) => {
  try {
    return !!decodeAddress(addressToCheck);
  } catch (e) {
    return false;
  }
};
