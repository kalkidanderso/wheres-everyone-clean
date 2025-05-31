export const formatLastUpdated = (timestamp: number): string => {
    const diff = Math.floor((Date.now() - timestamp) / 60000);
    if (diff < 1) return 'Just now';
    if (diff === 1) return '1 minute ago';
    return `${diff} minutes ago`;
  };