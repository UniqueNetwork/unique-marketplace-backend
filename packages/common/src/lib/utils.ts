export const formatCrossAccount = (address: [string, bigint]): { sub: string; eth: string } => {
  return {
    eth: address[0],
    sub: `0x${address[1].toString(16).padStart(64, '0')}`,
  };
};
