# HƯỚNG DẪN CHI TIẾT TÍCH HỢP TÍNH NĂNG ANNOTATION (GHI CHÚ BẢN THẢO)

Tài liệu này hướng dẫn chi tiết cách thức vận hành luồng dữ liệu (Data Flow) của tính năng **Annotation (Đánh dấu trực tiếp trên trang truyện)** từ lúc tương tác Click trên **Next.js Frontend** cho đến khi truyền dữ liệu và lưu trữ dưới Database thông qua **.NET 8 Backend (GraphQL)**.

---

## 1. TỔNG QUAN LUỒNG DỮ LIỆU (DATA FLOW)

Sơ đồ tuần tự thể hiện sự giao tiếp giữa Frontend và Backend khi tạo mới một ghi chú:

```
[Người dùng Click] ──(1. Tính tọa độ %)──> [Next.js Frontend]
                                                  │
                                          (2. Gọi GraphQL Mutation)
                                                  │
                                                  ▼
                                          [HotChocolate API Gateway]
                                                  │
                                            (3. Giải mã JWT lấy UserId)
                                                  │
                                                  ▼
                                          [AnnotationService.cs]
                                                  │
                                            (4. Lưu DB qua UoW)
                                                  │
                                                  ▼
[Giao diện vẽ Marker] <──(5. Trả về Response)── [SQL Server Database]
```

---

## 2. PHẦN A: BÊN FRONTEND (FE) DÙNG GÌ?

### A.1. Cấu trúc dữ liệu Mock hiện tại
Trong file `lib/mock-data.ts`, thực thể `Annotation` được mô hình hóa như sau:

```typescript
export interface Annotation {
  id: string;          // ID duy nhất của ghi chú
  pageId: string;      // ID của trang truyện đang được chú thích
  x: number;           // Tọa độ X (tỷ lệ % từ 0 đến 100)
  y: number;           // Tọa độ Y (tỷ lệ % từ 0 đến 100)
  width: number;       // Chiều rộng vùng chọn (dành cho khoanh vùng hình chữ nhật)
  height: number;      // Chiều cao vùng chọn
  type: 'dialogue' | 'art' | 'pacing' | 'general'; // Phân loại lỗi
  content: string;     // Nội dung góp ý chi tiết từ Editor
  author: string;      // Tên người tạo ghi chú
  authorRole: UserRole;// Vai trò người tạo ('editor' | 'mangaka')
  createdAt: string;   // Thời gian tạo
  resolved: boolean;   // Trạng thái đã xử lý xong hay chưa
}
```

### A.2. Thuật toán tính toán tọa độ tương đối (%) trên ảnh
Để đảm bảo các điểm chấm đỏ (Markers) hiển thị đúng vị trí trên mọi kích thước màn hình (Responsive), chúng ta **không sử dụng tọa độ Pixel (px)** mà phải sử dụng **tọa độ tỷ lệ phần trăm (%)** so với khung chứa ảnh (`relative container`).

Khi Editor click chuột vào ảnh trong file `app/editor/review/page.tsx`, ta tính toán như sau:

```typescript
const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!annotationMode) return;

  // Lấy ra hình chữ nhật bao quanh khung chứa ảnh hiện tại trên màn hình
  const rect = e.currentTarget.getBoundingClientRect();

  // clientX/clientY: Tọa độ click của chuột so với viewport
  // rect.left/rect.top: Khoảng cách từ lề trái/trên của viewport đến khung ảnh
  // rect.width/rect.height: Kích thước hiển thị thực tế của khung ảnh trên trình duyệt
  const xPercentage = ((e.clientX - rect.left) / rect.width) * 100;
  const yPercentage = ((e.clientY - rect.top) / rect.height) * 100;

  // Lưu tọa độ phần trăm vào state tạm thời để truyền xuống BE khi gửi Form
  setTempCoordinates({
    x: parseFloat(xPercentage.toFixed(2)), // Làm tròn 2 chữ số thập phân
    y: parseFloat(yPercentage.toFixed(2))
  });

  setIsAddAnnotationOpen(true); // Mở Dialog nhập nội dung phản hồi
};
```

---

## 3. PHẦN B: TRUYỀN GÌ XUỐNG BACKEND (BE)?

Khi người dùng nhấn nút **"Thêm ghi chú"** trên Dialog, Frontend sẽ thực hiện một yêu cầu **GraphQL Mutation** gửi đến Backend.

### B.1. Yêu cầu GraphQL Mutation Payload
Dữ liệu JSON gửi đi có cấu trúc như sau:

```graphql
mutation CreateAnnotation($input: CreateAnnotationRequestInput!) {
  createAnnotation(input: $input) {
    id
    pageId
    userId
    userName
    content
    x
    y
    createdAt
  }
}
```

