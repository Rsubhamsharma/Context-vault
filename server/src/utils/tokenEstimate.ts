export const estimateTokens = (text: string): number => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

export const calculateSavings = (fullTokens: number, optimizedTokens: number): number => {
  if (fullTokens === 0) return 0;
  const savings = ((fullTokens - optimizedTokens) / fullTokens) * 100;
  return Math.round(savings);
};
