// Static QR code generator - no rotation, always the same QR code
export const useQRRefresh = () => {
  // Generate static QR value without timestamp
  const generateQRValue = (classId: string) => {
    // Check if we're in the Lovable editor preview environment
    const isLovablePreview = window.location.hostname.includes('lovableproject.com');
    
    // Use public URL when in editor preview, otherwise use current origin
    const baseUrl = isLovablePreview 
      ? 'https://clocked-teacher-dashboard.lovable.app'
      : window.location.origin;
    
    // QR code URL format: /confirm-attendance/:classId (no timestamp parameter)
    // Mobile app should extract classId from URL and call clock-in-via-qr Edge Function
    const qrUrl = `${baseUrl}/confirm-attendance/${classId}`;
    console.log('Generated static QR URL:', qrUrl, '(isLovablePreview:', isLovablePreview, ')');
    
    return qrUrl;
  };

  return {
    generateQRValue
  };
};