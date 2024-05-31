export const TKN = (float: number | string, power: number) => {
  const [integerPart, fractionalPart = ""] = float.toString().split(".");
  const shift = Math.min(fractionalPart.length, power);
  let newInteger = integerPart + fractionalPart.substring(0, shift);
  newInteger += "0".repeat(power - shift);

  return BigInt(newInteger);
};
