/**
 * Chuyển đổi URL gốc của Cloudinary thành URL biến thể tối ưu hóa dung lượng.
 * Hỗ trợ các kích thước và nén tự động (f_auto, q_auto).
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  variant: 'thumbnail' | 'medium' | 'large' | 'original' = 'original'
): string {
  if (!url) return '';
  
  // Nếu không phải ảnh lưu trữ trên Cloudinary, trả về URL gốc
  if (!url.includes('cloudinary.com')) return url;

  const transformations = {
    // Thumbnail dọc cho truyện tranh, rộng 200px, tự động chuyển WebP/AVIF, nén tự động q_auto
    thumbnail: 'c_fill,w_200,h_266,f_auto,q_auto',
    // Preview danh sách cỡ vừa
    medium: 'c_limit,w_600,f_auto,q_auto',
    // Bản vẽ nét căng 1200px để làm việc trên canvas chính
    large: 'c_limit,w_1200,f_auto,q_auto',
    // Ảnh gốc không biến đổi
    original: ''
  };

  const transformPart = transformations[variant];
  if (!transformPart) return url;

  // Chèn transformation vào sau phân đoạn '/image/upload/' trong URL của Cloudinary
  return url.replace('/image/upload/', `/image/upload/${transformPart}/`);
}