*Biến số (`variables`) đính kèm:*
```json
{
  "input": {
    "pageId": "3fa85f64-5717-4562-b3fc-2c963f66afa6", // ID của Page trong DB
    "content": "Sửa nét vẽ mắt nhân vật tại panel này cho sắc nét hơn", // Góp ý
    "x": 20.45, // Tọa độ X tính bằng % (Double trong C#)
    "y": 15.80  // Tọa độ Y tính bằng % (Double trong C#)
  }
}
```

> ⚠️ **LƯU Ý QUAN TRỌNG VỀ AUTHENTICATION (XÁC THỰC):**
> Frontend **không được truyền `UserId`** trong body request để tránh lỗ hổng giả mạo người dùng (Id spoofing). 
> Token JWT của người dùng đăng nhập phải được gửi trong header HTTP:
> `Authorization: Bearer <JWT_TOKEN>`

---

## 4. PHẦN C: BÊN BACKEND (BE) TIẾP NHẬN NHƯ THẾ NÀO?

### C.1. DTO đầu vào (Data Transfer Object)
Backend tiếp nhận dữ liệu thông qua Record C# sau trong file `CreateAnnotationRequest.cs`:

```csharp
namespace MMS.Application.DTOs.Annotation;

public record CreateAnnotationRequest(
    Guid PageId,     // Trùng khớp với pageId truyền từ FE
    string Content,  // Trùng khớp với content từ FE
    double X,        // Tọa độ X dạng số thực Double
    double Y         // Tọa độ Y dạng số thực Double
);
```

### C.2. Giải mã xác thực lấy UserId
Trong file `AnnotationMutations.cs`, Backend giải mã token JWT đính kèm trong request để lấy ra ID thực của người dùng đang đăng nhập:

```csharp
[Authorize(Roles = new[] { "Mangaka", "TantouEditor" })] // Kiểm tra quyền truy cập
public async Task<AnnotationResponse> CreateAnnotation(
    [Service] IAnnotationService annotationService,
    ClaimsPrincipal claimsPrincipal, // Chứa thông tin giải mã từ Token JWT
    CreateAnnotationRequest input)
{
    // Lấy UserId trực tiếp từ Claims đã được xác thực an toàn
    var userId = GraphQLHelper.GetCurrentUserId(claimsPrincipal);
    
    return await annotationService.CreateAsync(userId, input);
}
```

### C.3. Lưu trữ Database và Phản hồi
File `AnnotationService.cs` tiến hành ánh xạ dữ liệu và lưu xuống SQL Server:

```csharp
public async Task<AnnotationResponse> CreateAsync(Guid userId, CreateAnnotationRequest request)
{
    var annotation = request.Adapt<Annotation>(); // Ánh xạ tự động bằng Mapster
    annotation.Id = Guid.NewGuid();
    annotation.UserId = userId; // Gán UserId lấy từ Token

    await _uow.Annotations.AddAsync(annotation); // Thêm vào Repository
    await _uow.SaveChangesAsync(); // Commit Transaction xuống Database

    // Nạp lại thông tin kèm User để lấy tên người tạo (UserName) hiển thị ở FE
    var annotations = await _uow.Annotations.GetByPageIdAsync(annotation.PageId);
    var created = annotations.First(a => a.Id == annotation.Id);
    
    return created.Adapt<AnnotationResponse>();
}
```

---

## 5. KẾT LUẬN: ĐỀ XUẤT CÁC BƯỚC ĐỂ BẠN HOÀN THÀNH TASK

Để biến trang giao diện Mock hiện tại thành tính năng thật, bạn hãy thực hiện theo lộ trình 3 bước sau:

1.  **Bước 1: Sửa lại phần tính toán click chuột trên UI `app/editor/review/page.tsx`**
    *   Thêm hàm `handleCanvasClick` để tính tọa độ `%` chính xác khi người dùng click vào ảnh bản thảo.
    *   Lưu trữ tọa độ đó vào State tạm thời `tempCoords`.
2.  **Bước 2: Viết hàm gọi API GraphQL**
    *   Tạo file service gọi API hoặc viết trực tiếp lệnh `fetch()` đến địa chỉ cổng GraphQL của Backend (Ví dụ: `http://localhost:5000/graphql`).
    *   Gửi kèm header `Authorization: Bearer <token_jwt>`.
3.  **Bước 3: Cập nhật State động của React**
    *   Khi tải trang, gọi query `GetAnnotationsByPage` và nạp vào state `annotations` thay vì dùng dữ liệu Mock tĩnh.
    *   Khi tạo thành công ghi chú mới từ Dialog, thêm kết quả trả về của Mutation vào state để dấu chấm mới lập tức hiện lên màn hình.
